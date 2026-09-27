# 贡献指南

欢迎补充生图、生视频 Prompt，或修正现有内容的分类、来源与媒体。

## 新增风格

1. 在 `styles/<名称>/` 创建一个目录，名称采用小写英文和连字符。
2. 放入唯一的 `style.json`，填写 `style_version`、`style_slug`、`kind`（`image` 或 `video`）、`type`、标题、摘要、分类和完整 `prompt`。`style_slug` 与目录名需保持一致，字段说明见 [`schemas/style.schema.json`](schemas/style.schema.json)。
3. 每个条目都要有对应的 `preview.jpg` 或 `preview.webp`；生视频条目还必须有可播放的 `sample.mp4`。媒体须对应所记录的来源案例，不能用无关画面充当结果；改写版的 Prompt 不应被描述成已用来源媒体重新验证。构建后会生成 `thumbnail.jpg`，供 README 等尺寸展示使用。
4. 来源内容填写原作者和具体作品链接；暂时找不到作品链接时可用作者主页，设置 `source.linkType` 为 `profile`，页面会标明“作者主页”。YouMind 整理页或其他 GitHub 汇编不能替代作者来源。连作者来源也没有时标为 `unverified`（来源待核实），不可标为原创。同一案例只保留一份 `style.json`：`prompt` 放中文完整使用版，`promptEn` 放英文使用版；仅当来源记录另有不同文本时保存在 `sourcePrompt`，不创建互相关联的第二个案例。
5. 视频 `sample.mp4` 仍保存在案例目录，但 GitHub 的文件页不保证内嵌播放；生成的“播放样片”链接会打开 GitHub Pages 的在线播放器。
6. 安装 FFmpeg 后，运行下列命令生成画廊缩略图、详细目录与可复制页面，并检查生成文件与 JSON 一致。

```bash
node scripts/build.mjs --write
node scripts/build.mjs --check
```

`style.json` 是唯一的内容编辑入口。不要直接修改 README 中的“全部风格”、`docs/CATALOG.md`、`docs/copy-prompts/` 或 `site/styles-data.json`；它们由脚本生成。
新增条目时也要更新中英文 README 中的人类可读数量。

## 内容与许可

- 提供清晰可用的 Prompt，选择准确的分类与题材标签；有多段视频流程时保留完整阶段与先后顺序。
- 保留作者署名与作品链接；只有作者主页时注明其为主页，不将其说成具体作品链接。整理、翻译或改写版本应在同一案例的相应字段标明。
- 不提交个人账号资料、密钥、Cookie、私人路径、付费内容或无权再分发的媒体。
- 第三方媒体与提示词不因收录而获得仓库的 MIT 许可；提交者需要确认其传播范围。
