const $ = selector => document.querySelector(selector);
const state = { type: 'all', category: 'all', query: '', visible: 18 };
const detail = $('#detail');
let catalog = [];
let images = [];
let videos = [];
let toastTimer;

function el(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function match(entry, type) {
  if (state.type !== 'all' && state.type !== type) return false;
  const terms = [entry.title, entry.summary, entry.category, ...(entry.tags ?? []), entry.source?.label, entry.input]
    .filter(Boolean).join(' ').toLocaleLowerCase();
  return (state.category === 'all' || entry.category === state.category || entry.tags?.includes(state.category))
    && terms.includes(state.query);
}

function notify(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.hidden = true; }, 2300);
}

async function copy(text) {
  try {
    await navigator.clipboard.writeText(text);
    notify('已复制提示词');
  } catch {
    notify('复制失败，请手动选取提示词');
  }
}

function openDetail(entry, kind) {
  const body = $('#detail-body');
  body.replaceChildren();
  const layout = el('div', kind === 'image' ? 'detail-layout' : 'video-detail');
  if (kind === 'image') {
    const img = el('img');
    img.src = entry.image;
    img.alt = entry.title;
    layout.append(img);
  }
  const content = el('div', kind === 'image' ? 'detail-copy' : '');
  content.append(el('span', 'kicker', entry.category));
  const title = el('h2', '', entry.title);
  title.id = 'detail-title';
  content.append(title, el('p', '', entry.summary));
  content.append(el('div', 'detail-spec', kind === 'image'
    ? `${entry.model} · ${entry.provider} · 输出 ${entry.size}` : `输入：${entry.input} · ${entry.format}`));
  const promptHeader = el('div', 'prompt-label');
  promptHeader.append(el('span', '', '完整提示词'));
  const copyButton = el('button', '', '复制');
  copyButton.type = 'button';
  copyButton.addEventListener('click', () => copy(entry.prompt));
  promptHeader.append(copyButton);
  content.append(promptHeader, el('pre', 'prompt-text', entry.prompt));
  layout.append(content);
  body.append(layout);
  detail.showModal();
}

function renderImages() {
  const grid = $('#image-grid');
  grid.replaceChildren();
  const filtered = images.filter(entry => match(entry, 'image'));
  $('#image-section').hidden = state.type === 'video' || filtered.length === 0;
  for (const entry of filtered) {
    const card = el('article', 'image-card');
    const button = el('button');
    button.type = 'button';
    button.setAttribute('aria-label', `查看${entry.title}及完整提示词`);
    button.addEventListener('click', () => openDetail(entry, 'image'));
    const preview = el('img');
    preview.src = entry.image;
    preview.alt = entry.title;
    preview.loading = entry.id === images[0]?.id ? 'eager' : 'lazy';
    preview.width = 600;
    preview.height = 600;
    const meta = el('div', 'image-meta');
    meta.append(el('span', 'kicker', entry.category), el('h3', '', entry.title), el('p', '', entry.summary));
    button.append(preview, meta);
    card.append(button);
    grid.append(card);
  }
}

function renderVideos() {
  const grid = $('#video-grid');
  grid.replaceChildren();
  const filtered = videos.filter(entry => match(entry, 'video'));
  $('#video-section').hidden = state.type === 'image' || filtered.length === 0;
  for (const entry of filtered) {
    const card = el('article', 'video-card');
    const top = el('div', 'video-top');
    top.append(el('span', 'video-symbol', '▶'), el('span', 'kicker', entry.category));
    const button = el('button', '', '查看完整提示词 ↗');
    button.type = 'button';
    button.addEventListener('click', () => openDetail(entry, 'video'));
    card.append(top, el('h3', '', entry.title), el('p', '', entry.summary), button);
    grid.append(card);
  }
}

function renderSources() {
  const grid = $('#source-grid');
  grid.replaceChildren();
  const filtered = catalog.filter(entry => match(entry, entry.kind));
  $('#sources').hidden = filtered.length === 0;
  $('#source-count').textContent = `${filtered.length} 条`;
  for (const entry of filtered.slice(0, state.visible)) {
    const card = el('article', 'source-card');
    const top = el('div', 'source-top');
    top.append(el('span', '', entry.kind === 'image' ? '生图' : '生视频'), el('span', '', '来源案例'));
    const link = el('a', '', `${entry.source.label} ↗`);
    link.href = entry.source.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    card.append(top, el('h3', '', entry.title), el('p', '', entry.summary), el('div', 'tags', entry.tags.join(' · ')), link);
    grid.append(card);
  }
  $('#more').hidden = filtered.length <= state.visible;
}

function render() {
  renderImages();
  renderVideos();
  renderSources();
  const nothing = !images.some(entry => match(entry, 'image'))
    && !videos.some(entry => match(entry, 'video'))
    && !catalog.some(entry => match(entry, entry.kind));
  $('#sources').hidden = nothing ? false : $('#sources').hidden;
  if (nothing) {
    $('#source-count').textContent = '';
    $('#source-grid').append(el('p', 'empty', '没有找到匹配的案例。'));
  }
}

function populateCategories() {
  const categories = new Set([...images, ...videos].map(entry => entry.category));
  for (const entry of catalog) for (const tag of entry.tags) categories.add(tag);
  const select = $('#category');
  for (const category of [...categories].sort((a, b) => a.localeCompare(b, 'zh-CN'))) {
    const option = el('option', '', category);
    option.value = category;
    select.append(option);
  }
}

async function start() {
  try {
    const [showcaseResponse, catalogResponse] = await Promise.all([
      fetch('data/showcase.json'), fetch('data/catalog.json'),
    ]);
    if (!showcaseResponse.ok || !catalogResponse.ok) throw new Error('Data unavailable');
    const showcase = await showcaseResponse.json();
    const sources = await catalogResponse.json();
    images = showcase.images;
    videos = showcase.videos;
    catalog = sources.entries;
    $('#count-images').textContent = String(images.length).padStart(2, '0');
    $('#count-videos').textContent = String(videos.length).padStart(2, '0');
    $('#count-sources').textContent = String(catalog.length);
    const params = new URLSearchParams(location.search);
    state.type = ['image', 'video'].includes(params.get('type')) ? params.get('type') : 'all';
    state.query = (params.get('search') ?? '').trim().toLocaleLowerCase();
    $('#search').value = params.get('search') ?? '';
    document.querySelectorAll('.segments button').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.type === state.type));
      button.addEventListener('click', () => {
        state.type = button.dataset.type;
        state.visible = 18;
        document.querySelectorAll('.segments button').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
        render();
      });
    });
    populateCategories();
    $('#search').addEventListener('input', event => {
      state.query = event.target.value.trim().toLocaleLowerCase();
      state.visible = 18;
      render();
    });
    $('#category').addEventListener('change', event => {
      state.category = event.target.value;
      state.visible = 18;
      render();
    });
    $('#more').addEventListener('click', () => { state.visible += 18; renderSources(); });
    render();
  } catch {
    $('#source-grid').append(el('p', 'empty', '内容暂时无法加载。请在 GitHub 仓库中浏览案例。'));
  }
}

$('#close').addEventListener('click', () => detail.close());
detail.addEventListener('click', event => { if (event.target === detail) detail.close(); });
start();
