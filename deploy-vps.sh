#!/bin/bash

# Deployment script for Cap
# This script should be run on the Linux VPS

if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "Please create a .env file by copying .env.example and filling in the values."
    exit 1
fi

echo "🚀 Starting Cap services..."
docker compose pull
docker compose up -d

echo "✅ Cap is starting up!"
echo "You can check the logs with: docker compose logs -f cap-web"
echo "Access Cap at: $(grep CAP_URL .env | cut -d '=' -f2)"
