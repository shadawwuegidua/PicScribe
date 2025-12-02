# AI 智能相册

<div align="center">

![AI智能相册](https://img.shields.io/badge/AI-智能相册-brightgreen)
![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![Express](https://img.shields.io/badge/Express-5.1.0-blue)
![License](https://img.shields.io/badge/License-MIT-yellow)

一个基于 AI 技术的智能相册系统，支持自动标签识别、图片描述生成和智能分类管理。

[功能特性](#功能特性) • [技术栈](#技术栈) • [快速开始](#快速开始) • [项目结构](#项目结构) • [API 说明](#api-说明)

</div>

---

## 📸 功能特性

### 核心功能
- 🖼️ **图片上传**：支持拖拽上传和批量上传多张图片
- 🤖 **AI 智能标签**：集成百度 AI 自动识别图片内容并生成标签
- 📝 **智能描述生成**：使用 ECNU 大模型生成图片的详细描述
- 📷 **EXIF 信息提取**：自动读取照片的相机参数（光圈、快门、ISO 等）
- 🔍 **智能筛选**：根据 AI 标签和 EXIF 信息快速筛选图片
- 🎨 **黑夜/白昼模式**：支持主题切换，提供舒适的浏览体验
- ⭐ **星空背景**：黑夜模式下的流星动画效果

### 交互特性
- 📤 实时上传进度显示
- 🖱️ 点击图片查看详细信息
- 🏷️ 多标签筛选功能
- 🗑️ 批量清除图片功能
- 📱 响应式设计，支持移动端

---

## 🛠️ 技术栈

### 后端
- **Node.js** - 服务器运行环境
- **Express.js** - Web 应用框架
- **Multer** - 文件上传中间件
- **Axios** - HTTP 客户端
- **exif-parser** - EXIF 信息提取

### 前端
- **原生 JavaScript** - 无框架依赖
- **HTML5 & CSS3** - 现代化 UI
- **Fetch API** - 异步数据请求

### AI 服务
- **百度 AI 开放平台** - 图像识别与标签生成
- **ECNU 大模型** - 图片描述生成

> **注意**：使用百度 AI 和 ECNU 大模型是个人选择，你可以根据需要替换为其他 AI 服务提供商（如 OpenAI、阿里云、腾讯云等）。更换服务商时需要相应修改 `aiService.js` 文件中的 API 调用逻辑和 `.env` 配置文件。

---

## 🚀 快速开始

### 环境要求

- Node.js >= 18.0
- npm >= 9.0

### 安装步骤

1. **克隆项目**
```bash
git clone <your-repository-url>
cd PicScribe
```

2. **安装依赖**
```bash
cd server
npm install
```

3. **配置环境变量**

复制 `.env.example` 文件并重命名为 `.env`：
```bash
cp .env.example .env
```

编辑 `.env` 文件，填入你的 API 密钥：
```env
# 百度 AI 开放平台配置
BAIDU_API_KEY=你的百度API_KEY
BAIDU_SECRET_KEY=你的百度SECRET_KEY

# ECNU 大模型 API 配置
ECNU_API_KEY=你的ECNU_API_KEY
ECNU_API_URL=https://chat.ecnu.edu.cn/open/api/v1/chat/completions

# 服务器端口（可选）
PORT=3000
```

#### 如何获取 API 密钥？

**百度 AI 密钥：**
1. 访问 [百度 AI 开放平台](https://console.bce.baidu.com/ai/)
2. 登录/注册账号
3. 创建应用并获取 `API Key` 和 `Secret Key`

**ECNU 大模型密钥：**
1. 联系 ECNU 获取 API Key
2. 或访问 ECNU 官方文档获取申请方式

4. **启动服务器**
```bash
npm start
```

服务器将在 `http://localhost:3000` 启动。

5. **访问应用**

在浏览器中打开：
```
http://localhost:3000
```

---

## 📁 项目结构

```
PicScribe/
├── server/                    # 服务器端代码
│   ├── server.js             # Express 服务器主文件
│   ├── aiService.js          # AI 服务模块（百度 AI）
│   ├── package.json          # 项目依赖配置
│   ├── .env                  # 环境变量配置（需自行创建）
│   ├── .env.example          # 环境变量模板
│   ├── public/               # 静态资源文件
│   │   ├── index.html        # 上传页面
│   │   ├── index.js          # 上传页面逻辑
│   │   ├── loading.html      # 加载动画页面
│   │   ├── gallery.html      # 相册展示页面
│   │   ├── gallery.css       # 相册样式
│   │   └── gallery.js        # 相册页面逻辑
│   └── uploads/              # 图片存储目录（自动生成）
│       └── metadata.json     # 图片元数据存储
├── .gitignore                # Git 忽略配置
└── README.md                 # 项目说明文档
```

---

## 🔌 API 说明

### 1. 上传图片
- **路径**: `POST /upload`
- **参数**: `FormData` - `images[]` (文件数组)
- **返回**: 
```json
{
  "success": true,
  "data": [
    {
      "filename": "1234567890.jpg",
      "path": "/uploads/1234567890.jpg",
      "uploadDate": "2025-12-02T10:30:00.000Z",
      "aiTags": ["风景", "天空", "云"],
      "aiDescription": "这可能是天空（置信度：95%）",
      "ecnuDescription": "",
      "exifTags": [
        { "name": "设备型号", "value": "Canon EOS R5" },
        { "name": "光圈", "value": "f/2.8" }
      ]
    }
  ]
}
```

### 2. 获取图片列表
- **路径**: `GET /get-images`
- **返回**: 图片元数据数组

### 3. 生成图片描述（ECNU AI）
- **路径**: `POST /generate-description`
- **参数**: `{ "filename": "1234567890.jpg" }`
- **返回**:
```json
{
  "success": true,
  "description": "这是一张美丽的风景照片..."
}
```

### 4. 清除所有图片
- **路径**: `DELETE /clear-images`
- **返回**: `{ "success": true }`

---

## 🎨 使用说明

### 上传图片
1. 访问首页 `http://localhost:3000`
2. 点击"选择图片"或直接拖拽图片到上传区域
3. 选择一张或多张图片（支持 JPG、PNG、GIF 格式）
4. 点击"开始上传"
5. 等待 AI 分析完成后自动跳转到相册页面

### 浏览相册
1. 在相册页面可以看到所有上传的图片
2. 点击左侧的 AI 标签或 EXIF 信息标签进行筛选
3. 点击图片查看详细信息和完整的 AI 描述
4. 点击左上角切换黑夜/白昼主题

### 管理图片
- **刷新相册**：点击右上角的刷新按钮
- **清除标签**：点击"清除所有标签"取消筛选
- **删除图片**：点击底部"清除所有图片"按钮（谨慎操作）

---

## ⚙️ 开发说明

### 开发模式运行
```bash
cd server
npm start
```

### 修改端口
在 `server/.env` 文件中修改 `PORT` 变量：
```env
PORT=8080
```

### 自定义 AI 服务

本项目默认使用百度 AI 和 ECNU 大模型，但你可以根据需要替换为其他 AI 服务：

**更换图像识别服务**（替换百度 AI）：
1. 修改 `server/aiService.js` 中的 `analyzeImage()` 方法
2. 更新 `.env` 文件中的 API 密钥配置
3. 调整 API 请求格式和响应处理逻辑

**更换描述生成服务**（替换 ECNU 大模型）：
1. 修改 `server/server.js` 中的 `/generate-description` 路由
2. 更新相应的 API 调用和配置
3. 确保返回格式与前端预期一致

支持的替代服务包括但不限于：
- OpenAI GPT Vision API
- 阿里云视觉智能
- 腾讯云AI
- Google Cloud Vision
- Azure Cognitive Services

---

## 🐛 常见问题

### 1. 上传失败
- 检查图片格式是否为 JPG、PNG 或 GIF
- 确认图片大小不超过限制
- 查看浏览器控制台的错误信息

### 2. AI 分析失败
- 确认 `.env` 文件中的 API Key 配置正确
- 检查网络连接是否正常
- 查看服务器终端的错误日志

### 3. 图片无法显示
- 确认 `uploads` 文件夹存在且有读写权限
- 检查 `metadata.json` 文件是否损坏
- 尝试刷新页面

### 4. 端口被占用
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <进程ID> /F

# Linux/Mac
lsof -i :3000
kill -9 <进程ID>
```

---

## 📝 待优化功能

- [ ] 添加用户认证系统
- [ ] 支持图片编辑功能
- [ ] 图片压缩和缩略图生成
- [ ] 数据库存储替代 JSON 文件
- [ ] 支持视频上传
- [ ] 添加图片搜索功能
- [ ] 支持相册分享

---

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本项目
2. 创建你的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的改动 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启一个 Pull Request

---

## 📄 开源协议

本项目采用 MIT 协议 - 详见 [LICENSE](LICENSE) 文件

---

## 👨‍💻 作者

- 项目作者：[你的名字]
- 联系方式：[你的邮箱]
- GitHub：[你的 GitHub]

---

## 🙏 致谢

- [百度 AI 开放平台](https://ai.baidu.com/) - 提供图像识别服务
- [ECNU](https://www.ecnu.edu.cn/) - 提供大模型 API
- [Express.js](https://expressjs.com/) - 优秀的 Web 框架
- 所有开源贡献者

---

<div align="center">

**⭐ 如果这个项目对你有帮助，请给个 Star 吧！⭐**

Made with ❤️ by [你的名字]

</div>
