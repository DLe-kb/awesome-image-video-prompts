# 贡献指南

欢迎补充有明确来源的生图、生视频案例，也欢迎修正失效链接、错误归类与不准确的描述。

## 条目要求

- 提供指向具体原帖、作品或模板页的公开链接；只有平台首页或搜索结果的链接不足以定位案例。
- 用自己的话写一句用途说明，选择与内容相符的标签；提供完整可用的 Prompt、案例预览与原作者链接。
- 区分原作者公布的提示词、中文翻译和根据画面整理的适配提示词；不要把适配稿称为作者原文，也不要把来源样片称为自己生成。
- 不提交账号资料、私人路径、API Key、Cookie、付费内容或没有再分发权限的素材。
- 引用真人肖像、品牌、角色或音乐的案例，应让读者回到来源核对相关权利；不要将这些素材作为本仓库的可复用资产上传。

## 修改条目

编辑 [`data/catalog.json`](data/catalog.json) 和 [`data/cases.json`](data/cases.json)，保持一致的唯一 `id`、`kind`（`image` 或 `video`）、标题、用途、标签、来源与原作者。来源案例的预览放在 `assets/cases/`，视频附浏览器可播放的 MP4；原创案例放在 [`data/showcase.json`](data/showcase.json)。来源素材不自动获得本仓库的 MIT 许可。

```bash
node scripts/catalog.mjs --write
node scripts/showcase.mjs --write
node scripts/catalog.mjs --check
node scripts/showcase.mjs --check
```

生成的 `catalog/` 和 `showcase/` 页面应与数据文件一并提交。Pull Request（拉取请求）请说明原始来源及预览、样片的使用范围；移除来源内容可直接提交 Issue（问题反馈）。

## 贡献 Prompt 模板

原创通用模板放在 [`data/templates.json`](data/templates.json)，填写类型、标题、用途、需要替换的变量、完整 Prompt 和使用检查。来源适配模板放在 [`data/curated-templates.json`](data/curated-templates.json)，提供对应案例 ID、中英文完整 Prompt、原作者与原始链接；预览沿用该案例的媒体，不把来源画面称作适配模板的生成结果。不要将第三方原文改几个词后作为原创模板提交。生成页面与校验命令：

```bash
node scripts/templates.mjs --write
node scripts/templates.mjs --check
```
