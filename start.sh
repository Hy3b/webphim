#!/bin/bash

# Hàm dọn dẹp: Tự động tắt Backend và Frontend khi bạn bấm Ctrl+C để thoát script
cleanup() {
    echo ""
    echo "🛑 Đang tắt các dịch vụ (Backend, Frontend)..."
    kill $(jobs -p) 2>/dev/null
    echo "✅ Đã tắt hoàn tất."
    exit
}
trap cleanup SIGINT SIGTERM

echo "================================================="
echo "🎬 HỆ THỐNG ĐẶT VÉ XEM PHIM - MYCINEMA"
echo "================================================="

# 1. Khởi động MySQL trong Docker
echo "[1/4] 🐳 Đang khởi động MySQL (Docker)..."
docker start sqlVePhim

# 2. Khởi động Backend Spring Boot
echo "[2/4] ☕ Đang khởi động Backend (Spring Boot) với Java 21..."
cd /home/kinta1102/Documents/webphim/Backe/api
export JAVA_HOME=/usr/lib/jvm/java-21-openjdk
mvn spring-boot:run &
BACKEND_PID=$!

# 3. Khởi động Frontend React/Vite
echo "[3/4] ⚛️  Đang khởi động Frontend (Vite)..."
cd /home/kinta1102/Documents/webphim/Fronte/vite-project
npm run dev &
FRONTEND_PID=$!

# Chờ một lúc cho Backend và Frontend chạy lên
sleep 5

echo "================================================="
echo "✅ Frontend đang chạy tại: http://localhost:5173"
echo "✅ Backend đang chạy tại:  http://localhost:8080"
echo "🔔 Hãy copy link Forwarding của Ngrok bên dưới và cập nhật vào SePay Webhooks!"
echo "💡 (Để thoát và tắt toàn bộ, hãy bấm Ctrl+C)"
echo "================================================="

# 4. Khởi động Ngrok (Chạy trên màn hình chính)
echo "[4/4] 🌐 Đang khởi động Ngrok..."
export PATH=$HOME/.local/bin:$PATH
ngrok http 8080

# Giữ script chạy
wait
