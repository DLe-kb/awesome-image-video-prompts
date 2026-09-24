const $ = (selector) => document.querySelector(selector);
const state = { type: "all", category: "all", query: "" };
const detail = $("#detail");
let images = [];
let videos = [];
let templates = [];
let toastTimer;

function el(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function match(entry, type) {
  if (state.type !== "all" && state.type !== type) return false;
  const terms = [
    entry.title,
    entry.summary,
    entry.category,
    entry.input,
    entry.source?.author,
    ...(entry.tags ?? []),
    ...(entry.inputs ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase();
  return (
    (state.category === "all" || entry.category === state.category) &&
    terms.includes(state.query)
  );
}

function notify(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.hidden = true;
  }, 2300);
}

async function copy(text) {
  try {
    await navigator.clipboard.writeText(text);
    notify("已复制提示词");
  } catch {
    notify("复制失败，请手动选取提示词");
  }
}

function openDetail(entry, kind) {
  const body = $("#detail-body");
  body.replaceChildren();
  const layout = el("div", (kind === "image" || entry.image) ? "detail-layout" : "video-detail");
  if (entry.image) {
    const media = el("div", "detail-media");
    const img = el("img");
    img.src = entry.image;
    img.alt = entry.title;
    media.append(img);
    if (entry.video) {
      const clip = el("video");
      clip.src = entry.video;
      clip.poster = entry.image;
      clip.controls = true;
      clip.preload = "none";
      clip.playsInline = true;
      media.replaceChildren(clip);
    }
    layout.append(media);
  }
  const content = el("div", entry.image ? "detail-copy" : "");
  content.append(el("span", "kicker", entry.category));
  const title = el("h2", "", entry.title);
  title.id = "detail-title";
  content.append(title, el("p", "", entry.summary));
  content.append(
    el(
      "div",
      "detail-spec",
      entry.source
        ? `${entry.promptCredit} · ${entry.category}`
        : kind === "image"
          ? `${entry.model} · ${entry.provider} · 输出 ${entry.size}`
        : kind === "template"
          ? `填写：${entry.inputs.map((input) => `[${input}]`).join(" · ")}`
          : `输入：${entry.input} · ${entry.format}`,
    ),
  );
  if (entry.source) {
    const attribution = el("p", "attribution", "来源：");
    const link = el("a", "", entry.source.author);
    link.href = entry.source.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    attribution.append(link);
    content.append(attribution);
  }
  const promptHeader = el("div", "prompt-label");
  promptHeader.append(el("span", "", "完整提示词"));
  const copyButton = el("button", "", "复制");
  copyButton.type = "button";
  copyButton.addEventListener("click", () => copy(entry.prompt));
  promptHeader.append(copyButton);
  content.append(promptHeader, el("pre", "prompt-text", entry.prompt));
  for (const extra of entry.sourcePrompts ?? []) {
    const original = el("div", "prompt-label");
    original.append(el("span", "", `${extra.title} · 原始提示词`));
    const copyOriginal = el("button", "", "复制");
    copyOriginal.type = "button";
    copyOriginal.addEventListener("click", () => copy(extra.prompt));
    original.append(copyOriginal);
    const source = el("a", "reuse-link", "原作者来源 ↗");
    source.href = extra.url;
    source.target = "_blank";
    source.rel = "noopener noreferrer";
    content.append(original, el("pre", "prompt-text", extra.prompt), source);
  }
  if (entry.promptEn) {
    const translated = el("details", "translation");
    translated.append(el("summary", "", "English Prompt（英文提示词）"));
    const copyEnglish = el("button", "", "复制英文");
    copyEnglish.type = "button";
    copyEnglish.addEventListener("click", () => copy(entry.promptEn));
    translated.append(copyEnglish, el("pre", "prompt-text", entry.promptEn));
    content.append(translated);
  }
  if (entry.caseId) {
    const originalCase = el("a", "reuse-link", "查看来源案例 ↗");
    originalCase.href = `showcase/${entry.kind}.md#${entry.caseId}`;
    content.append(originalCase);
  }
  if (kind !== "template") {
    const reusable = el("a", "reuse-link", "查看可复用模板 ↗");
    reusable.href = `templates/${kind}.md${entry.templateId ? `#${entry.templateId}` : ""}`;
    content.append(reusable);
  }
  if (entry.tip) content.append(el("p", "template-tip", entry.tip));
  layout.append(content);
  body.append(layout);
  detail.showModal();
}

function renderImages() {
  const grid = $("#image-grid");
  grid.replaceChildren();
  const filtered = images.filter((entry) => match(entry, "image"));
  $("#image-section").hidden = state.type === "video" || filtered.length === 0;
  for (const entry of filtered) {
    const card = el("article", "image-card");
    const button = el("button");
    button.type = "button";
    button.setAttribute("aria-label", `查看${entry.title}及完整提示词`);
    button.addEventListener("click", () => openDetail(entry, "image"));
    const preview = el("img");
    preview.src = entry.image;
    preview.alt = entry.title;
    preview.loading = entry.id === images[0]?.id ? "eager" : "lazy";
    preview.width = 600;
    preview.height = 600;
    const meta = el("div", "image-meta");
    meta.append(
      el("span", "kicker", entry.category),
      el("h3", "", entry.title),
      el("p", "", entry.summary),
    );
    button.append(preview, meta);
    card.append(button);
    grid.append(card);
  }
}

function renderVideos() {
  const grid = $("#video-grid");
  grid.replaceChildren();
  const filtered = videos.filter((entry) => match(entry, "video"));
  $("#video-section").hidden = state.type === "image" || filtered.length === 0;
  for (const entry of filtered) {
    const card = el("article", "video-card");
    if (entry.image) {
      const preview = el("img", "video-preview");
      preview.src = entry.image;
      preview.alt = entry.title;
      preview.loading = "lazy";
      preview.width = 600;
      preview.height = 338;
      card.append(preview);
    }
    const top = el("div", "video-top");
    top.append(
      el("span", "video-symbol", "▶"),
      el("span", "kicker", entry.category),
    );
    const button = el("button", "", "查看完整提示词 ↗");
    button.type = "button";
    button.addEventListener("click", () => openDetail(entry, "video"));
    card.append(
      top,
      el("h3", "", entry.title),
      el("p", "", entry.summary),
      button,
    );
    grid.append(card);
  }
}

function renderTemplates() {
  const grid = $("#template-grid");
  grid.replaceChildren();
  const filtered = templates.filter((entry) => match(entry, entry.kind));
  $("#templates").hidden = filtered.length === 0;
  for (const entry of filtered) {
    const card = el("article", "template-card");
    if (entry.image) {
      const preview = el("img", "template-preview");
      preview.src = entry.image;
      preview.alt = entry.title;
      preview.loading = "lazy";
      preview.width = 480;
      preview.height = 360;
      card.append(preview);
    }
    const top = el("div", "template-top");
    top.append(
      el("span", "kicker", entry.kind === "image" ? "生图" : "生视频"),
      el("span", "template-category", entry.category),
    );
    const inputs = entry.inputs.length ? el("p", "template-inputs", `填写 ${entry.inputs.join(" · ")}`) : null;
    const actions = el("div", "template-actions");
    const open = el("button", "open-template", "查看 Prompt");
    open.type = "button";
    open.addEventListener("click", () => openDetail(entry, "template"));
    const copyButton = el("button", "copy-template", "复制");
    copyButton.type = "button";
    copyButton.setAttribute("aria-label", `复制${entry.title}提示词`);
    copyButton.addEventListener("click", () => copy(entry.prompt));
    actions.append(open, copyButton);
    card.append(top, el("h3", "", entry.title), el("p", "", entry.summary));
    if (inputs) card.append(inputs);
    card.append(actions);
    grid.append(card);
  }
}

function render() {
  renderImages();
  renderVideos();
  renderTemplates();
  const nothing =
    !images.some((entry) => match(entry, "image")) &&
    !videos.some((entry) => match(entry, "video")) &&
    !templates.some((entry) => match(entry, entry.kind));
  if (nothing) {
    $("#templates").hidden = false;
    $("#template-grid").append(el("p", "empty", "没有找到匹配的 Prompt。"));
  }
}

function populateCategories() {
  const categories = new Set(
    [...images, ...videos, ...templates].map((entry) => entry.category),
  );
  const select = $("#category");
  for (const category of [...categories].sort((a, b) =>
    a.localeCompare(b, "zh-CN"),
  )) {
    const option = el("option", "", category);
    option.value = category;
    select.append(option);
  }
}

async function start() {
  try {
    const [showcaseResponse, templatesResponse, casesResponse, curatedResponse] = await Promise.all([
      fetch("data/showcase.json"),
      fetch("data/templates.json"),
      fetch("data/cases.json"),
      fetch("data/curated-templates.json"),
    ]);
    if (!showcaseResponse.ok || !templatesResponse.ok || !casesResponse.ok || !curatedResponse.ok)
      throw new Error("Data unavailable");
    const showcase = await showcaseResponse.json();
    const templateLibrary = await templatesResponse.json();
    const cases = await casesResponse.json();
    const curated = await curatedResponse.json();
    images = [...cases.images, ...showcase.images];
    videos = [...cases.videos, ...showcase.videos];
    templates = [...curated.entries, ...templateLibrary.entries];
    $("#count-images").textContent = String(images.length).padStart(2, "0");
    $("#count-videos").textContent = String(videos.length).padStart(2, "0");
    $("#count-templates").textContent = String(templates.length);
    const params = new URLSearchParams(location.search);
    state.type = ["image", "video"].includes(params.get("type"))
      ? params.get("type")
      : "all";
    state.query = (params.get("search") ?? "").trim().toLocaleLowerCase();
    $("#search").value = params.get("search") ?? "";
    document.querySelectorAll(".segments button").forEach((button) => {
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.type === state.type),
      );
      button.addEventListener("click", () => {
        state.type = button.dataset.type;
        document
          .querySelectorAll(".segments button")
          .forEach((item) =>
            item.setAttribute("aria-pressed", String(item === button)),
          );
        render();
      });
    });
    populateCategories();
    $("#search").addEventListener("input", (event) => {
      state.query = event.target.value.trim().toLocaleLowerCase();
      render();
    });
    $("#category").addEventListener("change", (event) => {
      state.category = event.target.value;
      render();
    });
    render();
  } catch {
    $("#template-grid").append(
      el("p", "empty", "内容暂时无法加载。请在 GitHub 仓库中浏览 Prompt。"),
    );
  }
}

$("#close").addEventListener("click", () => detail.close());
detail.addEventListener("click", (event) => {
  if (event.target === detail) detail.close();
});
start();
