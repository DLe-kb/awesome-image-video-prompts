# 食谱信息图转连续烹饪短片

[返回完整目录](../CATALOG.md)

![食谱信息图转连续烹饪短片](../../styles/video-recipe-infographic-cooking-sequence-source/preview.jpg)

[播放样片](../../styles/video-recipe-infographic-cooking-sequence-source/sample.mp4)

以一张多步骤食谱信息图为视觉分镜，先生成前半段，再续写后半段，得到保持食材状态、厨房环境、声效和烹饪顺序连续的竖屏美食短片。

类型：生视频 · 配套 Prompt · 烹饪

来源：[Oleksa AI（@OleksaFrame）](https://x.com/OleksaFrame/status/2097669808800113040)

## 完整 Prompt

```text
模型：Gemini Omni 1.1 Flash

镜头结构：严格按照下列顺序生成 5 个镜头，总时长 10 秒，竖屏 9:16。

参考图：

@Image1 是视觉故事板参考，用于约束烹饪顺序、黑色铸铁煎锅、食材、成品造型、深色操作台面和柔和窗光下的食物摄影风格。将参考图中的分格画面转化为全新的、铺满画幅的实拍烹饪镜头。

画面内容锁定：

每一帧只出现食物、厨具、食材、自然入镜的双手和厨房台面。实拍烹饪画面必须铺满整个 9:16 画幅。所有画面区域保持干净，不出现文字。源海报中的排版、网格、标题、步骤编号、说明文字、标志及其他图形元素仅作为参考信息，不得出现在生成的视频中。

声音内容锁定：

音轨只包含与画面同步的烹饪声音和安静的厨房环境底噪，包括近距离切菜声、倒油声、煎锅滋滋声、木勺移动声、蔬菜落锅声、倒入番茄声、酱汁冒泡声和轻柔蒸汽声。不得出现对白、旁白、人声或音乐。

整体视觉：

70mm 大画幅电影质感，细腻自然的胶片颗粒，宽广动态范围，丰富食物细节，柔和的高光过渡和克制的变形宽银幕特征。采用竖屏 9:16 构图，食物、厨具和双手保持在中央安全区。柔和漫射日光从画面左侧穿过白色窗帘进入，浅色石材台面提供温柔补光。饱和番茄红与黑色铸铁和温暖中性的厨房表面形成对比。保留真实的蒸汽、油流、半透明洋葱、红椒纹理、香料颗粒、酱汁气泡和自然手部动作。

镜头 1（0–1.5 秒）：成品钩子镜头
相机：四分之三近景英雄视角，快速、平滑地推向煎锅。
画面动作：完成的北非蛋（shakshuka）在硬皮面包旁轻轻冒泡，蒸汽穿过柔和窗光。
声音：近距离酱汁冒泡声和轻微煎锅滋滋声。
收尾画面：圆形煎锅边缘充满画面。
转场：匹配剪辑至下一镜头。

镜头 2（1.5–3.5 秒）：准备食材
相机：锁定机位的俯拍中景。
画面动作：双手完成洋葱切丁和红椒切片，随后把蒜末、香料、番茄、鸡蛋、菲达奶酪和香草分别摆入小碗。
声音：干净利落的切刀节奏、刀接触砧板的敲击声，以及小碗接触石材台面的声音。
收尾画面：一只手拿起橄榄油瓶。
转场：通过动作衔接剪辑进入下一镜头。

镜头 3（3.5–5.5 秒）：热油并炒洋葱
相机：微距四分之三插入镜头，随后转为俯拍特写。
画面动作：金色橄榄油倒入黑色煎锅，紧接着加入洋葱丁，木勺在不断增强的滋滋声中搅拌。
声音：顺滑倒油声，随后是清脆的新鲜滋滋声和木勺刮过锅底的干涩声。
收尾画面：木勺向画面右侧扫过。
转场：匹配运动转场至下一镜头。

镜头 4（5.5–7.5 秒）：加入红椒、蒜和香料
相机：俯拍近景，轻微向前推进。
画面动作：红椒条落入变软的洋葱，随后加入蒜末、小茴香、烟熏红椒粉和辣椒碎。木勺以一个连续动作把所有食材翻拌均匀。
声音：蔬菜落锅声、更明亮的煎锅滋滋声，以及颗粒状香料擦过锅面的声音。
收尾画面：被红椒粉染红的油从木勺下方扩散。
转场：直接切至下一镜头。

镜头 5（7.5–10 秒）：加入番茄并炖煮
相机：低机位四分之三近景，短距离滑轨后移。
画面动作：压碎的番茄倒入煎锅。通过清晰的烹饪时间跳切，表现酱汁持续冒泡、收汁并明显变稠。
声音：浓稠番茄倒入声逐渐过渡为湿润、密集的冒泡声。
收尾画面：浓稠、冒泡的红色酱汁铺满最后一帧，并持续冒泡至镜头结束。
```

## English Prompt

```text
MODEL: Gemini Omni 1.1 Flash

SHOT STRUCTURE: 5 shots, 10 seconds, vertical 9:16, exactly as listed.

REFS:

@Image1 = visual storyboard reference. It controls the cooking order, black cast-iron skillet, ingredients, finished-dish styling, dark surfaces, and soft window-lit food photography. Convert its picture panels into fresh full-frame live-action cooking shots.

VISUAL CONTENT LOCK:

Every frame contains only food, cookware, ingredients, natural hands, and kitchen surfaces. Live-action cooking imagery fills the entire 9:16 frame. All surfaces remain clean and unlettered. The source poster’s typography, grid, headings, step numbers, captions, logos, and graphic elements remain reference metadata outside the generated video.

AUDIO CONTENT LOCK:

The soundtrack consists exclusively of synchronized cooking sounds and quiet kitchen room tone. Close dry chopping, oil pouring, pan sizzling, wooden-spoon movement, vegetables landing, tomato pouring, bubbling sauce, and soft steam. Spoken voices, narration, vocals, and music remain outside the soundtrack.

GLOBAL LOOK:

70mm large-format film aesthetic, fine organic grain, broad dynamic range, deep food detail, soft highlight roll-off, restrained anamorphic character. Vertical 9:16 composition with the food, cookware, and hands inside the central safe area. Soft diffused daylight enters from camera-left through a white curtain; pale stone counters return gentle fill. Saturated tomato red contrasts with black cast iron and warm neutral kitchen surfaces. Preserve realistic steam, oil flow, translucent onion, red-pepper texture, spice granules, sauce bubbles, and natural hand movement.

SHOT 1 (0–1.5s) — Finished-dish hook

camera: three-quarter close hero view, quick smooth push toward the skillet.

action_visual: finished shakshuka bubbles gently beside crusty bread; steam crosses the soft window light.

sound: close bubbling sauce and faint skillet sizzle.

exit: the circular skillet rim fills the frame.

(MATCH CUT TO)

SHOT 2 (1.5–3.5s) — Prepare ingredients

camera: locked overhead medium shot.

action_visual: hands finish dicing onion and slicing red pepper, then arrange minced garlic, spices, tomatoes, eggs, feta, and herbs in small bowls.

sound: clean knife rhythm, cutting-board taps, bowls touching the stone counter.

exit: one hand lifts an olive-oil bottle.

(CUTTING ON ACTION TO)

SHOT 3 (3.5–5.5s) — Heat oil and sauté onion

camera: macro three-quarter insert shifting into an overhead close shot.

action_visual: golden olive oil pours into the black skillet; diced onion follows immediately and a wooden spoon stirs through the rising sizzle.

sound: smooth oil pour followed by a sharp fresh sizzle and dry wooden scraping.

exit: the spoon sweeps screen-right.

(MATCH ON MOVEMENT TO)

SHOT 4 (5.5–7.5s) — Add pepper, garlic, and spices

camera: overhead close shot with a subtle push-in.

action_visual: red pepper strips fall into the softened onion, followed by minced garlic, cumin, smoked paprika, and chili flakes. The spoon folds everything together in one continuous action.

sound: vegetables landing, brighter pan sizzle, granular spices brushing the skillet.

exit: paprika-red oil spreads beneath the spoon.

(CUT TO)

SHOT 5 (7.5–10s) — Add tomatoes and simmer

camera: low three-quarter close view, short dolly back.

action_visual: crushed tomatoes pour into the skillet. A clean cooking-time jump reveals the sauce bubbling, reducing, and becoming visibly thicker.

sound: dense tomato pour transitioning into wet clustered bubbling.

exit: the thick bubbling red surface fills the final frame; bubbling continues across the extension.
```

[查看关联 Prompt](../copy-prompts/video-recipe-infographic-cooking-sequence-source.md)

[打开 style.json](../../styles/video-recipe-infographic-cooking-sequence/style.json) · [打开条目目录](../../styles/video-recipe-infographic-cooking-sequence/)

<!-- Generated by scripts/build.mjs. -->
