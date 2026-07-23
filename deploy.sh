#!/bin/bash

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

export PATH=$PATH:/root/.nvm/versions/node/v24.14.1/bin

echo "🚀 Starting deployment..."

cd /var/www/nextjs_ecom

echo "📦 Pulling latest code..."
git pull origin main

echo "📥 Installing dependencies..."
pnpm install

echo "🔨 Building app..."
pnpm run build

echo "🔄 Restarting PM2..."
pm2 restart 0

echo "✅ Deployment done!" 