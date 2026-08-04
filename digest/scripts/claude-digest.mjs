#!/usr/bin/env node
// claude-digest — Claude Codeセッション履歴から繰り返しパターンを検出するCLI
// 使い方: node claude-digest.mjs [--since 30d] [--project <部分一致>] [--min-count 3] [--top 20] [-o out.md]
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const PROJECTS_DIR = path.join(os.homedir(), ".claude", "projects");

// 承認・相槌として集計から除外する定型返答
const ACK_WORDS = new Set([
  "y", "yes", "ok", "はい", "うん", "1", "2", "3", "4",
  "お願いします", "おねがいします", "進めて", "すすめて", "続けて", "つづけて",
  "次へ", "どうぞ", "それで", "そうして", "了解", "大丈夫です", "いいですよ", "ではそれで",
]);

const SKIP_PREFIXES = [
  "<local-command-caveat",
  "<local-command-stdout",
  "<system-reminder",
  "<task-notification",
  "[Request interrupted",
];

function parseArgs(argv) {
  const opts = { since: "30d", project: null, minCount: 3, top: 20, out: null, all: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--since") opts.since = argv[++i];
    else if (a === "--project") opts.project = argv[++i];
    else if (a === "--min-count") opts.minCount = Number(argv[++i]);
    else if (a === "--top") opts.top = Number(argv[++i]);
    else if (a === "-o" || a === "--output") opts.out = argv[++i];
    else if (a === "--all") opts.all = true;
    else if (a === "--help" || a === "-h") {
      console.log("usage: claude-digest [--since 30d|7d|12h] [--project <substr>] [--min-count N] [--top N] [-o file.md] [--all]");
      process.exit(0);
    }
  }
  return opts;
}

function sinceToDate(spec) {
  const m = /^(\d+)([dwh])$/.exec(spec);
  if (!m) {
    console.error(`--since の形式が不正です: "${spec}" (例: 30d, 2w, 12h)`);
    process.exit(1);
  }
  const n = Number(m[1]);
  const ms = { h: 3600e3, d: 86400e3, w: 7 * 86400e3 }[m[2]];
  return new Date(Date.now() - n * ms);
}

function projectLabel(dirName) {
  return dirName
    .replace(/^-Users-[^-]+-Project-/, "")
    .replace(/^-Users-[^-]+-/, "")
    .replace(/^-/, "");
}

function* iterSessionFiles(cutoff, opts) {
  if (!fs.existsSync(PROJECTS_DIR)) {
    console.error(`${PROJECTS_DIR} が見つかりません`);
    process.exit(1);
  }
  for (const dir of fs.readdirSync(PROJECTS_DIR)) {
    if (!opts.all && dir.startsWith("-private-tmp")) continue;
    const label = projectLabel(dir);
    if (opts.project && !label.includes(opts.project)) continue;
    const full = path.join(PROJECTS_DIR, dir);
    if (!fs.statSync(full).isDirectory()) continue;
    for (const f of fs.readdirSync(full)) {
      if (!f.endsWith(".jsonl")) continue;
      const fp = path.join(full, f);
      if (fs.statSync(fp).mtime < cutoff) continue;
      yield { fp, project: label, session: f.slice(0, 8) };
    }
  }
}

function extract(cutoff, opts) {
  const prompts = [];
  const commands = [];
  let ackCount = 0;
  const sessions = new Set();
  const projects = new Set();

  for (const { fp, project, session } of iterSessionFiles(cutoff, opts)) {
    let content;
    try {
      content = fs.readFileSync(fp, "utf8");
    } catch {
      continue;
    }
    for (const line of content.split("\n")) {
      if (!line) continue;
      let rec;
      try {
        rec = JSON.parse(line);
      } catch {
        continue;
      }
      if (rec.type !== "user" || rec.isSidechain || rec.isMeta) continue;
      const ts = rec.timestamp ? new Date(rec.timestamp) : null;
      if (ts && ts < cutoff) continue;
      const content_ = rec.message?.content;
      const texts =
        typeof content_ === "string"
          ? [content_]
          : Array.isArray(content_)
            ? content_.filter((b) => b?.type === "text").map((b) => b.text ?? "")
            : [];
      for (let t of texts) {
        t = t.trim();
        if (!t) continue;
        const cmd = t.startsWith("<command-")
          ? /<command-name>(\/[\w:-]+)<\/command-name>/.exec(t)
          : /^(\/[\w:-]+)\s*$/.exec(t);
        if (cmd) {
          commands.push({ cmd: cmd[1], project, session });
          sessions.add(`${project}/${session}`);
          projects.add(project);
          continue;
        }
        if (SKIP_PREFIXES.some((p) => t.startsWith(p))) continue;
        sessions.add(`${project}/${session}`);
        projects.add(project);
        const bare = t.toLowerCase().replace(/[。．！!.、,\s]+$/g, "");
        if (ACK_WORDS.has(bare)) {
          ackCount++;
          continue;
        }
        prompts.push({ text: t.replace(/\s+/g, " "), project, session, ts });
      }
    }
  }
  return { prompts, commands, ackCount, sessions, projects };
}

function normalize(text) {
  return text
    .toLowerCase()
    .replace(/```[\s\S]*?```/g, " <code> ")
    .replace(/https?:\/\/\S+/g, " <url> ")
    .replace(/@[\w\-./]+/g, " <file> ")
    .replace(/[\w\-.]+\/[\w\-./]+\.\w+/g, " <file> ")
    .replace(/\d+/g, "<n>")
    .replace(/\s+/g, " ")
    .trim();
}

