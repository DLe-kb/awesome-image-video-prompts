import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const data = JSON.parse(readFileSync(resolve(root, 'data/showcase.json'), 'utf8'));
const cases = JSON.parse(readFileSync(resolve(root, 'data/cases.json'), 'utf8'));
const catalog = JSON.parse(readFileSync(resolve(root, 'data/catalog.json'), 'utf8'));
const mode = process.argv[2] ?? '--check';
if (!['--check', '--write'].includes(mode)) throw new Error('Use --check or --write');
if (data.version !== 1 || !Array.isArray(data.images) || !Array.isArray(data.videos)) throw new Error('Invalid showcase');

const ids = new Set();
for (const entry of [...data.images, ...data.videos]) {
  if (!/^[a-z0-9-]+$/.test(entry.id) || ids.has(entry.id)) throw new Error(`Invalid or duplicate ID: ${entry.id}`);
  ids.add(entry.id);
  for (const key of ['title', 'category', 'summary', 'prompt']) {
    if (typeof entry[key] !== 'string' || !entry[key].trim()) throw new Error(`Missing ${key}: ${entry.id}`);
  }
}
for (const entry of data.images) {
  if (!/^assets\/previews\/[a-z0-9-]+\.webp$/.test(entry.image) || !existsSync(resolve(root, entry.image))) {
    throw new Error(`Missing preview: ${entry.id}`);
  }
  if (!entry.model || !entry.size || !entry.requestedSize || !entry.provider) throw new Error(`Missing generation settings: ${entry.id}`);
}
for (const entry of data.videos) {
  if (!entry.input || !entry.format) throw new Error(`Missing video inputs: ${entry.id}`);
}
if (cases.version !== 1 || !Array.isArray(cases.images) || !Array.isArray(cases.videos)) throw new Error('Invalid cases');
const caseIds = new Set([...cases.images, ...cases.videos].map(entry => entry.id));
if (caseIds.size !== catalog.entries.length || catalog.entries.some(entry => !caseIds.has(entry.id))) {
  throw new Error('Catalog and complete cases must cover the same entries');
}
for (const [kind, entries] of [['image', cases.images], ['video', cases.videos]]) {
  for (const entry of entries) {
    if (ids.has(entry.id)) throw new Error(`Duplicate ID: ${entry.id}`);
    ids.add(entry.id);
    for (const key of ['title', 'category', 'summary', 'prompt', 'image']) {
      if (!entry[key]?.trim()) throw new Error(`Missing ${key}: ${entry.id}`);
    }
    if (!entry.source?.author || !/^https:\/\//.test(entry.source.url)) throw new Error(`Missing attribution: ${entry.id}`);
    if (!existsSync(resolve(root, entry.image))) throw new Error(`Missing preview: ${entry.id}`);
    if (kind === 'video' && (!entry.video || !existsSync(resolve(root, entry.video)))) throw new Error(`Missing video: ${entry.id}`);
    if (/本项目|授权仍待|未验证|未复现|\/Users\/|template\/(?:image|video)-generation\//.test(entry.prompt)) throw new Error(`Unreviewed prompt: ${entry.id}`);
  }
}

const pages = {
  'showcase/image.md': [
    '# 生图案例', '', '[返回首页](../README.md) · [浏览画廊](../index.html)', '',
    '先浏览原创案例，再按来源与题材查找公开收录的案例。来源预览与提示词归原作者所有。', '',
    ...data.images.flatMap(entry => [
      `## ${entry.title}`, '',
      `![${entry.title}](../${entry.image})`, '',
      `${entry.summary} · ${entry.category}`, '',
      `模型：${entry.model} · 服务：${entry.provider} · 请求尺寸：${entry.requestedSize} · 实际输出：${entry.size}`, '',
      '**完整提示词**', '', '```text', entry.prompt, '```', '',
      '**可复用模板**', '', '[浏览生图 Prompt 模板](../templates/image.md)', '',
    ]),
    '## 来源案例', '',
    ...cases.images.flatMap(entry => [
      `### ${entry.title}`, '', `![${entry.title}](../${entry.image})`, '',
      `${entry.summary} · ${entry.category}`, '',
      `来源：[${entry.source.author}](${entry.source.url}) · ${entry.promptCredit}`, '',
      '**完整提示词**', '', '```text', entry.prompt, '```', '',
      '**可复用模板**', '', '[浏览生图 Prompt 模板](../templates/image.md)', '',
    ]),
  ],
  'showcase/video.md': [
    '# 生视频案例', '', '[返回首页](../README.md) · [浏览画廊](../index.html)', '',
    '浏览视频样片、完整提示词及原作者来源。', '',
    ...data.videos.flatMap(entry => [
      `## ${entry.title}`, '', `${entry.summary} · ${entry.category}`, '',
      `- 输入：${entry.input}`, `- 建议格式：${entry.format}`, '',
      '**完整提示词**', '', '```text', entry.prompt, '```', '',
      '**可复用模板**', '', '[浏览生视频 Prompt 模板](../templates/video.md)', '',
    ]),
    '## 来源案例', '',
    ...cases.videos.flatMap(entry => [
      `### ${entry.title}`, '', `![${entry.title}](../${entry.image})`, '',
      `[播放样片](../${entry.video}) · 来源：[${entry.source.author}](${entry.source.url}) · ${entry.promptCredit}`, '',
      `${entry.summary} · ${entry.category}`, '',
      '**完整提示词**', '', '```text', entry.prompt, '```', '',
      '**可复用模板**', '', '[浏览生视频 Prompt 模板](../templates/video.md)', '',
    ]),
  ],
};

for (const [path, lines] of Object.entries(pages)) {
  const file = resolve(root, path);
  const rendered = `${lines.join('\n').trimEnd()}\n`;
  if (mode === '--write') writeFileSync(file, rendered);
  else if (readFileSync(file, 'utf8') !== rendered) throw new Error(`Outdated showcase page: ${path}`);
}
console.log(`Validated ${data.images.length + cases.images.length} image cases and ${data.videos.length + cases.videos.length} video cases (${mode})`);
