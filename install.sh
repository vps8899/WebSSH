#!/bin/bash
set -e

echo "======================================"
echo " WebSSH 一键部署脚本"
echo "======================================"

if [ "$EUID" -ne 0 ]; then
  echo "错误: 请使用 root 用户运行此脚本！"
  exit 1
fi

echo ">> 安装必要工具..."
if [ -x "$(command -v apt-get)" ]; then
    apt-get update && apt-get install -y git curl
elif [ -x "$(command -v yum)" ]; then
    yum update -y && yum install -y git curl
fi

if ! command -v docker &> /dev/null; then
    echo ">> 正在安装 Docker..."
    curl -fsSL https://get.docker.com | bash
    systemctl enable docker
    systemctl start docker
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo ">> 正在安装 Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

INSTALL_DIR="/opt/WebSSH"
if [ -d "$INSTALL_DIR" ]; then
    echo ">> 更新代码..."
    cd $INSTALL_DIR
    git reset --hard
    git pull
else
    echo ">> 克隆代码..."
    git clone https://github.com/vps8899/WebSSH.git $INSTALL_DIR
    cd $INSTALL_DIR
fi

echo ""
read -p "请输入您的域名 (例如 ssh.vpsfq.com): " DOMAIN

echo ">> 正在配置 Caddy..."
cat <<EOF > docker-compose.override.yml
version: '3.8'

services:
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

echo ">> 重建并启动服务..."
if docker compose version &> /dev/null; then
    docker compose down
    docker compose up -d --build
else
    docker-compose down
    docker-compose up -d --build
fi

echo ""
echo "======================================"
echo " 🎉 WebSSH 启动完成！"
echo " 🌐 访问地址: https://$DOMAIN"
echo "======================================"
