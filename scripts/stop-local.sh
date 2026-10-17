#!/usr/bin/env bash

echo "🛑 Đang dừng các tiến trình backend và frontend..."

# Kill backend on 8080
if lsof -Pi :8080 -sTCP:LISTEN -t >/dev/null ; then
    kill -9 $(lsof -Pi :8080 -sTCP:LISTEN -t) 2>/dev/null || true
    echo "✅ Đã dừng backend (port 8080)."
fi

# Kill frontend on 5173
if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null ; then
    kill -9 $(lsof -Pi :5173 -sTCP:LISTEN -t) 2>/dev/null || true
    echo "✅ Đã dừng frontend (port 5173)."
fi

# Optionally stop docker
if command -v docker &> /dev/null && docker info &> /dev/null; then
    docker compose stop db mailhog 2>/dev/null || true
    echo "✅ Đã tạm dừng docker containers (db, mailhog)."
fi

echo "👋 Toàn bộ hệ thống local đã được dừng."