function bigrams(s) {
  const set = new Set();
  for (let i = 0; i < s.length - 1; i++) set.add(s.slice(i, i + 2));
  return set;
}

function jaccard(a, b) {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  const [small, large] = a.size < b.size ? [a, b] : [b, a];
  for (const g of small) if (large.has(g)) inter++;
  return inter / (a.size + b.size - inter);
}

// 貪欲法クラスタリング: 正規化テキストの文字bigram Jaccard類似度で束ねる
function cluster(prompts) {
  const items = prompts
    .map((p) => ({ ...p, norm: normalize(p.text) }))
    .filter((p) => p.norm.length >= 4 && p.norm.length <= 250)
    .map((p) => ({ ...p, grams: bigrams(p.norm) }));

  const clusters = [];
  for (const item of items) {
    let best = null;
    let bestScore = 0;
    for (const c of clusters) {
      const ratio = item.norm.length / c.rep.norm.length;
      if (ratio < 0.4 || ratio > 2.5) continue;
      const score = jaccard(item.grams, c.rep.grams);
      if (score > bestScore) {
        bestScore = score;
        best = c;
      }
    }
    if (best && bestScore >= 0.5) best.members.push(item);
    else clusters.push({ rep: item, members: [item] });
  }
  return clusters;
}

function countErrors(prompts) {
  const sig = new Map();
  for (const p of prompts) {
    const found = p.text.match(/\b[A-Z][A-Za-z]{2,}(?:Exception|Error)\b/g);
    if (!found) continue;
    for (const s of new Set(found)) {
      if (!sig.has(s)) sig.set(s, { count: 0, projects: new Set() });
      const e = sig.get(s);
      e.count++;
      e.projects.add(p.project);
    }
  }
  return [...sig.entries()].sort((a, b) => b[1].count - a[1].count);
}

function fmtDate(d) {
  return d ? d.toISOString().slice(0, 10) : "?";
}

function truncate(s, n) {
  return s.length > n ? s.slice(0, n) + "…" : s;
}

function report(data, opts, cutoff) {
  const { prompts, commands, ackCount, sessions, projects } = data;
  const lines = [];
  const w = (s = "") => lines.push(s);

  w(`# claude-digest レポート`);
  w();
  w(`期間: ${fmtDate(cutoff)} 〜 ${fmtDate(new Date())} (--since ${opts.since})`);
  w();
  w(`## 概要`);
  w();
  w(`| 項目 | 値 |`);
  w(`|---|---|`);
  w(`| プロジェクト | ${projects.size} |`);
  w(`| セッション | ${sessions.size} |`);
  w(`| プロンプト | ${prompts.length} |`);
  w(`| 承認・相槌 | ${ackCount} |`);
  w();

  const cmdCount = new Map();
  for (const c of commands) {
    if (!cmdCount.has(c.cmd)) cmdCount.set(c.cmd, { count: 0, projects: new Set() });
    const e = cmdCount.get(c.cmd);
    e.count++;
    e.projects.add(c.project);
  }
  w(`## スラッシュコマンド使用回数`);
  w();
  w(`| コマンド | 回数 | プロジェクト |`);
  w(`|---|---|---|`);
  for (const [cmd, e] of [...cmdCount.entries()].sort((a, b) => b[1].count - a[1].count)) {
    w(`| ${cmd} | ${e.count} | ${[...e.projects].join(", ")} |`);
  }
  w();

  w(`## 繰り返し指示 (${opts.minCount}回以上 × 複数セッション)`);
  w();
  const clusters = cluster(prompts)
    .map((c) => {
      const sess = new Set(c.members.map((m) => `${m.project}/${m.session}`));
      const projs = new Set(c.members.map((m) => m.project));
      const dates = c.members.map((m) => m.ts).filter(Boolean).sort((a, b) => a - b);
      return { ...c, sess, projs, first: dates[0], last: dates.at(-1) };
    })
    .filter((c) => c.members.length >= opts.minCount && c.sess.size >= 2)
    .sort((a, b) => b.members.length - a.members.length)
    .slice(0, opts.top);

  if (clusters.length === 0) w(`(該当なし — --min-count を下げてみてください)`);
  for (const c of clusters) {
    w(`### ${truncate(c.rep.text, 80)}`);
    w();
    w(`- 回数: **${c.members.length}** / セッション: ${c.sess.size} / プロジェクト: ${[...c.projs].join(", ")}`);
    w(`- 期間: ${fmtDate(c.first)} 〜 ${fmtDate(c.last)}`);
    const examples = c.members.slice(1, 3).map((m) => truncate(m.text, 100));
    for (const ex of examples) w(`- 例: ${ex}`);
    w();
  }

  const errors = countErrors(prompts).slice(0, 15);
  if (errors.length > 0) {
    w(`## 貼り付けられたエラー (シグネチャ別)`);
    w();
    w(`| シグネチャ | 回数 | プロジェクト |`);
    w(`|---|---|---|`);
    for (const [s, e] of errors) w(`| ${s} | ${e.count} | ${[...e.projects].join(", ")} |`);
    w();
  }

  w(`---`);
  w();
  w(`> 目安: 「繰り返し指示」に載ったものはスキル/ルール化の候補。同じエラーが2回以上出ていたら原因をルール化・ドキュメント化する価値あり。`);
  return lines.join("\n");
}

const opts = parseArgs(process.argv.slice(2));
const cutoff = sinceToDate(opts.since);
const data = extract(cutoff, opts);
const md = report(data, opts, cutoff);
if (opts.out) {
  fs.writeFileSync(opts.out, md);
  console.log(`書き出しました: ${opts.out}`);
} else {
  console.log(md);
}
