# 贡献指南

欢迎补充有明确来源的生图、生视频案例，也欢迎修正失效链接、错误归类与不准确的描述。

## 条目要求

- 提供指向具体原帖、作品或模板页的公开链接；只有平台首页或搜索结果的链接不足以定位案例。
- 用自己的话写一句用途说明，选择与内容相符的标签；提供完整可用的 Prompt、案例预览与原作者链接。
- 区分原作者公布的提示词、中文翻译和根据画面整理的适配提示词；不要把适配稿称为作者原文，也不要把来源样片称为自己生成。
- 不提交账号资料、私人路径、API Key、Cookie、付费内容或没有再分发权限的素材。
- 引用真人肖像、品牌、角色或音乐的案例，应让读者回到来源核对相关权利；不要将这些素材作为本仓库的可复用资产上传。

## 修改条目

从 [`entries/`](entries/README.md) 找到对应的独立 JSON，再修改条目。来源案例在 `entries/image/<案例 ID>/case.json` 或 `entries/video/<案例 ID>/case.json`；有对应的中英文配套 Prompt 时，同目录还有 `prompt.json`。原创案例与工作流在 `entries/original/<image|video>/<ID>/case.json`，原创填空模板在 `entries/original-templates/<ID>.json`。新来源案例使用唯一的 `image-` 或 `video-` 加十位十六进制 ID，配套 Prompt 用 `caseId` 和案例的 `templateId` 双向关联。

来源案例预览放在 `assets/cases/`，视频附浏览器可播放的 MP4；JSON 中只引用媒体路径。保留完整 Prompt、作者、原帖和提示词来源性质。`catalog.sourceLabel` 是案例索引中的来源名称；当索引链接与案例的 `source.url` 不同时，将索引链接保存在 `catalog.sourceUrl`，不要覆盖作者链接。来源素材不自动获得本仓库的 MIT 许可。

```bash
node scripts/entries.mjs --write
node scripts/catalog.mjs --write
node scripts/showcase.mjs --write
node scripts/templates.mjs --write
node scripts/entries.mjs --check
node scripts/catalog.mjs --check
node scripts/showcase.mjs --check
node scripts/templates.mjs --check
```

脚本会同步 `data/` 汇总与生成页面，不要再直接编辑汇总中的条目正文。新增条目时还要更新 README 中的人类可读数量和相应页面的数量校验。Pull Request（拉取请求）请说明原始来源及预览、样片的使用范围；移除来源内容可直接提交 Issue（问题反馈）。

## 贡献 Prompt 模板

原创通用模板放在 `entries/original-templates/<ID>.json`，填写类型、标题、用途、需要替换的变量、完整 Prompt 和使用检查。来源配套 Prompt 放在对应案例的 `prompt.json`，提供案例 ID、中英文完整 Prompt、原作者与原始链接；预览沿用该案例的媒体，不把来源画面称作配套 Prompt 的生成结果。不要将第三方原文改几个词后作为原创模板提交。完成编辑后按上一节的顺序同步与校验；模板页也可以单独检查：

```bash
node scripts/templates.mjs --check
```
