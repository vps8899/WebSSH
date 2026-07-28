#!/bin/bash
set -e

echo "======================================"
echo " WebSSH 一键部署脚本 (HTTPS / 严格 SSL 兼容版)"
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
read -p "请输入您的域名 (例如 ssh.vpsfq.com): " DOMAIN

# 配置 Caddy 自动申请 HTTPS 证书
echo ">> 正在配置 Caddy (用于自动申请 HTTPS 证书)..."
cat <<EOF > docker-compose.override.yml
version: '3.8'

services:
  webssh:
    ports: [] 
    expose:
      - "3000"

  caddy:
    image: caddy:alpine
    container_name: webssh-caddy
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
      - caddy_config:/config
    depends_on:
      - webssh

volumes:
  caddy_data:
  caddy_config:
EOF

cat <<EOF > Caddyfile
$DOMAIN {
    reverse_proxy webssh:3000
}
EOF

echo ">> 正在拉取镜像并启动服务 (首次启动会自动申请 HTTPS 证书，需要几秒钟)..."
if docker compose version &> /dev/null; then
    docker compose up -d --build
else
    docker-compose up -d --build
fi

echo ""
echo "======================================"
echo " 🎉 WebSSH 启动完成！"
echo " "
echo " 🌐 访问地址: https://$DOMAIN"
echo " "
echo " 正在检查 Caddy 证书申请日志："
sleep 3
docker logs webssh-caddy --tail 10
echo "======================================"
