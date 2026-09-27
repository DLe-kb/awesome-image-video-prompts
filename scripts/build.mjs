import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, extname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const mode = process.argv[2] ?? '--check';
if (!['--write', '--check'].includes(mode)) throw new Error('Use --write or --check');
const slugs = readdirSync(resolve(root, 'styles'), { withFileTypes: true })
  .map(item => {
    if (!item.isDirectory() || !/^[a-z0-9-]+$/.test(item.name)) throw new Error(`Invalid style folder: ${item.name}`);
    return item.name;
  }).sort();
const styles = slugs.map(slug => JSON.parse(readFileSync(resolve(root, 'styles', slug, 'style.json'), 'utf8')));
const bySlug = new Map(styles.map(style => [style.style_slug, style]));
if (bySlug.size !== styles.length) throw new Error('Duplicate style slug');

function assetPath(style, name) {
  if (!style[name]) return null;
  const path = resolve(root, 'styles', style.style_slug, style[name]);
  if (!path.startsWith(`${resolve(root, 'styles')}/`) || !existsSync(path)) {
    throw new Error(`Missing ${name}: ${style.style_slug}`);
  }
  return relative(root, path).replaceAll('\\', '/');
}

function escapeHtml(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

function escapedCode(value) {
  return String(value).replace(/[ \t]+$/gm, '').replaceAll('```', '` ` `').trimEnd();
}

function writeGenerated(path, content) {
  const target = resolve(root, path);
  if (mode === '--write') {
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, content);
  } else if (!existsSync(target) || readFileSync(target, 'utf8') !== content) {
    throw new Error(`Outdated generated file: ${path}`);
  }
}

const thumbnailCache = new Set();
function galleryThumbnail(style) {
  const preview = assetPath(style, 'preview');
  if (!preview) return null;
  const path = `styles/${style.style_slug}/thumbnail.jpg`;
  const target = resolve(root, path);
  if (mode === '--write' && !thumbnailCache.has(path)) {
    const result = spawnSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error',
      '-i', resolve(root, preview), '-vf',
      '[0:v]split=2[background][foreground];' +
      '[background]scale=480:300:force_original_aspect_ratio=increase,crop=480:300,boxblur=20:1[back];' +
      '[foreground]scale=480:300:force_original_aspect_ratio=decrease[front];' +
      '[back][front]overlay=(W-w)/2:(H-h)/2:format=auto',
      '-frames:v', '1', target], { encoding: 'utf8' });
    if (result.error || result.status !== 0) {
      throw new Error(`Could not create thumbnail for ${style.style_slug}: ${result.stderr || result.error}`);
    }
    thumbnailCache.add(path);
  } else if (!existsSync(target)) {
    throw new Error(`Missing gallery thumbnail: ${path}`);
  }
  return path;
}

