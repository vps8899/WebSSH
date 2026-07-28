#!/bin/bash
set -e

echo "======================================"
echo " WebSSH 一键部署脚本 (极致稳定兜底版)"
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

# 极致稳妥补丁 1：强制修复 Node.js 在 Docker 里的 IPv6 绑定问题
# 即使用户忘记 push 本地代码，这里也能强制打上补丁
sed -i "s/server.listen(PORT, () => {/server.listen(PORT, '0.0.0.0', () => {/g" backend/server.js

# 极致稳妥补丁 2：将 Dockerfile 的 node 版本降级到最稳定的 20 LTS，避免 22 版本的潜在原生模块崩溃
sed -i "s/node:22-alpine/node:20-alpine/g" Dockerfile
sed -i "s/node:18-alpine/node:20-alpine/g" Dockerfile

echo ""
read -p "请输入您的域名 (例如 ssh.vpsfq.com): " DOMAIN

# 极致稳妥补丁 3：放弃 Docker 内部 DNS，直接使用宿主机网络直连
echo ">> 正在配置 Caddy..."
cat <<EOF > docker-compose.override.yml
version: '3.8'

services:
  webssh:
    # 强制将 3000 端口映射到宿主机本地，防止 Docker 内部网络断联
    ports:
      - "127.0.0.1:3000:3000"

  caddy:
    image: caddy:alpine
    container_name: webssh-caddy
    restart: always
    # 使用 host 网络模式，Caddy 直接接管宿主机的 80 和 443 端口
    network_mode: "host"
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
    # 由于使用了 host 网络，Caddy 可以直接访问宿主机的 3000 端口，彻底解决 502 找不到容器的问题
    reverse_proxy 127.0.0.1:3000
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
echo " 🎉 WebSSH 极致稳妥版启动完成！"
echo " 🌐 访问地址: https://$DOMAIN"
echo "======================================"
