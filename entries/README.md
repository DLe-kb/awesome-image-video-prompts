# 独立条目目录

本目录是 232 条案例与 Prompt 的编辑来源。先打开[按中文标题排列的完整导航](INDEX-条目导航.md)，再进入单条文件；预览与样片仍统一放在 `assets/`，这里仅保存路径，不重复复制媒体。

```text
entries/
├── image/<来源案例 ID>/
│   ├── case.json           来源生图案例：68 条
│   └── prompt.json         对应的中英文配套 Prompt；有则同目录
├── video/<来源案例 ID>/
│   ├── case.json           来源生视频案例：46 条
│   └── prompt.json         对应的中英文配套 Prompt；有则同目录
├── original/
│   ├── image/<ID>/case.json  原创生图案例：4 条
│   └── video/<ID>/case.json  原创视频工作流：2 条
└── original-templates/
    └── <ID>.json             原创通用填空模板：20 套
```

来源案例目录中有 92 份 `prompt.json`；另有 22 条来源案例没有配套 Prompt。案例文件保存完整正文、作者、原帖和媒体路径；配套 Prompt 文件保存独立的中英文完整正文与案例回链。两者不能混称为同一条提示词，也不能把来源画面当作配套 Prompt 改写后的生成结果。

可以从[杯内鱼眼广告的案例 JSON](image/image-828d8ade3e/case.json)与[配套 Prompt JSON](image/image-828d8ade3e/prompt.json)看生图结构；[食谱短片案例](video/video-60b5dcaaac/case.json)保留首段和续写的完整提示词；[植物科学图版](original-templates/botanical-editorial.json)是原创填空模板。

来源案例 `case.json` 的 `catalog.sourceLabel` 保留目录中使用的来源名称，`catalog.related` 保留补充链接。少数案例中 `source.url` 指向作者主页，而目录链接指向具体收录页面；这时 `catalog.sourceUrl` 单独保存该目录链接，不能将两者合并或互相覆盖。

## 编辑与校验

`data/cases.json`、`data/catalog.json`、`data/showcase.json`、`data/curated-templates.json` 和 `data/templates.json` 仍保留完整条目，供画廊和生成页面读取。它们是兼容输出，不再作为条目正文的编辑入口；`data/entry-index.json` 是画廊链接索引，`INDEX-条目导航.md` 是人类可读的标题索引，两者均由脚本生成。修改单条文件后，在仓库根目录运行：

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

`--check` 会核对 232 个独立文件是否全部覆盖汇总、ID 是否唯一、案例与配套 Prompt 是否相互对应、来源和媒体是否匹配；CI 也执行这些检查。新增条目的要求与权利边界见[贡献指南](../CONTRIBUTING.md)。来源预览、样片和第三方 Prompt 不属于本仓库的 MIT 授权范围。
