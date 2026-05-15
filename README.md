# Storyboard Export for Photoshop

**分镜导出 v1.0.1** – 一款轻量、高效的 Photoshop 分镜导出脚本，帮助动画、影视和故事板艺术家快速将分层分镜文档导出为规范命名的图片序列。

![Version](https://img.shields.io/badge/version-1.0.1-blue)
![Photoshop](https://img.shields.io/badge/Photoshop-CC%2B-blue)
![License](https://img.shields.io/badge/license-MIT-green)

---

## 📖 简介 | Introduction

Storyboard Export 是一个为 Adobe Photoshop 编写的脚本，能够根据**参考线**定义的区域（例如分镜框）和**图层可见性**，自动裁剪、缩放并导出每个分镜画面，同时支持**连续镜头（同一编号下生成子编号）**、多格式输出及批量重命名等高级功能。

> It’s a Photoshop script that automatically exports each storyboard panel defined by **guides** and layer visibility, with support for **continuity (sub‑numbers under the same main number)** , multiple formats, batch rename, and more.

---

## ✨ 主要特性 | Features

- ✅ **智能编号系统**  
  基于连续镜头关系动态生成主编号与子编号（如 `001`, `002-01`, `002-02`），符合实际拍摄逻辑。  
  *Intelligent numbering based on continuity – main number and sub‑numbers.*

- ✅ **多格式导出**  
  支持 JPG（高质量）、PNG（带压缩）、WebP（自动降级为 PNG）。  
  *Export to JPG, PNG, or WebP (falls back to PNG if WebP unsupported).*

- ✅ **图形化连续镜头设置**  
  无需手动输入 `[cont:...]` 标签，通过表格界面为每个图层的不同区域勾选连续镜头，实时保存。  
  *Visual table to mark continuous regions per layer – no more manual tags.*

- ✅ **批量重命名图层**  
  一键重命名所有图层，自定义前缀、起始数字、位数及排序方向。  
  *Batch rename layers with prefix, start number, digits, and order.*

- ✅ **导出进度窗口**  
  实时显示进度、当前文件名，支持中途取消。  
  *Progress window with cancel option.*

- ✅ **跳过已存在文件**  
  避免重复覆盖，节省时间。  
  *Skip existing files to avoid overwriting.*

- ✅ **支持图层组**  
  递归处理所有可见图层（包括组内图层）。  
  *Recursively processes layers inside groups.*

- ✅ **裁剪模式**  
  垂直优先（左右固定，上下居中）或水平优先（上下固定，左右居中）。  
  *Two crop modes: vertical‑priority or horizontal‑priority.*

- ✅ **配置持久化**  
  自动保存所有设置（输出文件夹、预设、连续镜头标记等）。  
  *Preferences are automatically saved and restored.*

---

## 📥 安装与使用 | Installation & Usage

### 安装方法

1. 下载 `StoryboardExport_v1.0.1_CN.jsx` 文件。
2. 在 Photoshop 中，通过菜单 **文件 > 脚本 > 浏览** 找到并运行该文件。
3. （可选）将脚本复制到 Photoshop 的 `Presets/Scripts` 文件夹中，之后即可在 **文件 > 脚本** 菜单下直接调用。

### 快速开始

1. **准备文档**  
   - 使用**水平参考线**定义每个分镜区域的上下边界（至少两条线）。  
   - （可选）使用**垂直参考线**约束左右边界。  
   - 将每个分镜画面放在独立的**图层**中（可以为图层组内的图层）。

2. **运行脚本**  
   - 打开你的分镜 PSD 文档，执行脚本。  
   - 在弹出的设置窗口中：  
     - 选择输出文件夹、起始编号。  
     - 调整导出尺寸（支持预设或自定义）。  
     - 选择导出格式（JPG / PNG / WebP）。  
     - 如有需要，点击 **🔗 连续镜头** 为不同区域标记连续性。  
     - 点击 **📋 预览文件名** 检查编号是否正确。  
   - 点击 **开始导出**。

3. **等待完成**  
   进度窗口会显示每一步的状态，完成后弹出摘要提示。

---

## 🖥️ 界面预览 | UI Preview

| 功能设置 | 连续镜头 | 批量重命名 |
|:---:|:---:|:---:|
| ![功能设置](https://github.com/user-attachments/assets/7a1fbc46-b307-469d-8f34-54f996eebab1) | ![连续镜头](https://github.com/user-attachments/assets/e5cb3214-a066-45d4-819e-67a2cdc49bbe) | ![批量重命名](https://github.com/user-attachments/assets/0c6c2059-913d-4796-a279-7bfdc870bac6) |




- **主对话框**：设置导出参数、预设、裁剪模式等。  
- **连续镜头设置**：分页表格，为每个图层的每个区域勾选“连续”。  
- **批量重命名**：快速规范图层名称。

---

## ⚙️ 配置与高级功能 | Advanced

### 编号逻辑说明

- 每个图层按区域顺序处理。  
- 如果某个区域被标记为“连续”，则它与上一区域（或同一图层内前一连续区域）共享同一个主编号，并自动生成子编号（`-01`, `-02`…）。  
- 非连续区域会使主编号递增，子编号重置。  
- 不同图层之间，如果上一个图层的最后一个区域是连续区域，而当前图层的第一个区域也是连续区域，则主编号继续累加而不额外递增（适合同一个动作跨图层的情况）。

### 预设管理

内置三种分辨率预设（1080p, 4K, Square），可以修改并保存。自定义尺寸会自动保存到当前预设中。

### 兼容性

- 支持 Photoshop CC 2015 及更高版本（建议 CC 2018+）。  
- WebP 格式需要 Photoshop 21.0 以上（不支持时自动降级为 PNG）。

---

## 📝 升级日志 | Changelog (v1.0.1)

相比 v1.0.0 的主要改进：

- **新增** 多格式导出（JPG/PNG/WebP）  
- **新增** 跳过已存在文件  
- **新增** 导出进度窗口及取消功能  
- **新增** 图形化连续镜头设置（表格 + 分页）  
- **新增** 批量重命名图层  
- **新增** 文件名预览  
- **优化** 性能：暂停屏幕更新、快照复制、批量设置图层可见性  
- **重构** 模块化代码，支持图层组  
- **修复** 编号系统、文件冲突处理等若干问题  

> 详细升级日志见 [CHANGELOG.md](CHANGELOG.md)。

---

## 🤝 贡献与反馈 | Contributing

欢迎提交 Issue 或 Pull Request。如果你有功能建议或遇到 Bug，请附上 Photoshop 版本和系统信息。

---

## 📄 许可证 | License

MIT License. See [LICENSE](LICENSE) file.

---

**Enjoy storyboarding!** 🎬
