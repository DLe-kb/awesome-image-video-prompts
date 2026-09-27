const $ = selector => document.querySelector(selector);
const state = { kind: 'all', category: 'all', query: '' };
const detail = $('#detail');
const cache = new Map();
const labels = { source: '来源案例', unverified: '来源待核实' };
let styles = [];
let visible = [];
let requestId = 0;
let toastTimer;

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function notify(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.hidden = true; }, 2500);
}

async function copy(text) {
  try {
    await navigator.clipboard.writeText(text);
    notify('已复制 Prompt');
  } catch {
    notify('复制失败，请手动选取文本');
  }
}

function promptBlock(container, title, value) {
  const header = el('div', 'prompt-label');
  header.append(el('span', '', title));
  const button = el('button', '', '复制');
  button.type = 'button';
  button.addEventListener('click', () => copy(value));
  header.append(button);
  container.append(header, el('pre', 'prompt-text', value));
}

async function openDetail(entry) {
  const current = ++requestId;
  let style = cache.get(entry.slug);
  if (!style) {
    try {
      const response = await fetch(entry.json);
      if (!response.ok) throw new Error('Style unavailable');
      style = await response.json();
      cache.set(entry.slug, style);
    } catch {
      notify('无法读取 Prompt，请稍后重试');
      return;
    }
  }
  if (current !== requestId) return;
  const body = $('#detail-body');
  body.replaceChildren();
  const layout = el('div', entry.preview ? 'detail-layout' : 'detail-layout no-media');
  if (entry.preview) {
    const media = el('div', 'detail-media');
    if (entry.sample) {
      const video = el('video');
      video.src = entry.sample;
      video.poster = entry.preview;
      video.controls = true;
      video.preload = 'none';
      video.playsInline = true;
      media.append(video);
    } else {
      const image = el('img');
      image.src = entry.preview;
      image.alt = entry.title;
      media.append(image);
    }
    layout.append(media);
  }
  const content = el('div', 'detail-copy');
  content.append(el('span', 'kicker', `${entry.kind === 'image' ? '生图' : '生视频'} · ${labels[entry.type]}`));
  const title = el('h2', '', entry.title);
  title.id = 'detail-title';
  content.append(title, el('p', 'summary', entry.summary));
  content.append(el('p', 'detail-spec', entry.category));
  if (style.source) {
    const source = el('p', 'attribution', '来源：');
    const link = el('a', '', style.source.author);
    link.href = style.source.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    source.append(link);
    if (style.source.linkType === 'profile') source.append('（作者主页）');
    content.append(source);
  }
  if (style.model) content.append(el('p', 'detail-spec', `${style.model} · ${style.provider} · ${style.requestedSize} → ${style.size}`));
  if (style.inputs?.length) content.append(el('p', 'detail-spec', `可替换：${style.inputs.join(' · ')}`));
  promptBlock(content, '完整 Prompt', style.prompt);
  if (style.promptEn) {
    const translation = el('details', 'translation');
    translation.append(el('summary', '', 'English Prompt（英文提示词）'));
    promptBlock(translation, 'English Prompt', style.promptEn);
    content.append(translation);
  }
  if (style.sourcePrompt) {
    const sourceText = el('details', 'translation');
    sourceText.append(el('summary', '', '来源记录（与使用版不同）'));
    promptBlock(sourceText, '来源记录', style.sourcePrompt);
    content.append(sourceText);
  }
  for (const extra of style.sourcePrompts ?? []) {
    promptBlock(content, extra.title, extra.prompt);
    const link = el('a', 'text-link', '查看原始出处 ↗');
    link.href = extra.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    content.append(link);
  }
  if (style.tip) content.append(el('p', 'detail-tip', style.tip));
  const links = el('div', 'detail-links');
  const json = el('a', '', '打开 style.json ↗');
  json.href = entry.json;
  json.target = '_blank';
  json.rel = 'noopener noreferrer';
  const page = el('a', '', '可复制页面 ↗');
  page.href = entry.copy;
  links.append(json, page);
  content.append(links);
  layout.append(content);
  body.append(layout);
  if (!detail.open) detail.showModal();
  const params = new URLSearchParams(location.search);
  params.set('style', entry.slug);
  history.replaceState(null, '', `${location.pathname}?${params}${location.hash}`);
}