for (const [position, style] of styles.entries()) {
  const slug = style.style_slug;
  if (style.style_version !== '1.0' || slug !== slugs[position] || !/^[a-z0-9-]+$/.test(slug) ||
      !['image', 'video'].includes(style.kind) ||
      !['source', 'unverified'].includes(style.type) ||
      !style.title?.trim() || !style.summary?.trim() || !style.category?.trim() ||
      !((style.prompt?.trim() && style.promptEn?.trim() && !style.workflow) ||
        (!style.prompt && !style.promptEn && Array.isArray(style.workflow) && style.workflow.length >= 2 &&
          style.workflow.every(step => step.title?.trim() && step.prompt?.trim() && step.promptEn?.trim()))) ||
      style.sourcePrompt || style.sourcePrompts) {
    throw new Error(`Invalid style: ${slug}`);
  }
  if (style.preview) galleryThumbnail(style);
  const files = readdirSync(resolve(root, 'styles', slug)).sort();
  const expected = ['style.json', ...(style.preview?.startsWith('../') ? [] : style.preview ? [style.preview] : []),
    ...(style.sample?.startsWith('../') ? [] : style.sample ? [style.sample] : []),
    ...(style.preview ? ['thumbnail.jpg'] : [])].sort();
  if (JSON.stringify(files) !== JSON.stringify(expected)) throw new Error(`Unexpected files: ${slug}`);
  if (style.preview && !/\.jpg$|\.webp$/.test(style.preview)) throw new Error(`Invalid preview: ${slug}`);
  if (style.sample && extname(style.sample) !== '.mp4') throw new Error(`Invalid sample: ${slug}`);
  if (!style.preview || (style.kind === 'video' && !style.sample)) {
    throw new Error(`Preview and video sample required: ${slug}`);
  }
  assetPath(style, 'preview');
  assetPath(style, 'sample');
  if (style.relatedStyle) throw new Error(`Linked duplicate style: ${slug}`);
  if (style.example && !bySlug.has(style.example)) throw new Error(`Broken example relation: ${slug}`);
  if (style.type === 'source' && (!style.source?.author || !/^https:\/\//.test(style.source.url))) {
    throw new Error(`Missing source: ${slug}`);
  }
  if (style.source?.linkType && !['post', 'profile'].includes(style.source.linkType)) {
    throw new Error(`Invalid source link type: ${slug}`);
  }
  if (style.source?.linkType === 'profile' && !/^https:\/\/x\.com\/[^/]+\/?$/.test(style.source.url)) {
    throw new Error(`Invalid author profile: ${slug}`);
  }
  if (style.type === 'source' && /^https:\/\/x\.com\/[^/]+\/?$/.test(style.source.url) && style.source.linkType !== 'profile') {
    throw new Error(`Unlabeled author profile: ${slug}`);
  }
  if (style.source?.url && /^https:\/\/(?:www\.)?(?:youmind\.com|github\.com\/freestylefly\/)/.test(style.source.url)) {
    throw new Error(`Secondary source: ${slug}`);
  }
  if (style.catalog?.related || style.catalog?.sourceUrl) {
    throw new Error(`Secondary catalog link: ${slug}`);
  }
}
if (!styles.length) throw new Error('Empty style library');

const sorted = styles.toSorted((a, b) =>
  (a.kind === b.kind ? a.title.localeCompare(b.title, 'zh-CN') : a.kind === 'image' ? -1 : 1));
const visible = sorted;
const label = { source: '来源案例', unverified: '来源待核实' };
const playbackUrl = slug => `https://dingle-kb.github.io/awesome-image-video-prompts/?style=${encodeURIComponent(slug)}`;

function renderCopy(style) {
  const slug = style.style_slug;
  const preview = assetPath(style, 'preview');
  const sample = assetPath(style, 'sample');
  const lines = [
    `# ${style.title}`, '',
    '[返回完整目录](../CATALOG.md)', '',
    ...(preview ? [`![${style.title}](../../${preview})`, ''] : []),
    ...(sample ? [`[播放样片（在线播放器）](${playbackUrl(slug)})`, ''] : []),
    style.summary, '',
    `类型：${style.kind === 'image' ? '生图' : '生视频'} · ${label[style.type]} · ${style.category}`, '',
    ...(style.source ? [`来源：[${style.source.author}](${style.source.url})${style.source.linkType === 'profile' ? '（作者主页）' : ''}`, ''] : []),
    ...(style.model ? [`生成信息：${style.model} · ${style.provider} · ${style.requestedSize} → ${style.size}`, ''] : []),
    ...(style.inputs?.length ? [`可替换内容：${style.inputs.map(input => `\`[${input}]\``).join(' · ')}`, ''] : []),
    ...(style.workflow ?? [style]).flatMap(step => [
      ...(style.workflow ? [`## ${step.title}`, ''] : []),
      style.workflow ? '### 完整提示词' : '## 完整提示词', '', '```text', escapedCode(step.prompt), '```', '',
      style.workflow ? '### English Prompt' : '## English Prompt', '', '```text', escapedCode(step.promptEn), '```', '',
    ]),
    ...(style.tip ? [`使用检查：${style.tip}`, ''] : []),
    ...(style.example ? [`[查看对应案例](../copy-prompts/${style.example}.md)`, ''] : []),
    `[打开 style.json](../../styles/${slug}/style.json) · [打开条目目录](../../styles/${slug}/)`, '',
    '<!-- Generated by scripts/build.mjs. -->', '',
  ];
  return lines.join('\n');
}

