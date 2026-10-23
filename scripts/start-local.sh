#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$DIR"

echo "=========================================================="
echo "   🚀 KHỞI ĐỘNG HỆ THỐNG EPMS LOCAL ĐỂ DEMO MƯỢT MÀ      "
echo "=========================================================="

# 1. Start Docker services (Postgres & MailHog)
if command -v docker &> /dev/null && docker info &> /dev/null; then
    echo "📦 Đang khởi động Docker services (db, mailhog)..."
    docker compose up -d db mailhog
else
    echo "⚠️ Docker không chạy hoặc chưa bật. Bỏ qua docker compose."
fi

# 2. Build backend jar if not exists
if [ ! -f "backend/target/backend-0.0.1-SNAPSHOT.jar" ]; then
    echo "🔨 Đang đóng gói backend..."
    (cd backend && mvn clean package -DskipTests)
fi

# 3. Check and start backend on port 8080
if lsof -Pi :8080 -sTCP:LISTEN -t >/dev/null ; then
    echo "✅ Backend đã đang chạy tại port 8080."
else
    echo "☕ Đang khởi động Backend Spring Boot..."
    nohup java -Duse.local.db=true -jar backend/target/backend-0.0.1-SNAPSHOT.jar \
        --spring.profiles.active=dev \
        > backend.log 2>&1 &
    
    echo -n "   Đang đợi backend sẵn sàng"
    for i in {1..30}; do
        if curl -s http://localhost:8080/actuator/health | grep -q "UP"; then
            echo " -> Sẵn sàng!"
            break
        fi
        echo -n "."
        sleep 1
    done
fi

# 4. Check and start frontend on port 5173
if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null ; then
    echo "✅ Frontend đã đang chạy tại http://localhost:5173."
else
    echo "⚡ Đang khởi động Frontend Vite..."
    (cd frontend && nohup npm run dev > ../frontend.log 2>&1 &)
    sleep 2
    echo "✅ Frontend đã khởi động tại http://localhost:5173."
fi

echo ""
echo "=========================================================="
echo "🎉 HỆ THỐNG ĐÃ SẴN SÀNG ĐỂ BẠN DEMO:"
echo "👉 Frontend (Giao diện chính): http://localhost:5173"
echo "👉 Backend API:                http://localhost:8080"
echo "👉 MailHog (Hộp thư test email): http://localhost:8025"
echo ""
echo "🔑 TÀI KHOẢN DEMO SẴN CÓ:"
echo "   - Project Manager: pm@epms.com        / Password123@"
echo "   - Developer:       dev@epms.com       / Password123@"
echo "   - QA Tester:       qa@epms.com        / Password123@"
echo "   - Hoặc bạn có thể Đăng ký mới tài khoản bất kỳ trực tiếp trên giao diện"
echo "=========================================================="
