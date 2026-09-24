# Awesome Image & Video Prompts

面向内容创作者的 AI 生图、生视频案例与提示词来源索引。按创作目标查找公开案例，回到原作者或来源页面阅读提示词、输入要求与展示结果。

| 浏览方向 | 条目 | 适合查找 |
| --- | ---: | --- |
| [生图案例](catalog/image.md) | 68 | 广告视觉、海报、信息图、摄影、产品展示与插画 |
| [生视频案例](catalog/video.md) | 46 | 运镜、动画、短片、产品广告与多镜头创作 |

## 使用方式

1. 按生图或生视频进入索引，通过标题、用途和标签定位案例。
2. 打开“来源”查看原帖；有“相关页面”时，可进一步查看平台整理的案例或模板。
3. 核对原页面中的提示词、模型、输入素材、使用条件和许可，再决定是否用于自己的创作。

**验证状态：** 当前 114 条均为公开来源的线索，尚未由本仓库独立复现。来源展示效果不等于换一个模型、素材或账号后仍可得到相同结果。索引标题和用途用于检索，不一定与来源页原题名相同；部分链接是案例或教程，不一定提供完整可复制的提示词。

## 收录范围

- 生图：文生图、图像编辑，以及用于海报、广告、信息图、摄影等创作的视觉参考。
- 生视频：文生视频、图生视频、镜头运动和分阶段视频工作流。
- 不收录完整的网站、PPT、代码渲染视频或与生图、生视频无关的通用提示词。

本仓库只保存原创索引文字和外部链接，**不镜像第三方提示词原文、图片、视频或教程文件**。来源页面的署名、授权范围及使用条款以原作者和平台声明为准。链接失效、来源归属有误或需要修正条目时，欢迎提交 [Issue](https://github.com/DLe-kb/awesome-image-video-prompts/issues) 或按[贡献指南](CONTRIBUTING.md)提交修改。

## 数据与许可

条目数据见 [`data/catalog.json`](data/catalog.json)；索引页面由该文件生成。新条目须提供可定位的公开链接、简明用途和如实标注的验证状态。运行 `node scripts/catalog.mjs --check` 可校验数据和页面一致性。

本仓库自行编写的索引文字、元数据整理和校验脚本采用 [MIT License](LICENSE)。外部链接所指向的提示词、媒体和其他作品**不在本仓库的许可范围内**。

---

English: A source-linked directory for AI image and video creation. Entries are not independently reproduced; original prompts and media remain with their respective creators.
