# 贡献指南

欢迎补充生图、生视频 Prompt，或修正现有内容的分类、来源与媒体。

## 新增风格

1. 在 `styles/image-<模板名>/` 或 `styles/video-<模板名>/` 创建目录。模板名用小写英文和连字符描述内容，不使用随机 ID 或 `-source` 后缀；来源类型由 JSON 的 `type` 字段记录。
2. 放入唯一的 `style.json`，填写 `style_version`、`style_slug`、`kind`（`image` 或 `video`）、`type`、标题、摘要、分类、标签和提示词。`style_slug` 与目录名需保持一致，字段说明见 [`schemas/style.schema.json`](schemas/style.schema.json)。
3. 每个条目都要有对应的 `preview.jpg` 或 `preview.webp`；生视频条目还必须有可播放的 `sample.mp4`。媒体须对应所记录的来源案例，不能用无关画面充当结果；改写版的 Prompt 不应被描述成已用来源媒体重新验证。构建后会生成 `thumbnail.jpg`，供 README 等尺寸展示使用。
4. 来源内容填写原作者和具体作品链接；暂时找不到作品链接时可用作者主页，设置 `source.linkType` 为 `profile`，页面会标明“作者主页”。YouMind 整理页或其他 GitHub 汇编不能替代作者来源。连作者来源也没有时标为 `unverified`（来源待核实），不可标为原创。同一案例只保留一份 `style.json`：单段案例的 `prompt` 保留来源原语言全文（英文原文则放中文译文），`promptEn` 保留英文原文或完整英译。多阶段工作流使用有序的 `workflow`，每个步骤分别填写 `title`、`prompt` 和 `promptEn`，不得将不同阶段强行合并或删减为摘要。不要另设第三份公开提示词，也不要创建互相关联的第二个案例。
5. 视频 `sample.mp4` 仍保存在案例目录，但 GitHub 的文件页不保证内嵌播放；生成的“播放样片”链接会打开 GitHub Pages 的在线播放器。
6. 安装 FFmpeg 后，运行下列命令生成画廊缩略图、详细目录与可复制页面，并检查生成文件与 JSON 一致。

```bash
node scripts/build.mjs --write
node scripts/build.mjs --check
```

`style.json` 是唯一的内容编辑入口。不要直接修改 README 中的“全部风格”、`docs/CATALOG.md`、`docs/copy-prompts/` 或 `site/styles-data.json`；它们由脚本生成。
新增条目时也要更新中英文 README 中的人类可读数量。

## 分类与标签

- `kind` 只区分生图、生视频；`category` 选一个最贴近交付作品的主分类，名称以 [`data/taxonomy.json`](data/taxonomy.json) 为准。不要把“最近”“推荐”等页面状态写进案例。
- `tags` 至少填一个与主分类不同、实际适用的题材、风格、用途或制作方法，可保留具体镜头技法等长尾词；不要堆砌无对应画面的流行词，也不要重复主分类或同义词。停用名称与替代词见词表的 `replacedTerms`。
- 展示时按 `category`、`tags` 的顺序排成一组词；第一个词是主分类，后面的词是补充标签，不分成“主分类”和“标签”两行。
- 主分类由画廊下拉框筛选；标签和关键词由搜索框检索。改动词表或案例后运行构建检查。

## 内容与许可

- 提供清晰可用的 Prompt，选择准确的分类与题材标签；有多段视频流程时保留完整阶段、先后顺序及每一步的原文和英译。
- 保留作者署名与作品链接；只有作者主页时注明其为主页，不将其说成具体作品链接。整理、翻译或改写版本应在同一案例的相应字段标明。
- 不提交个人账号资料、密钥、Cookie、私人路径、付费内容或无权再分发的媒体。
- 第三方媒体与提示词不因收录而获得仓库的 MIT 许可；提交者需要确认其传播范围。
