import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const data = JSON.parse(
  readFileSync(resolve(root, "data/templates.json"), "utf8"),
);
const showcase = JSON.parse(
  readFileSync(resolve(root, "data/showcase.json"), "utf8"),
);
const cases = JSON.parse(readFileSync(resolve(root, "data/cases.json"), "utf8"));
const curated = JSON.parse(readFileSync(resolve(root, "data/curated-templates.json"), "utf8"));
const mode = process.argv[2] ?? "--check";
if (!["--check", "--write"].includes(mode))
  throw new Error("Use --check or --write");
if (data.version !== 1 || !Array.isArray(data.entries))
  throw new Error("Invalid template collection");

const ids = new Set();
const examples = new Set(
  [...showcase.images, ...showcase.videos].map((entry) => entry.id),
);
for (const entry of data.entries) {
  if (!/^[a-z0-9-]+$/.test(entry.id) || ids.has(entry.id))
    throw new Error(`Invalid or duplicate template ID: ${entry.id}`);
  ids.add(entry.id);
  if (!["image", "video"].includes(entry.kind))
    throw new Error(`Invalid template kind: ${entry.id}`);
  for (const key of ["title", "category", "summary", "prompt", "tip"]) {
    if (typeof entry[key] !== "string" || !entry[key].trim())
      throw new Error(`Missing ${key}: ${entry.id}`);
  }
  if (entry.prompt.length < 90 || entry.prompt.includes("```"))
    throw new Error(`Invalid prompt: ${entry.id}`);
  if (
    !Array.isArray(entry.inputs) ||
    entry.inputs.length < 2 ||
    entry.inputs.length > 5
  )
    throw new Error(`Invalid inputs: ${entry.id}`);
  for (const input of entry.inputs) {
    if (!entry.prompt.includes(`[${input}]`))
      throw new Error(`Unused input ${input}: ${entry.id}`);
  }
  if (entry.example && !examples.has(entry.example))
    throw new Error(`Unknown example: ${entry.id}`);
}
if (curated.version !== 1 || !Array.isArray(curated.entries) || curated.entries.length !== 92) {
  throw new Error("Invalid curated template collection");
}
const sourceCases = new Map([...cases.images, ...cases.videos].map(item => [item.id, item]));
for (const entry of curated.entries) {
  if (!/^(image|video)-[a-z0-9-]+$/.test(entry.id) || ids.has(entry.id)) throw new Error(`Invalid curated ID: ${entry.id}`);
  ids.add(entry.id);
  const linked = sourceCases.get(entry.caseId);
  if (!linked || linked.templateId !== entry.id || !entry.id.startsWith(`${entry.kind}-`)) throw new Error(`Missing case link: ${entry.id}`);
  if (!entry.title || !entry.category || !entry.prompt?.trim() || !entry.promptEn?.trim()) throw new Error(`Missing content: ${entry.id}`);
  if (!entry.source?.author || entry.source.url !== linked.source.url) throw new Error(`Mismatched case attribution: ${entry.id}`);
  if (entry.image !== linked.image || !existsSync(resolve(root, entry.image))) throw new Error(`Missing preview: ${entry.id}`);
  if (entry.kind === "video" && (entry.video !== linked.video || !existsSync(resolve(root, entry.video)))) throw new Error(`Missing clip: ${entry.id}`);
  if (/本项目|未验证|未复现|未经新主题|\/Users\/|原文见|template\/(?:image|video)-generation\//i.test(`${entry.prompt}\n${entry.promptEn}`)) throw new Error(`Unreviewed prompt: ${entry.id}`);
}
if (curated.entries.filter(item => item.kind === "image").length !== 67 || curated.entries.filter(item => item.kind === "video").length !== 25) throw new Error("Incorrect template totals");

function html(value) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function curatedSection(entries, kind) {
  const cells = entries.slice(0, 12).map(entry => {
    const target = kind === "video" ? entry.video : entry.image;
    return `<td width="33%" align="center" valign="top"><a href="../${target}"><img src="../${entry.image}" alt="${html(entry.title)}预览" width="220"></a><br><a href="#${entry.id}">${html(entry.title)}</a></td>`;
  });
  const rows = [];
  for (let i = 0; i < cells.length; i += 3) rows.push(`<tr>${cells.slice(i, i + 3).join("")}</tr>`);
  return [
    `## 来源适配模板 · ${entries.length} 套`, "",
    "<table>", ...rows, "</table>", "",
    ...entries.map(entry => `- [${entry.title}](#${entry.id})`), "",
    ...entries.flatMap(entry => [
      `<a id="${entry.id}"></a>`, "", `### ${entry.title}`, "", entry.summary, "",
      `<a href="../${kind === "video" ? entry.video : entry.image}"><img src="../${entry.image}" alt="${html(entry.title)}预览" width="${kind === "video" ? 360 : 320}"></a>`, "",
      `来源：[${entry.source.author}](${entry.source.url}) · [查看来源案例](../showcase/${kind}.md#${entry.caseId})`, "",
      ...(entry.inputs.length ? [`**可替换内容：** ${entry.inputs.map(input => `\`${input}\``).join(" · ")}`, ""] : []),
      "**中文 Prompt**", "", "```text", entry.prompt.replace(/[ \t]+$/gm, ""), "```", "",
      "<details>", "<summary>English Prompt</summary>", "", "```text", entry.promptEn.replace(/[ \t]+$/gm, ""), "```", "", "</details>", "",
    ]),
  ];
}

const pages = { image: "生图", video: "生视频" };
const readme = readFileSync(resolve(root, "README.md"), "utf8");
if (!readme.includes(`[生图模板](templates/image.md)`) || !readme.includes(`[生视频模板](templates/video.md)`))
  throw new Error("README template count is out of date");
for (const [kind, title] of Object.entries(pages)) {
  const entries = data.entries.filter((entry) => entry.kind === kind);
  const sourced = curated.entries.filter(entry => entry.kind === kind);
  const lines = [
    `# ${title} Prompt 模板`,
    "",
    `[返回首页](../README.md) · [浏览案例](../showcase/${kind}.md) · [查看来源目录](../catalog/${kind}.md)`,
    "",
    ...curatedSection(sourced, kind),
    `## 原创通用模板 · ${entries.length} 套`, "",
    ...entries.map((entry) => `- [${entry.title}](#${entry.id})`),
    "",
    ...entries.flatMap((entry) => [
      `<a id="${entry.id}"></a>`,
      "",
      `## ${entry.title}`,
      "",
      entry.summary,
      "",
      ...(entry.example
        ? [
            `<a href="../showcase/image.md#${entry.example}"><img src="../${showcase.images.find((item) => item.id === entry.example).image}" alt="${entry.title}案例预览" width="320"></a>`,
            "",
          ]
        : []),
      `**需要填写：** ${entry.inputs.map((input) => `\`[${input}]\``).join(" · ")}`,
      "",
      "```text",
      entry.prompt,
      "```",
      "",
      `**使用检查：** ${entry.tip}`,
      "",
    ]),
  ];
  const path = resolve(root, `templates/${kind}.md`);
  const content = `${lines.join("\n").trimEnd()}\n`;
  if (mode === "--write") writeFileSync(path, content);
  else if (readFileSync(path, "utf8") !== content)
    throw new Error(`Outdated templates page: ${kind}`);
}
console.log(`Validated ${data.entries.length} original and ${curated.entries.length} source-adapted prompt templates (${mode})`);
