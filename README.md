# Photoshop-Storyboard-Exporter
一款自动裁剪分镜摄影表并支持连续镜头命名的 Photoshop 脚本
## 中文介绍

分镜导出脚本是一款专为动画师、漫画家、分镜师设计的 Photoshop 自动化工具。
它能够根据你绘制的水平/垂直参考线，自动将分镜画格裁剪为高清画面，并按照专业摄影表规范命名。

**核心功能：**
- 支持垂直优先（左右固定、上下居中）或水平优先（上下固定、左右居中）两种裁剪基准
- 水平参考线定义每个镜头区域，垂直参考线约束画面宽度
- 每个区域可单独设置子镜头数，实现同镜头多帧导出
- 创新的图层名称标记法：在图层名后添加 `[cont:3,4]` 即可让区域3、4共享主编号，自动生成 `002-01, 002-02` 等连续镜头文件名
- 支持仅导出当前可见图层，或一键处理全部图层（每个图层独立命名）
- 可保存/调用预设（1080p、4K、方形等），不同项目快速切换
- 导出计时、日志记录，便于追踪

**系统要求：**
- Adobe Photoshop CS6 或更高版本（支持 ExtendScript）
- Windows / macOS

**安装方法：**
1. 将下载的 .jsx 文件放入 Photoshop 的 Scripts 文件夹：
   - Windows: `C:\Program Files\Adobe\Adobe Photoshop [版本]\Presets\Scripts`
   - macOS: `/Applications/Adobe Photoshop [版本]/Presets/Scripts`
2. 重启 Photoshop，在菜单栏 `文件 → 脚本` 中即可找到并运行。

**使用方法：**
1. 打开你的分镜 PSD，确保：
   - 添加至少两条**水平参考线**划定区域；
   - （可选）添加两条**垂直参考线**限制画面宽度。
2. 运行脚本，设置输出文件夹、起始编号、裁剪模式。
3. 若要使用连续镜头命名，请将图层重命名并加上 `[cont:区域号]` 标记（如 `场景1 [cont:3,4]`）。
4. 点击开始导出，即可获得排序整齐的 jpg 文件。

**反馈与更新：**
项目开源在 GitHub：[仓库地址]
欢迎提交 Issue 或 PR，共同完善！

## English Introduction

The Storyboard Export script is a Photoshop automation tool designed for animators, comic artists, and storyboard artists. It automatically crops your storyboard panels based on guides and renames them in a professional clapperboard sequence.

**Key Features:**
- Vertical priority (fixed left/right, centered vertically) or horizontal priority (fixed top/bottom, centered horizontally) cropping
- Define regions with horizontal guides, constrain width with vertical guides
- Each region can have multiple sub-shots (continuous takes) with correct filenames like `002-01`, `002-02`
- Innovative layer-name tagging: add `[cont:3,4]` to the layer name to share the main number for continuous shots
- Process only visible layers or all layers simultaneously, each layer gets its own numbering sequence
- Preset management (1080p, 4K, Square) for quick project switching
- Export timer and log for production tracking

**Requirements:**
- Adobe Photoshop CS6 or above
- Windows / macOS

**Installation:**
1. Copy the .jsx file to the Scripts folder of Photoshop:
   - Windows: `C:\Program Files\Adobe\Adobe Photoshop [version]\Presets\Scripts`
   - macOS: `/Applications/Adobe Photoshop [version]/Presets/Scripts`
2. Restart Photoshop and access the script via `File → Scripts`.

**Usage:**
1. Open your storyboard PSD with at least two horizontal guides (and optionally two vertical guides).
2. Run the script, set the output folder, start number, and crop mode.
3. For continuous shots, rename your layer like `Scene1 [cont:3,4]`.
4. Click export and get neatly numbered jpg files.

**Open Source & Feedback:**
This script is open source on GitHub: [repo link]
Issues and PRs are welcome!
