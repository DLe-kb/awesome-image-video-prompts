const $ = selector => document.querySelector(selector);
const state = { kind: 'all', category: 'all', query: '' };
const detail = $('#detail');
const cache = new Map();
const labels = { source: '来源案例', unverified: '来源待核实' };
const featuredSlugs = [
  'image-miniature-city-map-travel-poster',
  'image-french-new-wave-torn-paper-poster',
  'image-city-corner-3d-billboard-photography',
  'video-1990s-pixel-text-game',
  'video-animated-encyclopedia-collage-explainer',
  'image-graded-english-magazine-reading-page',
];
let styles = [];
let filtered = [];
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

async function copy(text, message = '已复制 Prompt') {
  try {
    await navigator.clipboard.writeText(text);
    notify(message);
  } catch {
    const field = el('textarea');
    field.value = text;
    field.style.position = 'fixed';
    field.style.opacity = '0';
    document.body.append(field);
    field.select();
    const copied = document.execCommand('copy');
    field.remove();
    notify(copied ? message : '复制失败，请手动选取文本');
  }
}

async function loadStyle(entry) {
  if (cache.has(entry.slug)) return cache.get(entry.slug);
  const response = await fetch(entry.json);
  if (!response.ok) throw new Error('Style unavailable');
  const style = await response.json();
  cache.set(entry.slug, style);
  return style;
}

