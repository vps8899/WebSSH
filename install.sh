#!/bin/bash
set -e

echo "======================================"
echo " WebSSH 原生化极速部署脚本 (PM2 + Caddy)"
echo "======================================"

if [ "$EUID" -ne 0 ]; then
  echo "错误: 请使用 root 用户运行此脚本！"
  exit 1
fi

echo ">> 安装系统基础工具..."
if [ -x "$(command -v apt-get)" ]; then
    apt-get update && apt-get install -y git curl debian-keyring debian-archive-keyring apt-transport-https
elif [ -x "$(command -v yum)" ]; then
    yum update -y && yum install -y git curl
fi

echo ">> 安装 Node.js (v20 LTS)..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
else
    echo "Node.js 已安装: $(node -v)"
fi

echo ">> 安装 PM2 进程守护工具..."
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
fi

echo ">> 安装原生 Caddy 反向代理..."
if ! command -v caddy &> /dev/null; then
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
    apt-get update
    apt-get install -y caddy
fi

# 清理历史的 Docker 容器释放 3000 端口
INSTALL_DIR="/opt/WebSSH"
if [ -d "$INSTALL_DIR" ]; then
    echo ">> 正在检查并清理历史 Docker 容器..."
    cd $INSTALL_DIR
    if command -v docker &> /dev/null; then
        if docker compose version &> /dev/null; then
            docker compose down 2>/dev/null || true
        else
            docker-compose down 2>/dev/null || true
        fi
    fi
    echo ">> 更新代码..."
    git reset --hard
    git pull
else
    echo ">> 克隆代码..."
    git clone https://github.com/vps8899/WebSSH.git $INSTALL_DIR
    cd $INSTALL_DIR
fi

echo ""
read -p "请输入您的域名 (例如 ssh.vpsfq.com): " DOMAIN

echo ">> 编译前端项目..."
cd $INSTALL_DIR/frontend
npm install
npm run build

echo ">> 安装后端依赖..."
cd $INSTALL_DIR/backend
npm install

echo ">> 启动后端守护进程..."
# 如果 pm2 里已经有 webssh，就重启它，否则新启
pm2 start server.js --name "webssh" 2>/dev/null || pm2 restart webssh
pm2 save
pm2 startup | grep -v '\[PM2\]' | bash || true

echo ">> 配置并重启 Caddy..."
cat <<EOF > /etc/caddy/Caddyfile
$DOMAIN {
    reverse_proxy 127.0.0.1:3000
}
EOF

systemctl enable caddy
systemctl restart caddy

echo ""
echo "======================================"
echo " 🎉 WebSSH (原生高性能版) 启动完成！"
echo " 🌐 访问地址: https://$DOMAIN"
echo " ⚙️ 查看运行状态: pm2 status webssh"
echo " 📝 查看运行日志: pm2 logs webssh"
echo "======================================"
