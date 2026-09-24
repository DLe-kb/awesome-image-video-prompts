# 贡献指南

欢迎补充有明确来源的生图、生视频案例，也欢迎修正失效链接、错误归类与不准确的描述。

## 条目要求

- 提供指向具体原帖、作品或模板页的公开链接；只有平台首页或搜索结果的链接不足以定位案例。
- 用自己的话写一句用途说明，选择与内容相符的标签。不要复制第三方提示词、教程正文或媒体文件。
- 来源案例仅提供链接与原创摘要；若提交自己的预览图和提示词，请同时给出生成条件、素材权利与实际输出文件。
- 不提交账号资料、私人路径、API Key、Cookie、付费内容或没有再分发权限的素材。
- 引用真人肖像、品牌、角色或音乐的案例，应让读者回到来源核对相关权利；不要将这些素材作为本仓库的可复用资产上传。

## 修改条目

编辑 [`data/catalog.json`](data/catalog.json)，保持每条记录的唯一 `id`、`kind`（`image` 或 `video`）、标题、用途、标签和来源 URL 完整。`id` 使用 `image-` 或 `video-` 加十位小写十六进制字符；可用 `node -e 'console.log(require("node:crypto").randomBytes(5).toString("hex"))'` 生成后半段。`related` 仅用于指向同一案例的另一公开页面。自写的完整提示词和示例图放在 [`data/showcase.json`](data/showcase.json)，详情见该文件的数据结构。

```bash
node scripts/catalog.mjs --write
node scripts/catalog.mjs --check
node scripts/showcase.mjs --check
```

生成的 `catalog/image.md` 和 `catalog/video.md` 应与数据文件一并提交。Pull Request（拉取请求）请说明改动条目、原始来源和验证范围；如需加入自己创作的完整提示词或生成结果，请同时提供内容权利说明和实际生成条件。