function matches(entry) {
  if (state.kind !== 'all' && entry.kind !== state.kind) return false;
  if (state.category !== 'all' && entry.category !== state.category) return false;
  const words = [entry.title, entry.category, entry.summary, entry.source?.author, ...entry.tags, ...entry.inputs]
    .filter(Boolean).join(' ').toLocaleLowerCase();
  return words.includes(state.query);
}

function render() {
  const grid = $('#style-grid');
  grid.replaceChildren();
  const filtered = visible.filter(matches);
  $('#result-count').textContent = `(${filtered.length})`;
  if (!filtered.length) {
    grid.append(el('p', 'empty', '没有找到匹配的 Prompt。'));
    return;
  }
  for (const entry of filtered) {
    const card = el('article', 'style-card');
    const button = el('button', 'card-open');
    button.type = 'button';
    button.setAttribute('aria-label', `查看${entry.title}及完整 Prompt`);
    button.addEventListener('click', () => openDetail(entry));
    if (entry.preview) {
      const image = el('img', 'card-preview');
      image.src = entry.preview;
      image.alt = entry.title;
      image.loading = 'lazy';
      image.width = 600;
      button.append(image);
    } else {
      button.append(el('div', 'card-placeholder', entry.kind === 'image' ? '生图' : '生视频'));
    }
    const meta = el('div', 'card-meta');
    meta.append(el('span', 'kicker', `${entry.kind === 'image' ? '生图' : '生视频'} · ${labels[entry.type]}`),
      el('h3', '', entry.title), el('p', '', entry.summary));
    button.append(meta);
    card.append(button);
    grid.append(card);
  }
}

async function start() {
  try {
    const response = await fetch('styles-data.json');
    if (!response.ok) throw new Error('Catalog unavailable');
    const data = await response.json();
    if (data.version !== 1 || !Array.isArray(data.styles)) throw new Error('Invalid catalog');
    styles = data.styles;
    visible = styles;
    $('#total').textContent = String(visible.length);
    const select = $('#category');
    const categories = [...new Set(styles.map(entry => entry.category))].sort((a, b) => a.localeCompare(b, 'zh-CN'));
    for (const category of categories) {
      const option = el('option', '', category);
      option.value = category;
      select.append(option);
    }
    const params = new URLSearchParams(location.search);
    state.kind = ['image', 'video'].includes(params.get('kind')) ? params.get('kind') : 'all';
    state.query = (params.get('search') ?? '').trim().toLocaleLowerCase();
    $('#search').value = params.get('search') ?? '';
    document.querySelectorAll('.segments button').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.kind === state.kind));
      button.addEventListener('click', () => {
        state.kind = button.dataset.kind;
        document.querySelectorAll('.segments button').forEach(item =>
          item.setAttribute('aria-pressed', String(item === button)));
        render();
      });
    });
    $('#search').addEventListener('input', event => {
      state.query = event.target.value.trim().toLocaleLowerCase();
      render();
    });
    select.addEventListener('change', event => { state.category = event.target.value; render(); });
    render();
    const selected = styles.find(entry => entry.slug === params.get('style'));
    if (selected) openDetail(selected);
  } catch {
    $('#style-grid').append(el('p', 'empty', '画廊暂时无法加载，请在仓库首页浏览 Prompt。'));
  }
}

$('#close').addEventListener('click', () => detail.close());
detail.addEventListener('click', event => { if (event.target === detail) detail.close(); });
detail.addEventListener('close', () => {
  const params = new URLSearchParams(location.search);
  params.delete('style');
  history.replaceState(null, '', `${location.pathname}${params.size ? `?${params}` : ''}${location.hash}`);
});
start();
