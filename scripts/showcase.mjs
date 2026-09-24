import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const data = JSON.parse(readFileSync(resolve(root, 'data/showcase.json'), 'utf8'));
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

const pages = {
  'showcase/image.md': [
    '# 生图案例', '', '[返回首页](../README.md) · [浏览画廊](../index.html)', '',
    '以下图片均使用本页所列提示词生成。画面比例以实际输出文件为准。', '',
    ...data.images.flatMap(entry => [
      `## ${entry.title}`, '',
      `![${entry.title}](../${entry.image})`, '',
      `${entry.summary} · ${entry.category}`, '',
      `模型：${entry.model} · 服务：${entry.provider} · 请求尺寸：${entry.requestedSize} · 实际输出：${entry.size}`, '',
      '**完整提示词**', '', '```text', entry.prompt, '```', '',
    ]),
  ],
  'showcase/video.md': [
    '# 生视频工作流模板', '', '[返回首页](../README.md) · [浏览画廊](../index.html)', '',
    '从输入素材、镜头运动、主体一致性和收尾方式入手。根据所用模型调整时长与参数。', '',
    ...data.videos.flatMap(entry => [
      `## ${entry.title}`, '', `${entry.summary} · ${entry.category}`, '',
      `- 输入：${entry.input}`, `- 建议格式：${entry.format}`, '',
      '**完整提示词**', '', '```text', entry.prompt, '```', '',
    ]),
  ],
};

for (const [path, lines] of Object.entries(pages)) {
  const file = resolve(root, path);
  const rendered = `${lines.join('\n').trimEnd()}\n`;
  if (mode === '--write') writeFileSync(file, rendered);
  else if (readFileSync(file, 'utf8') !== rendered) throw new Error(`Outdated showcase page: ${path}`);
}
console.log(`Validated ${data.images.length} image cases and ${data.videos.length} video templates (${mode})`);
