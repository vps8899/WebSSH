# WebSSH - Secure Browser-based SSH Client

WebSSH 是一个现代化的、基于网页的 SSH 终端客户端。旨在解决部分网络环境下直连 VPS 的 SSH (22端口) 受到阻断的问题。
通过将 SSH 数据封装在 WebSocket 流量中，结合 CDN 或 HTTPS 反向代理，可以有效实现稳定的远程服务器管理。

## ✨ 特性

- 🖥️ **现代 UI**: 采用玻璃态 (Glassmorphism) 和暗黑主题设计，媲美原生终端体验。
- 🔒 **隐私至上**: **不保存任何密码或私钥**。所有的连接凭证只存在于内存中，断开连接即刻销毁。
- ⚡ **高性能**: 采用 Xterm.js 和 Socket.io，毫秒级响应，支持终端自适应大小 (Resize)。
- 🔑 **多认证方式**: 支持密码登录与 RSA/Ed25519 等私钥登录。
- 👥 **高并发**: Node.js 异步非阻塞架构，支持多人同时访问和管理不同的服务器。
- 🐳 **一键部署**: 提供 Dockerfile 和 Docker Compose 支持，几分钟内即可上线。

## 🚀 一键部署 (Docker Compose)

最简单的部署方式是使用 Docker。请确保您的服务器已安装 Docker 和 Docker Compose。

1. 克隆本项目：
   ```bash
   git clone https://github.com/yourusername/WebSSH.git
   cd WebSSH
   ```

2. 启动服务：
   ```bash
   docker-compose up -d
   ```

3. 访问应用：
   打开浏览器访问 `http://您的服务器IP:3000`。

> **⚠️ 强烈建议 (Security Warning)**
> 在生产环境中，为了保护您输入密码时的安全，请**务必**通过 Nginx 或 Cloudflare 等为该服务配置 **HTTPS** 证书。由于密码是在网页表单中输入的，如果没有 HTTPS，密码在网络传输中可能会被拦截。

## 🛠️ 本地开发

如果您想进行二次开发：

1. 安装依赖：
   ```bash
   cd frontend
   npm install
   cd ../backend
   npm install
   ```

2. 编译前端：
   ```bash
   cd frontend
   npm run build
   ```

3. 启动后端服务：
   ```bash
   cd backend
   node server.js
   ```

服务将在 `http://localhost:3000` 运行。

## 📜 许可证

MIT License
