import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const data = JSON.parse(
  readFileSync(resolve(root, "data/templates.json"), "utf8"),
);
const showcase = JSON.parse(
  readFileSync(resolve(root, "data/showcase.json"), "utf8"),
);
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

const pages = { image: "生图", video: "生视频" };
const readme = readFileSync(resolve(root, "README.md"), "utf8");
if (!readme.includes(`${data.entries.length} 套完整模板`))
  throw new Error("README template count is out of date");
for (const [kind, title] of Object.entries(pages)) {
  const entries = data.entries.filter((entry) => entry.kind === kind);
  const lines = [
    `# ${title} Prompt 模板`,
    "",
    `[返回首页](../README.md) · [浏览案例](../showcase/${kind}.md) · [查看来源目录](../catalog/${kind}.md)`,
    "",
    ...entries.map((entry) => `- [${entry.title}](#${entry.id})`),
    "",
    ...entries.flatMap((entry) => [
      `<a id="${entry.id}"></a>`,
      "",
      `## ${entry.title}`,
      "",
      entry.summary,
      "",
      `**需要填写：** ${entry.inputs.map((input) => `\`[${input}]\``).join(" · ")}`,
      "",
      "```text",
      entry.prompt,
      "```",
      "",
      `**使用检查：** ${entry.tip}`,
      "",
      ...(entry.example
        ? [
            `[查看生成案例](../showcase/image.md#${showcase.images.find((item) => item.id === entry.example)?.title ?? ""})`,
            "",
          ]
        : []),
    ]),
  ];
  const path = resolve(root, `templates/${kind}.md`);
  const content = `${lines.join("\n").trimEnd()}\n`;
  if (mode === "--write") writeFileSync(path, content);
  else if (readFileSync(path, "utf8") !== content)
    throw new Error(`Outdated templates page: ${kind}`);
}
console.log(`Validated ${data.entries.length} prompt templates (${mode})`);
