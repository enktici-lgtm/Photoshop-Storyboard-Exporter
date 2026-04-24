# Photoshop Storyboard Exporter

> 🎬 **一键完成分镜裁剪与专业摄影表命名，让动画师/分镜师每天节省 2 小时以上重复劳动。**

一款为动画、漫画、影视前期创作者打造的 Photoshop 自动化脚本。根据您绘制的参考线，自动裁剪画格、导出高清 JPG，并生成符合行业规范的连续镜头编号（如 `002-01`, `002-02`），彻底告别手动导出和重命名的繁琐流程。

<div align="center">
  <img src="https://github.com/user-attachments/assets/0dffbb9d-60d0-4ebf-bec8-5a65bb9f42c0" width="600" alt="脚本主界面" />
  <p><b>▲ 设置参考线</b> — 水平参考线定义区域，垂直参考线限制宽度</p>
  <br/>
  <img src="https://github.com/user-attachments/assets/aed0c2d5-0e86-4c0a-bf04-963d84a8ebc6" width="600" alt="导出设置对话框" />
  <p><b>▲ 一键配置</b> — 选择输出目录、裁剪模式、子镜头数，智能命名</p>
  <br/>
  <img src="https://github.com/user-attachments/assets/1c10c07e-925e-4831-934f-55a3403f4ed2" width="600" alt="导出效果展示" />
  <p><b>▲ 导出效果</b> — 连续镜头自动编号，告别混乱文件名</p>
</div>

---

## ✨ 为什么你需要它？

| 传统手工流程 | 使用本脚本 |
|--------------|------------|
| 手动裁剪每个画格，反复调整尺寸 | 基于参考线**自动裁剪**，一次到位 |
| 逐个导出图层，手动输入文件名 | **一键批量导出**所有图层，智能递增编号 |
| 连续镜头命名混乱（`002_v2`, `002_final`） | 图层标记 `[cont:3,4]`，**自动生成 `002-01, 002-02`** |
| 不同项目反复修改导出尺寸 | 预设管理（1080p / 4K / 方形），**一键切换** |
| 每次导出消耗 30-60 分钟 | **数秒完成**，一天可多处理数倍镜头 |

> ⏱️ **实测：一个拥有 10 个图层、每层 5 个区域的分镜文件，手动需要约 45 分钟，本脚本只需 8 秒。**

---

## 📦 核心功能

- 🎯 **智能裁剪**：垂直优先 / 水平优先两种模式，自动适应画幅比例（1920×1080 等）。
- 🧩 **多图层批处理**：可仅处理当前可见图层，或一键处理所有图层，每个图层独立编号。
- 🔢 **连续镜头命名**：独创图层标记法（`[cont:区域号]`），同镜头连续画面自动共享主编号并追加子编号。
- ⚙️ **自定义分辨率 & 预设**：内置 1080p、4K、方形等预设，也可自由修改并保存。
- ⏱️ **导出计时 & 日志**：自动生成日志文件，方便核对与流程追踪。

---

## 💻 系统要求

- **Adobe Photoshop CS6** 或更高版本（支持 ExtendScript）
- Windows 或 macOS

---

## 📥 安装方法