async function copyPrompt(entry) {
  try {
    const style = await loadStyle(entry);
    const value = style.workflow
      ? style.workflow.map(step => `${step.title}\n${step.prompt}`).join('\n\n')
      : style.prompt;
    await copy(value);
  } catch { notify('无法读取 Prompt，请稍后重试'); }
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
  detail.dataset.slug = entry.slug;
  const body = $('#detail-body');
  body.querySelector('video')?.pause();
  const loading = el('div', 'detail-loading');
  const loadingTitle = el('h2', '', '正在读取风格');
  loadingTitle.id = 'detail-title';
  loading.append(loadingTitle, el('p', '', '正在读取完整提示词…'));
  body.replaceChildren(loading);
  if (!detail.open) detail.showModal();
  detail.scrollTop = 0;
  $('#previous').disabled = true;
  $('#next').disabled = true;
  let style;
  try { style = await loadStyle(entry); }
  catch {
    if (current !== requestId) return;
    loadingTitle.textContent = '暂时无法读取这个风格';
    loading.lastChild.textContent = '请检查网络连接后重试。';
    const retry = el('button', 'retry', '重试');
    retry.type = 'button';
    retry.addEventListener('click', () => openDetail(entry));
    loading.append(retry);
    return;
  }
  if (current !== requestId) return;
  body.replaceChildren();
  const layout = el('div', 'detail-layout');
  if (entry.preview) {
    const media = el('div', 'detail-media');
    if (entry.sample) {
      const video = el('video');
      video.src = entry.sample;
      video.poster = entry.preview;
      video.controls = true;
      video.preload = 'none';
      video.playsInline = true;
      video.classList.add('video-loading');
      const poster = new Image();
      poster.onload = () => {
        video.width = poster.naturalWidth;
        video.height = poster.naturalHeight;
        video.classList.remove('video-loading');
      };
      poster.onerror = () => {
        video.preload = 'metadata';
        video.classList.remove('video-loading');
      };
      video.addEventListener('loadedmetadata', () => {
        if (video.videoWidth && video.videoHeight) {
          video.width = video.videoWidth;
          video.height = video.videoHeight;
        }
      });
      poster.src = entry.preview;
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
  const taxonomy = el('p', 'detail-taxonomy');
  taxonomy.setAttribute('aria-label', '分类与标签，首项为主分类');
  taxonomy.append(el('strong', '', entry.category), ...entry.tags.map(tag => el('span', '', tag)));
  content.append(taxonomy);
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
  for (const step of style.workflow ?? [style]) {
    if (style.workflow) content.append(el('h3', 'workflow-step', step.title));
    promptBlock(content, '完整提示词', step.prompt);
    const translation = el('details', 'translation');
    translation.append(el('summary', '', 'English Prompt（英文提示词）'));
    promptBlock(translation, 'English Prompt', step.promptEn);
    content.append(translation);
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
  const share = el('button', 'share-link', '复制此风格链接');
  share.type = 'button';
  share.addEventListener('click', () => copy(location.href, '已复制链接'));
  content.append(share);
  layout.append(content);
  body.append(layout);
  const position = filtered.findIndex(item => item.slug === entry.slug);
  $('#previous').disabled = position <= 0;
  $('#next').disabled = position < 0 || position >= filtered.length - 1;
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

function card(entry) {
    const card = el('article', 'style-card');
    const button = el('button', 'card-open');
    button.type = 'button';
    button.addEventListener('click', () => openDetail(entry));
    if (entry.preview) {
      const image = el('img', 'card-preview');
      image.src = `../styles/${entry.slug}/thumbnail.jpg`;
      image.alt = '';
      image.loading = 'lazy';
      image.width = 480;
      image.height = 300;
      button.append(image);
    }
    const meta = el('div', 'card-meta');
    meta.append(el('span', 'kicker', `${entry.kind === 'image' ? '生图' : '生视频'} / ${entry.category}`),
      el('h3', '', entry.title), el('p', '', entry.summary));
    button.append(meta);
    card.append(button);
    const actions = el('div', 'card-actions');
    const copyButton = el('button', '', '复制 Prompt');
    copyButton.type = 'button';
    copyButton.addEventListener('click', () => copyPrompt(entry));
    const detailButton = el('button', '', '查看详情');
    detailButton.type = 'button';
    detailButton.addEventListener('click', () => openDetail(entry));
    actions.append(copyButton, detailButton);
    card.append(actions);
    return card;
}

function render() {
  filtered = styles.filter(matches);
  $('#result-count').textContent = `显示 ${filtered.length} / ${styles.length} 个风格`;
  const featured = $('#featured');
  featured.hidden = state.kind !== 'all' || state.category !== 'all' || Boolean(state.query);
  const grid = $('#style-grid');
  grid.setAttribute('aria-busy', 'false');
  grid.replaceChildren();
  if (!filtered.length) {
    const empty = el('div', 'empty');
    empty.append(el('strong', '', '没有找到匹配的 Prompt'), el('span', '', '试试其他关键词或清除筛选。'));
    const reset = el('button', 'retry', '清除筛选');
    reset.type = 'button';
    reset.addEventListener('click', () => {
      state.kind = 'all'; state.category = 'all'; state.query = '';
      $('#search').value = '';
      renderCategories();
      updateFilters();
    });
    empty.append(reset);
    grid.append(empty);
    return;
  }
  grid.append(...filtered.map(card));
}

function renderCategories() {
  const select = $('#category');
  select.replaceChildren();
  const categories = new Set();
  for (const entry of styles.filter(item => state.kind === 'all' || item.kind === state.kind)) {
    categories.add(entry.category);
  }
  for (const category of ['all', ...[...categories].sort((a, b) => a.localeCompare(b, 'zh-CN'))]) {
    const option = el('option', '', category === 'all' ? '所有分类' : category);
    option.value = category;
    select.append(option);
  }
  select.value = state.category;
}

function updateFilters() {
  document.documentElement.dataset.filtered = String(state.kind !== 'all' || state.category !== 'all' || Boolean(state.query));
  document.querySelectorAll('.segments button').forEach(button =>
    button.setAttribute('aria-pressed', String(button.dataset.kind === state.kind)));
  const params = new URLSearchParams(location.search);
  for (const [key, value] of [['kind', state.kind], ['category', state.category], ['search', $('#search').value.trim()]]) {
    if (!value || value === 'all') params.delete(key);
    else params.set(key, value);
  }
  params.delete('tag');
  params.delete('style');
  history.replaceState(null, '', `${location.pathname}${params.size ? `?${params}` : ''}${location.hash}`);
  render();
}

async function start() {
  try {
    const response = await fetch('styles-data.json?v=single-category-20260928');
    if (!response.ok) throw new Error('Catalog unavailable');
    const data = await response.json();
    if (data.version !== 1 || !Array.isArray(data.styles)) throw new Error('Invalid catalog');
    styles = data.styles;
    $('#total').textContent = String(styles.length);
    $('#image-total').textContent = String(styles.filter(entry => entry.kind === 'image').length);
    $('#video-total').textContent = String(styles.filter(entry => entry.kind === 'video').length);
    const select = $('#category');
    const params = new URLSearchParams(location.search);
    state.kind = ['image', 'video'].includes(params.get('kind')) ? params.get('kind') : 'all';
    const scoped = styles.filter(item => state.kind === 'all' || item.kind === state.kind);
    state.category = scoped.some(item => item.category === params.get('category')) ? params.get('category') : 'all';
    const search = params.get('search') ?? params.get('tag') ?? '';
    state.query = search.trim().toLocaleLowerCase();
    $('#search').value = search;
    renderCategories();
    const picks = featuredSlugs.map(slug => styles.find(entry => entry.slug === slug)).filter(Boolean);
    $('#featured-grid').replaceChildren(...picks.map(card));
    $('#featured-grid').setAttribute('aria-busy', 'false');
    document.querySelectorAll('.segments button').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.kind === state.kind));
      button.addEventListener('click', () => {
        state.kind = button.dataset.kind;
        const scoped = styles.filter(item => state.kind === 'all' || item.kind === state.kind);
        if (!scoped.some(item => item.category === state.category)) state.category = 'all';
        renderCategories();
        updateFilters();
      });
    });
    $('#search').addEventListener('input', event => {
      state.query = event.target.value.trim().toLocaleLowerCase();
      updateFilters();
    });
    select.addEventListener('change', event => { state.category = event.target.value; updateFilters(); });
    render();
    const selected = styles.find(entry => entry.slug === params.get('style'));
    if (selected) openDetail(selected);
  } catch {
    $('#featured').hidden = true;
    $('#featured-grid').replaceChildren();
    $('#featured-grid').setAttribute('aria-busy', 'false');
    const grid = $('#style-grid');
    grid.setAttribute('aria-busy', 'false');
    grid.replaceChildren(el('p', 'empty', '画廊暂时无法加载，请在仓库首页浏览 Prompt。'));
  }
}

