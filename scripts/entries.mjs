import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const mode = process.argv[2] ?? '--check';
if (!['--check', '--write'].includes(mode)) throw new Error('Use --check or --write');

function readJson(path) {
  return JSON.parse(readFileSync(resolve(root, path), 'utf8'));
}

const collections = {
  cases: { path: 'data/cases.json', data: readJson('data/cases.json') },
  catalog: { path: 'data/catalog.json', data: readJson('data/catalog.json') },
  showcase: { path: 'data/showcase.json', data: readJson('data/showcase.json') },
  prompts: { path: 'data/curated-templates.json', data: readJson('data/curated-templates.json') },
  templates: { path: 'data/templates.json', data: readJson('data/templates.json') },
};
for (const { path, data } of Object.values(collections)) {
  if (data.version !== 1) throw new Error(`Unexpected version: ${path}`);
}

const changed = new Set();
const index = { version: 1, cases: {}, originalCases: {}, prompts: {}, originalTemplates: {} };

function directories(path) {
  return readdirSync(resolve(root, path), { withFileTypes: true }).map(item => {
    if (!item.isDirectory()) throw new Error(`Unexpected file in ${path}: ${item.name}`);
    return item.name;
  }).sort();
}

function files(path, allowed) {
  const names = readdirSync(resolve(root, path), { withFileTypes: true }).map(item => {
    if (!item.isFile() || !allowed.includes(item.name)) throw new Error(`Unexpected file in ${path}: ${item.name}`);
    return item.name;
  });
  if (!names.includes('case.json')) throw new Error(`Missing case.json in ${path}`);
  return names;
}

function syncEntry(entry, sourcePath, collection, list) {
  if (!entry || typeof entry.id !== 'string') throw new Error(`Missing ID: ${sourcePath}`);
  const matches = list.filter(item => item.id === entry.id);
  if (matches.length === 0 && mode === '--write') {
    list.push(entry);
    changed.add(collection.path);
    return;
  }
  if (matches.length !== 1) throw new Error(`Expected one published entry for ${sourcePath}: ${entry.id}`);
  if (isDeepStrictEqual(matches[0], entry)) return;
  if (mode === '--check') throw new Error(`Outdated ${collection.path} for ${sourcePath}; run node scripts/entries.mjs --write`);
  list[list.indexOf(matches[0])] = entry;
  changed.add(collection.path);
}

function checkCoverage(label, paths, list) {
  const expected = list.map(item => item.id);
  const actual = Object.keys(paths);
  const missing = expected.filter(id => !paths[id]);
  const extra = actual.filter(id => !expected.includes(id));
  if (new Set(expected).size !== expected.length || missing.length || extra.length) {
    throw new Error(`Incomplete ${label}: ${missing.length} missing, ${extra.length} extra or duplicate IDs`);
  }
}

function checkMedia(entry, kind) {
  for (const media of [entry.image, ...(kind === 'video' ? [entry.video] : [])]) {
    if (!media || !existsSync(resolve(root, media))) throw new Error(`Missing media for ${entry.id}: ${media}`);
  }
}

for (const kind of ['image', 'video']) {
  for (const id of directories(`entries/${kind}`)) {
    if (!new RegExp(`^${kind}-[a-f0-9]{10}$`).test(id)) throw new Error(`Invalid case directory: ${id}`);
    const dir = `entries/${kind}/${id}`;
    const names = files(dir, ['case.json', 'prompt.json']);
    const casePath = `${dir}/case.json`;
    const { catalog, ...entry } = readJson(casePath);
    if (entry.id !== id || !entry.prompt?.trim() || !entry.source?.author ||
        !/^https:\/\//.test(entry.source.url) || !Array.isArray(entry.tags) || !catalog?.sourceLabel) {
      throw new Error(`Invalid source case: ${casePath}`);
    }
    checkMedia(entry, kind);
    syncEntry(entry, casePath, collections.cases, collections.cases.data[`${kind}s`]);
    index.cases[id] = casePath;

    const catalogEntry = {
      id, kind, title: entry.title, summary: entry.summary, tags: entry.tags,
      source: { label: catalog.sourceLabel, url: catalog.sourceUrl ?? entry.source.url },
      ...(catalog.related ? { related: catalog.related } : {}),
    };
    syncEntry(catalogEntry, casePath, collections.catalog, collections.catalog.data.entries);

    if (names.includes('prompt.json')) {
      const promptPath = `${dir}/prompt.json`;
      const prompt = readJson(promptPath);
      if (prompt.id !== entry.templateId || prompt.kind !== kind || prompt.caseId !== id ||
          !prompt.source?.author || prompt.source.url !== entry.source.url ||
          prompt.image !== entry.image || (kind === 'video' && prompt.video !== entry.video) ||
          !prompt.prompt?.trim() || !prompt.promptEn?.trim()) {
        throw new Error(`Invalid case/prompt link: ${promptPath}`);
      }
      syncEntry(prompt, promptPath, collections.prompts, collections.prompts.data.entries);
      if (index.prompts[prompt.id]) throw new Error(`Duplicate prompt ID: ${prompt.id}`);
      index.prompts[prompt.id] = promptPath;
    } else if (entry.templateId) {
      throw new Error(`Missing prompt.json for ${id}`);
    }
  }
  checkCoverage(`${kind} cases`, Object.fromEntries(Object.entries(index.cases)
    .filter(([id]) => id.startsWith(`${kind}-`))), collections.cases.data[`${kind}s`]);

  const originalPaths = {};
  for (const id of directories(`entries/original/${kind}`)) {
    if (!/^[a-z0-9-]+$/.test(id)) throw new Error(`Invalid original case directory: ${id}`);
    const dir = `entries/original/${kind}/${id}`;
    files(dir, ['case.json']);
    const casePath = `${dir}/case.json`;
    const entry = readJson(casePath);
    if (entry.id !== id || !entry.prompt?.trim() || !entry.title?.trim()) {
      throw new Error(`Invalid original case: ${casePath}`);
    }
    if (kind === 'image') checkMedia(entry, 'image');
    syncEntry(entry, casePath, collections.showcase, collections.showcase.data[`${kind}s`]);
    if (index.originalCases[id]) throw new Error(`Duplicate original case ID: ${id}`);
    index.originalCases[id] = casePath;
    originalPaths[id] = casePath;
  }
  checkCoverage(`${kind} original cases`, originalPaths, collections.showcase.data[`${kind}s`]);
}

