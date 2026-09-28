import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pages = ['README.md', 'README-ZH.md', 'CONTRIBUTING.md', 'docs/CATALOG.md',
  ...['image', 'video'].flatMap(kind => readdirSync(resolve(root, 'docs/copy-prompts', kind))
    .map(name => `docs/copy-prompts/${kind}/${name}`)),
  'index.html', 'site/index.html'];
let checked = 0;

function check(from, link) {
  if (/^(https?:|mailto:|#|data:)/.test(link)) return;
  const clean = decodeURIComponent(link.split(/[?#]/)[0]);
  if (!clean) return;
  const target = resolve(root, dirname(from), clean);
  if (!target.startsWith(`${root}/`) || !existsSync(target)) throw new Error(`Broken link in ${from}: ${link}`);
  checked++;
}

for (const page of pages) {
  const body = readFileSync(resolve(root, page), 'utf8');
  for (const match of body.matchAll(/\]\(([^)]+)\)|(?:href|src)="([^"]+)"/g)) {
    check(page, match[1] ?? match[2]);
  }
}
const manifest = JSON.parse(readFileSync(resolve(root, 'site/styles-data.json'), 'utf8'));
for (const style of manifest.styles) {
  for (const key of ['preview', 'sample', 'json', 'copy']) {
    if (style[key]) check('site/index.html', style[key]);
  }
}
console.log(`Validated ${checked} local page and gallery links`);
