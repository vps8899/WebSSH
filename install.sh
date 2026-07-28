#!/bin/bash
set -e

echo "======================================"
echo " WebSSH 一键部署脚本 (CDN 兼容版)"
echo "======================================"

# 检查 root 权限
if [ "$EUID" -ne 0 ]; then
  echo "错误: 请使用 root 用户运行此脚本！(可以使用 sudo bash install.sh)"
  exit 1
fi

# 安装基础软件
echo ">> 更新系统并安装必要工具 (git, curl)..."
if [ -x "$(command -v apt-get)" ]; then
    apt-get update && apt-get install -y git curl
elif [ -x "$(command -v yum)" ]; then
    yum update -y && yum install -y git curl
fi

# 安装 Docker
if ! command -v docker &> /dev/null; then
    echo ">> 正在安装 Docker..."
    curl -fsSL https://get.docker.com | bash
    systemctl enable docker
    systemctl start docker
else
    echo ">> Docker 已安装。"
fi

# 安装 Docker Compose
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo ">> 正在安装 Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

# 克隆仓库
INSTALL_DIR="/opt/WebSSH"
if [ -d "$INSTALL_DIR" ]; then
    echo ">> 目录 $INSTALL_DIR 已存在，正在更新..."
    cd $INSTALL_DIR
    git pull
else
    echo ">> 正在克隆 WebSSH 仓库..."
    git clone https://github.com/vps8899/WebSSH.git $INSTALL_DIR
    cd $INSTALL_DIR
fi

# 获取域名
echo ""
read -p "请输入您已经加了 CDN 的域名 (例如 webssh.yourdomain.com): " DOMAIN

# 配置 Nginx 反向代理 (专为 CDN 设计)
echo ">> 正在配置 Nginx 反向代理..."
cat <<EOF > docker-compose.override.yml
version: '3.8'

services:
  webssh:
    ports: [] # 移除默认端口映射，避免直接暴露
    expose:
      - "3000"

  nginx:
    image: nginx:alpine
    container_name: webssh-nginx
    restart: always
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf
    depends_on:
      - webssh
EOF

cat <<EOF > nginx.conf
server {
    listen 80;
    server_name $DOMAIN;

    location / {
        proxy_pass http://webssh:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

echo ">> 正在拉取镜像并启动服务 (这可能需要几分钟)..."
if docker compose version &> /dev/null; then
    docker compose up -d --build
else
    docker-compose up -d --build
fi

echo ""
echo "======================================"
echo " 🎉 WebSSH 安装并启动完成！"
echo " "
echo " 🌐 访问地址: http://$DOMAIN"
echo " (如果您的 CDN 开启了 HTTPS，可以直接通过 https://$DOMAIN 访问)"
echo " "
echo " ⚠️ 注意事项："
echo " 如果您使用的是 Cloudflare 等 CDN，请确保其 SSL/TLS 加密模式设置为【灵活 (Flexible)】。"
echo " 这样 CDN 与您服务器之间会通过 80 端口通信，并且完美支持 WebSocket。"
echo "======================================"
