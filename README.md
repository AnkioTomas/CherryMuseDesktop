# Cherry Muse Desktop

<div align="center">

<img src="src/icons/android-chrome-512x512.png" width="128" height="128" alt="Cherry Muse Desktop Logo">

**优雅的 Markdown 编辑器**

[![Release](https://img.shields.io/github/v/release/AnkioTomas/CherryMuseDesktop?style=flat-square)](https://github.com/AnkioTomas/CherryMuseDesktop/releases)
[![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Linux-lightgrey?style=flat-square)](#下载)

</div>

---

## ✨ 特性

- 🎨 **简洁界面** - 无工具栏干扰，专注写作
- 📝 **实时预览** - 分屏 / 纯编辑 / 纯预览，一键切换
- 🖼️ **智能图片** - 粘贴或拖拽图片自动保存到本地
- 📂 **文件关联** - 双击 `.md` 文件直接打开
- 🖥️ **跨平台** - 支持 macOS、Windows、Linux
- ⌨️ **快捷键** - 流畅的键盘操作体验

## 📥 下载

| 平台 | 下载 |
|:---:|:---:|
| macOS | [Cherry Muse.dmg](https://github.com/AnkioTomas/CherryMuseDesktop/releases/latest) |
| Windows | [Cherry Muse Setup.exe](https://github.com/AnkioTomas/CherryMuseDesktop/releases/latest) |
| Linux | [Cherry Muse.AppImage](https://github.com/AnkioTomas/CherryMuseDesktop/releases/latest) |

## ⌨️ 快捷键

| 功能 | macOS | Windows / Linux |
|:---|:---:|:---:|
| 打开文件 | `⌘ O` | `Ctrl O` |
| 保存 | `⌘ S` | `Ctrl S` |
| 另存为 | `⌘ ⇧ S` | `Ctrl Shift S` |
| 切换视图模式 | `⌘ /` | `Ctrl /` |
| 撤销 | `⌘ Z` | `Ctrl Z` |
| 重做 | `⌘ ⇧ Z` | `Ctrl Shift Z` |

## 🖼️ 图片处理

粘贴或拖拽图片到编辑器时，会自动：

1. 在文档同级目录创建 `assets` 文件夹
2. 保存图片并生成唯一文件名
3. 插入相对路径的 Markdown 图片语法

```
your-document.md
assets/
  ├── image_1701234567890_a1b2c3d4.png
  └── image_1701234567891_e5f6g7h8.jpg
```

> ⚠️ 首次粘贴图片前，请先保存文档以确定存储位置。

## 🛠️ 开发

```bash
# 安装依赖
yarn install

# 启动开发模式
yarn start

# 构建当前平台
yarn build

# 构建所有平台
yarn build:all
```

## 🏗️ 技术栈

- [Electron](https://www.electronjs.org/) - 跨平台桌面应用框架
- [Cherry Markdown](https://github.com/Tencent/cherry-markdown) - 腾讯开源 Markdown 编辑器

## 📄 许可证

[MIT License](LICENSE) © 2025 Ankio

