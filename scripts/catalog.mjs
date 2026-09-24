import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const data = JSON.parse(readFileSync(resolve(root, 'data/catalog.json'), 'utf8'));
const kinds = { image: '生图', video: '生视频' };
const hosts = new Set(['x.com', 'www.douyin.com', 'youmind.com', 'higgsfield.ai', 'github.com', 'd2245ubjcvacnx.cloudfront.net']);

function checkLink(link, { related = false } = {}) {
  if (!link || typeof link.label !== 'string' || !link.label.trim()) throw new Error('Missing source label');
  const url = new URL(link.url);
  if (url.protocol !== 'https:' || !hosts.has(url.hostname)) throw new Error(`Unsupported source: ${link.url}`);
  if (url.pathname === '/' || url.pathname === '') throw new Error(`Source must point to an entry: ${link.url}`);
  if (url.hostname.endsWith('cloudfront.net') && !related) throw new Error('Media URL cannot be the primary source');
  for (const key of url.searchParams.keys()) {
    if (/token|secret|key|auth|cookie/i.test(key)) throw new Error(`Credential parameter in source: ${url.hostname}`);
  }
}

function validate() {
  if (data.version !== 1 || !Array.isArray(data.entries) || data.entries.length === 0) {
    throw new Error('Invalid catalog version or entries');
  }
  const ids = new Set();
  const titles = new Set();
  for (const entry of data.entries) {
    if (!/^(image|video)-[a-f0-9]{10}$/.test(entry.id) || ids.has(entry.id)) {
      throw new Error(`Invalid or duplicate ID: ${entry.id}`);
    }
    ids.add(entry.id);
    if (!(entry.kind in kinds) || !entry.id.startsWith(`${entry.kind}-`)) throw new Error(`Invalid kind: ${entry.id}`);
    if (!entry.title?.trim() || !entry.summary?.trim()) throw new Error(`Missing title or summary: ${entry.id}`);
    const titleKey = `${entry.kind}:${entry.title}`;
    if (titles.has(titleKey)) throw new Error(`Duplicate title: ${titleKey}`);
    titles.add(titleKey);
    if (!Array.isArray(entry.tags) || entry.tags.length < 1 || entry.tags.length > 3) {
      throw new Error(`Invalid tags: ${entry.id}`);
    }
    checkLink(entry.source);
    if (entry.related) checkLink(entry.related, { related: true });
    if (entry.related?.url === entry.source.url) throw new Error(`Duplicate related link: ${entry.id}`);
  }
}

function escapeCell(value) {
  return String(value).replace(/\|/g, '\\|').replace(/\s+/g, ' ').trim();
}

function render(kind) {
  const entries = data.entries.filter(entry => entry.kind === kind);
  const lines = [
    `# ${kinds[kind]}案例索引`,
    '',
    `[返回首页](../README.md) · ${entries.length} 条`,
    '',
    '精选公开案例与创作参考。点击来源可查看原作者的展示、提示词与使用说明。',
    '',
    '| 案例 | 用途 | 标签 | 来源 |',
    '| --- | --- | --- | --- |',
  ];
  for (const entry of entries) {
    const links = [`[${escapeCell(entry.source.label)}](${entry.source.url})`];
    if (entry.related) links.push(`[${escapeCell(entry.related.label)}](${entry.related.url})`);
    lines.push(`| ${escapeCell(entry.title)} | ${escapeCell(entry.summary)} | ${entry.tags.map(escapeCell).join(' · ')} | ${links.join(' · ')} |`);
  }
  return `${lines.join('\n')}\n`;
}

validate();
const readme = readFileSync(resolve(root, 'README.md'), 'utf8');
for (const kind of Object.keys(kinds)) {
  const count = data.entries.filter(entry => entry.kind === kind).length;
  const line = `| [${kinds[kind]}案例](catalog/${kind}.md) | ${count} |`;
  if (!readme.includes(line)) throw new Error(`README count is out of date: ${kind}`);
}
if (!readme.includes(`当前 ${data.entries.length} 条`)) throw new Error('README total is out of date');
const mode = process.argv[2] || '--check';
if (!['--check', '--write'].includes(mode)) throw new Error('Use --check or --write');
for (const kind of Object.keys(kinds)) {
  const filename = resolve(root, `catalog/${kind}.md`);
  const content = render(kind);
  if (mode === '--write') writeFileSync(filename, content);
  else if (readFileSync(filename, 'utf8') !== content) throw new Error(`Outdated catalog page: ${kind}`);
}
console.log(`Validated ${data.entries.length} entries (${mode})`);