document.querySelector('[data-open-style]').addEventListener('click', event => {
  const entry = styles.find(item => item.slug === event.currentTarget.dataset.openStyle);
  if (entry) openDetail(entry);
});
const themeToggle = $('#theme-toggle');
themeToggle.checked = document.documentElement.dataset.theme === 'light';
themeToggle.addEventListener('change', () => {
  const theme = themeToggle.checked ? 'light' : 'dark';
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]').content = theme === 'light' ? '#f6f6f5' : '#171717';
  try { localStorage.setItem('visual-prompts-theme', theme); } catch {}
});
function moveDetail(direction) {
  const position = filtered.findIndex(item => item.slug === detail.dataset.slug);
  if (filtered[position + direction]) openDetail(filtered[position + direction]);
}
$('#previous').addEventListener('click', () => moveDetail(-1));
$('#next').addEventListener('click', () => moveDetail(1));
$('#close').addEventListener('click', () => detail.close());
detail.addEventListener('click', event => { if (event.target === detail) detail.close(); });
detail.addEventListener('close', () => {
  requestId++;
  detail.querySelector('video')?.pause();
  const params = new URLSearchParams(location.search);
  params.delete('style');
  history.replaceState(null, '', `${location.pathname}${params.size ? `?${params}` : ''}${location.hash}`);
});
detail.addEventListener('keydown', event => {
  if (event.target.closest('input, textarea, video, pre')) return;
  if (event.key === 'ArrowLeft') moveDetail(-1);
  if (event.key === 'ArrowRight') moveDetail(1);
});
start();
