# 贡献指南

欢迎补充生图、生视频 Prompt，或修正现有内容的分类、来源与媒体。

## 新增风格

1. 在 `styles/<名称>/` 创建一个目录，名称采用小写英文和连字符。
2. 放入唯一的 `style.json`，填写 `style_version`、`style_slug`、`kind`（`image` 或 `video`）、`type`、标题、摘要、分类和完整 `prompt`。`style_slug` 与目录名需保持一致，字段说明见 [`schemas/style.schema.json`](schemas/style.schema.json)。
3. 有预览或样片时，与 JSON 放在同一目录，命名为 `preview.jpg`、`preview.webp` 或 `sample.mp4`。在 JSON 中用相对文件名引用；关联其他条目的媒体可以使用相对路径，不复制一份。
4. 来源内容填写作者和原始链接；关联版本使用 `relatedStyle` 指向另一条风格目录。翻译可放在 `promptEn`，填空模板需列出 `inputs`。
5. 运行下列命令生成画廊、详细目录与可复制页面，并检查生成文件与 JSON 一致。

```bash
node scripts/build.mjs --write
node scripts/build.mjs --check
```

`style.json` 是唯一的内容编辑入口。不要直接修改 README 中的“全部风格”、`docs/CATALOG.md`、`docs/copy-prompts/` 或 `site/styles-data.json`；它们由脚本生成。
新增条目时也要更新中英文 README 中的人类可读数量。

## 内容与许可

- 提供清晰可用的 Prompt，选择准确的分类与题材标签；有多段视频流程时保留完整阶段与先后顺序。
- 保留作者署名与具体作品链接。整理、翻译或改写版本应通过独立条目或相应字段标明关系。
- 不提交个人账号资料、密钥、Cookie、私人路径、付费内容或无权再分发的媒体。
- 第三方媒体与提示词不因收录而获得仓库的 MIT 许可；提交者需要确认其传播范围。