for (const style of styles) writeGenerated(`docs/copy-prompts/${style.style_slug}.md`, renderCopy(style));
if (mode === '--check') {
  const actual = readdirSync(resolve(root, 'docs/copy-prompts')).sort();
  const expected = slugs.map(slug => `${slug}.md`).sort();
  if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error('Stale copy-prompt pages');
}

const catalog = ['# 完整 Prompt 目录', '', '[返回首页](../README-ZH.md) · [在线画廊](../site/)', ''];
for (const [kind, title] of [['image', '生图'], ['video', '生视频']]) {
  const group = visible.filter(style => style.kind === kind);
  catalog.push(`## ${title}（${group.length}）`, '');
  for (const style of group) {
    const slug = style.style_slug;
    const preview = assetPath(style, 'preview');
    catalog.push(`### ${style.title}`, '',
      ...(preview ? [`[![${style.title}](../${preview})](copy-prompts/${slug}.md)`, ''] : []),
      `${style.summary} · ${label[style.type]}`, '',
      `[复制 Prompt](copy-prompts/${slug}.md) · [style.json](../styles/${slug}/style.json)` +
        (style.sample ? ` · [播放样片](${playbackUrl(slug)})` : ''), '',
    );
  }
}
writeGenerated('docs/CATALOG.md', `${catalog.join('\n').trimEnd()}\n`);

function gallery(lang) {
  const zh = lang === 'zh';
  const lines = [];
  for (const [kind, title] of [['image', zh ? '生图' : 'Image'], ['video', zh ? '生视频' : 'Video']]) {
    const group = visible.filter(style => style.kind === kind);
    lines.push(`### ${title} (${group.length})`, '', '<table width="100%">');
    for (let i = 0; i < group.length; i += 4) {
      const row = group.slice(i, i + 4);
      lines.push('<tr>');
      for (const style of row) {
        const slug = style.style_slug;
        const span = row.length === 2 ? ' colspan="2" width="50%"' : ' width="25%"';
        lines.push(`<td${span} valign="top" align="center"><a href="${style.sample ? playbackUrl(slug) : `docs/copy-prompts/${slug}.md`}"><img src="${galleryThumbnail(style)}" alt="${escapeHtml(style.title)}" width="220" height="138"></a><br><strong>${escapeHtml(style.title)}</strong><br><a href="styles/${slug}/style.json">style.json</a> · <a href="docs/copy-prompts/${slug}.md">${zh ? '复制 Prompt' : 'Copy Prompt'}</a>${style.sample ? ` · <a href="${playbackUrl(slug)}">${zh ? '播放样片' : 'Play clip'}</a>` : ''}</td>`);
      }
      lines.push('</tr>');
    }
    lines.push('</table>', '');
  }
  return lines.join('\n').trimEnd();
}

for (const [path, lang] of [['README-ZH.md', 'zh'], ['README.md', 'en']]) {
  const content = readFileSync(resolve(root, path), 'utf8');
  const start = '<!-- BEGIN GENERATED GALLERY -->';
  const end = '<!-- END GENERATED GALLERY -->';
  const first = content.indexOf(start);
  const last = content.indexOf(end);
  if (first < 0 || last < first || content.indexOf(start, first + 1) !== -1) throw new Error(`Missing gallery markers: ${path}`);
  const rendered = `${content.slice(0, first + start.length)}\n${gallery(lang)}\n${content.slice(last)}`;
  writeGenerated(path, rendered);
}

const manifest = sorted.map(style => ({
  slug: style.style_slug,
  kind: style.kind,
  type: style.type,
  title: style.title,
  category: style.category,
  summary: style.summary,
  tags: style.tags ?? [],
  inputs: style.inputs ?? [],
  preview: assetPath(style, 'preview') ? `../${assetPath(style, 'preview')}` : null,
  sample: assetPath(style, 'sample') ? `../${assetPath(style, 'sample')}` : null,
  source: style.source ?? null,
  json: `../styles/${style.style_slug}/style.json`,
  copy: `../docs/copy-prompts/${style.style_slug}.md`,
}));
writeGenerated('site/styles-data.json', `${JSON.stringify({ version: 1, styles: manifest }, null, 2)}\n`);
console.log(`Validated ${styles.length} style packages (${mode})`);
