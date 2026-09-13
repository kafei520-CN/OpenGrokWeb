# OpenGrok 官网

OpenGrok 桌面工作台的产品站。视觉对齐软件默认浅色工作台：白底、`#1c1c1c` 正文、圆角卡片、SuperGrok 标志。支持中 / EN 与浅色 / 深色。

Not an official xAI product.

## 本地预览

```powershell
cd C:\Users\mckafei\Desktop\OpenGrokWeb
python -m http.server 4173
```

打开 http://127.0.0.1:4173

## 结构

```
index.html      落地页
css/site.css    与软件同一套 token
js/i18n.js      中英文本
js/site.js      语言、主题、复制、卡片填入输入框
assets/         logo、SuperGrok 标志、favicon
```

## 发布

静态站点，可直接放到 GitHub Pages 或任意静态托管。

下载按钮会请求 GitHub API `kafei520-CN/OpenGrok` 的 latest release，把 Windows / macOS / Linux 卡片和顶栏「下载 OpenGrok」指到对应安装包。失败时回退到 [Releases](https://github.com/kafei520-CN/OpenGrok/releases/latest)。
