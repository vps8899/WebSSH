# WebSSH - Secure Browser-based SSH Client

WebSSH 是一个现代化的、基于网页的 SSH 终端客户端。旨在解决部分网络环境下直连 VPS 的 SSH (22端口) 受到阻断的问题。
通过将 SSH 数据封装在 WebSocket 流量中，结合 CDN 或 HTTPS 反向代理，可以有效实现稳定的远程服务器管理。

## ✨ 特性

- 🖥️ **现代 UI**: 采用玻璃态 (Glassmorphism) 和暗黑主题设计，媲美原生终端体验。
- 🔒 **隐私至上**: **不保存任何密码或私钥**。所有的连接凭证只存在于内存中，断开连接即刻销毁。
- ⚡ **高性能**: 采用 Xterm.js 和 Socket.io，毫秒级响应，支持终端自适应大小 (Resize)。
- 🔑 **多认证方式**: 支持密码登录与 RSA/Ed25519 等私钥登录。
- 👥 **高并发**: Node.js 异步非阻塞架构，支持多人同时访问和管理不同的服务器。
- 🚀 **极速原生部署**: 完全摒弃复杂的 Docker 网络，采用 PM2 守护进程 + Caddy 原生反代，一键脚本自动签发 HTTPS 证书。

## 🚀 一键部署 (推荐)

我们提供了一个极其稳定、支持自动配置 HTTPS 证书的原生一键部署脚本。脚本会自动安装 Node.js、PM2 和 Caddy，配置好一切底层环境，完美解决各类因容器带来的端口和网络冲突问题。

只需在任意支持 `curl` 和 `bash` 的 Linux 系统（推荐 Debian/Ubuntu 系列）上以 `root` 用户运行以下命令：

```bash
bash <(curl -s https://raw.githubusercontent.com/vps8899/WebSSH/main/install.sh)
```

**运行前准备：**
请提前将您的域名（例如 `ssh.yourdomain.com`）解析到这台 VPS 的 IP 地址。脚本运行过程中会提示您输入该域名，并自动利用 Caddy 配置好安全可靠的 HTTPS 访问环境。

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

服务将在 `http://localhost:3999` 运行。

## 📜 许可证

MIT License