1. 在 [Releases](https://github.com/enktici-lgtm/Photoshop-Storyboard-Exporter/releases) 页面下载最新的 `StoryboardExport_v1.0_CN.jsx`（中文界面）或 `StoryboardExport_v1.0_EN.jsx`（英文界面）。
2. 将脚本文件复制到 Photoshop 的 Scripts 文件夹：
   - **Windows**: `C:\Program Files\Adobe\Adobe Photoshop [版本]\Presets\Scripts`
   - **macOS**: `/Applications/Adobe Photoshop [版本]/Presets/Scripts`
3. 重启 Photoshop，在菜单栏 `文件 → 脚本` 中即可看到并运行。

---

## 🚀 快速上手

### 1. 准备你的分镜文件
确保 PSD 中包含：
- **至少两条水平参考线**（定义每个镜头区域）。
- **（可选）两条垂直参考线**（在“垂直优先”模式下固定左右边界，或在“水平优先”模式下作为居中范围）。

### 2. 运行脚本并设置
- **预设**：快速切换输出分辨率。
- **输出文件夹**：选择导出位置。
- **起始编号**：支持纯数字（`000`）或带前缀（`SH001`），自动递增。
- **裁剪基准**：
  - *垂直优先*：左右由垂直参考线固定，上下居中裁剪。
  - *水平优先*：上下由水平参考线固定，左右在垂直参考线（或画布）内居中。
- **图层范围**：仅可见图层或所有图层。
- **子镜头数**：每个区域可以指定导出张数，适合同一构图的多帧连续。

### 3. 标记连续镜头（可选）
在图层名称末尾添加 `[cont:区域号]`，例如 `场景1 [cont:3,4]`。  
这表示区域 3 和区域 4 是同一镜头的连续拍摄，导出时它们将共享主编号，并自动生成 `002-01`、`002-02` 等子编号。

详细帮助可点击对话框中的 **💡 如何标记连续镜头？** 按钮查看。

### 4. 导出
点击 **开始导出**，等待数秒即可在输出文件夹得到整齐命名的 JPG 文件，同时生成 `export_log.txt` 日志。

---

## 🤝 反馈与贡献

本项目完全开源，欢迎通过以下方式参与：
- **提交 Issue**：报告 Bug 或提出新功能需求。
- **提交 Pull Request**：改进代码或完善文档。
- **分享给朋友**：让更多创作者告别重复劳动。

GitHub 仓库：[https://github.com/enktici-lgtm/Photoshop-Storyboard-Exporter](https://github.com/enktici-lgtm/Photoshop-Storyboard-Exporter)

---

## 📄 许可证

本项目基于 [MIT License](LICENSE) 开源，可自由使用、修改和分发。

---

### English Version

# Photoshop Storyboard Exporter

> 🎬 **One‑click storyboard cropping & professional clapperboard naming. Saves animators & storyboard artists 2+ hours daily.**

A Photoshop automation script for animation, comics, and pre‑production. It automatically crops panels based on guides, exports high‑res JPGs, and generates industry‑standard continuous shot numbering (e.g., `002‑01`, `002‑02`). Say goodbye to manual exporting and tedious file renaming.

<div align="center">
  <img src="https://github.com/user-attachments/assets/0dffbb9d-60d0-4ebf-bec8-5a65bb9f42c0" width="600" alt="Script UI" />
  <p><b>▲ Setting up guides</b> — Horizontal guides define regions; vertical guides constrain width</p>
  <br/>
  <img src="https://github.com/user-attachments/assets/aed0c2d5-0e86-4c0a-bf04-963d84a8ebc6" width="600" alt="Export dialog" />
  <p><b>▲ One‑click configuration</b> — Choose output folder, crop mode, sub‑shot count, and smart naming</p>
  <br/>
  <img src="https://github.com/user-attachments/assets/1c10c07e-925e-4831-934f-55a3403f4ed2" width="600" alt="Export result" />
  <p><b>▲ Export result</b> — Continuous shots are numbered automatically, no more messy filenames</p>
</div>

---

## ✨ Why you need it

| Traditional manual workflow | With this script |
|----------------------------|------------------|
| Manually crop each panel and readjust size | **Auto‑crop** based on guides, perfectly framed every time |
| Export layer by layer, type filenames one by one | **Batch export** all layers with smart incremental numbering |
| Continuous shot naming chaos (`002_v2`, `002_final`) | Layer tag `[cont:3,4]` produces **`002‑01`, `002‑02` automatically** |
| Change export size manually for different projects | Preset manager (1080p / 4K / Square) — **one click to switch** |
| Each export takes 30–60 minutes | **Done in seconds** — process many more shots per day |

> ⏱️ **Real‑world test: A 10‑layer, 5‑region storyboard takes ~45 minutes manually. This script finishes in 8 seconds.**

---

## 📦 Key Features

- 🎯 **Smart cropping**: Vertical / horizontal priority modes, auto‑adapted to target aspect ratio (e.g., 1920×1080).
- 🧩 **Multi‑layer batch processing**: Process only visible layers or all layers at once, with independent numbering per layer.
- 🔢 **Continuous shot naming**: Innovative layer tagging (`[cont:region]`) shares the main number across continuous panels and appends sub‑numbers.
- ⚙️ **Custom resolution & presets**: Built‑in presets (1080p, 4K, Square) that you can modify and save.
- ⏱️ **Timer & log**: Automatic export log for tracking and verification.

---

## 💻 System Requirements

- **Adobe Photoshop CS6** or later (ExtendScript compatible)
- Windows or macOS

---

## 📥 Installation

1. Download the latest `StoryboardExport_v1.0_CN.jsx` (Chinese UI) or `StoryboardExport_v1.0_EN.jsx` (English UI) from the [Releases page](https://github.com/enktici-lgtm/Photoshop-Storyboard-Exporter/releases).
2. Copy the script file into Photoshop's Scripts folder:
   - **Windows**: `C:\Program Files\Adobe\Adobe Photoshop [version]\Presets\Scripts`
   - **macOS**: `/Applications/Adobe Photoshop [version]/Presets/Scripts`
3. Restart Photoshop. You’ll find the script under `File → Scripts`.

---

## 🚀 Quick Start

### 1. Prepare your storyboard file
Make sure your PSD has:
- **At least two horizontal guides** to define each region.
- **(Optional) two vertical guides** to fix left/right boundaries (vertical priority) or to serve as centering range (horizontal priority).

### 2. Run the script and configure
- **Preset**: Quickly switch output resolution.
- **Output Folder**: Where to save the exported JPGs.
- **Start Number**: Supports numeric only (`000`) or with prefix (`SH001`).
- **Crop Base**:
  - *Vertical Priority*: Left/right fixed by vertical guides, vertically centered.
  - *Horizontal Priority*: Top/bottom fixed by horizontal guides, horizontally centered within vertical guides (or canvas).
- **Layer Range**: Only visible layers or all layers.
- **Sub‑shot count**: Define how many frames each region exports (useful for multiple takes of the same shot).

### 3. Mark continuous shots (optional)
Add `[cont:region number]` at the end of a layer name, e.g., `Scene1 [cont:3,4]`.  
This tells the script that Region 3 and Region 4 are continuous takes of the same shot. They will share the main number and receive sequential sub‑numbers like `002‑01`, `002‑02`.

Click the **💡 How to mark continuous shots?** button inside the dialog for an in‑app explanation.

### 4. Export
Click **Export** and within seconds you’ll have neatly numbered JPG files in your output folder, along with an `export_log.txt` for your records.

---

## 🤝 Feedback & Contribution

This project is fully open source. You’re welcome to:
- **Submit an Issue** for bug reports or feature requests.
- **Create a Pull Request** to improve code or documentation.
- **Share it** with fellow creators to help them save hours of manual work.

GitHub Repository: [https://github.com/enktici-lgtm/Photoshop-Storyboard-Exporter](https://github.com/enktici-lgtm/Photoshop-Storyboard-Exporter)

---

## 📄 License

Released under the [MIT License](LICENSE). You are free to use, modify, and distribute this script.