const templateDir = 'entries/original-templates';
for (const name of readdirSync(resolve(root, templateDir)).sort()) {
  if (!/^[a-z0-9-]+\.json$/.test(name)) throw new Error(`Invalid original template filename: ${name}`);
  const path = `${templateDir}/${name}`;
  const entry = readJson(path);
  if (entry.id !== name.slice(0, -5) || !['image', 'video'].includes(entry.kind) || !entry.prompt?.trim()) {
    throw new Error(`Invalid original template: ${path}`);
  }
  syncEntry(entry, path, collections.templates, collections.templates.data.entries);
  index.originalTemplates[entry.id] = path;
}
checkCoverage('linked prompts', index.prompts, collections.prompts.data.entries);
checkCoverage('original templates', index.originalTemplates, collections.templates.data.entries);
checkCoverage('catalog', index.cases, collections.catalog.data.entries);

const md = value => String(value).replace(/\|/g, '\\|').replace(/\s+/g, ' ').trim();
const localLink = (label, path) => `[${md(label)}](${path.replace(/^entries\//, '')})`;
const navigation = ['# 独立条目导航', '', '[返回目录说明](README.md)', ''];
for (const [kind, title] of [['image', '来源生图案例'], ['video', '来源生视频案例']]) {
  const cases = collections.cases.data[`${kind}s`];
  navigation.push(`## ${title}（${cases.length}）`, '', '| 案例 | 配套 Prompt |', '| --- | --- |');
  for (const entry of cases) {
    const promptPath = entry.templateId ? index.prompts[entry.templateId] : null;
    navigation.push(`| ${localLink(entry.title, index.cases[entry.id])} | ${promptPath ? localLink('中英文 JSON', promptPath) : '—'} |`);
  }
  navigation.push('');
}
for (const [kind, title] of [['image', '原创生图案例'], ['video', '原创视频工作流']]) {
  const cases = collections.showcase.data[`${kind}s`];
  navigation.push(`## ${title}（${cases.length}）`, '');
  navigation.push(...cases.map(entry => `- ${localLink(entry.title, index.originalCases[entry.id])}`), '');
}
navigation.push(`## 原创填空模板（${collections.templates.data.entries.length}）`, '');
navigation.push(...collections.templates.data.entries.map(entry =>
  `- ${localLink(entry.title, index.originalTemplates[entry.id])}`), '');

if (mode === '--write') {
  for (const { path, data } of Object.values(collections)) {
    if (changed.has(path)) writeFileSync(resolve(root, path), `${JSON.stringify(data, null, 2)}\n`);
  }
}
for (const [path, content] of [
  ['data/entry-index.json', `${JSON.stringify(index, null, 2)}\n`],
  ['entries/INDEX-条目导航.md', `${navigation.join('\n')}`],
]) {
  const absolute = resolve(root, path);
  if (existsSync(absolute) && readFileSync(absolute, 'utf8') === content) continue;
  if (mode === '--check') throw new Error(`Outdated ${path}; run node scripts/entries.mjs --write`);
  writeFileSync(absolute, content);
}
console.log(`Validated ${Object.keys(index.cases).length} source cases, ${Object.keys(index.originalCases).length} original cases, ${Object.keys(index.prompts).length} linked prompts and ${Object.keys(index.originalTemplates).length} original templates (${mode})`);
