#!/bin/bash

# RoadScan - Development Helper Script
# Run this script from the project root directory

set -e

echo "🚗 RoadScan Development Helper"
echo "================================"
echo ""

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command_exists node; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ from https://nodejs.org"
    exit 1
fi

if ! command_exists npm; then
    echo "❌ npm is not installed. Please install npm"
    exit 1
fi

echo "✅ Node.js $(node --version) found"
echo "✅ npm $(npm --version) found"
echo ""

# Check if mobile dependencies are installed
if [ ! -d "mobile/node_modules" ]; then
    echo "📦 Installing mobile dependencies..."
    npm install --prefix mobile
    echo "✅ Dependencies installed"
else
    echo "✅ Dependencies already installed"
fi
echo ""

# Check for .env file
if [ ! -f "mobile/.env" ]; then
    echo "⚠️  No .env file found"
    echo "📝 Creating .env from template..."
    cp mobile/.env.example mobile/.env
    echo "✅ Created mobile/.env"
    echo ""
    echo "🔧 IMPORTANT: Edit mobile/.env and add your Supabase credentials:"
    echo "   - EXPO_PUBLIC_SUPABASE_URL"
    echo "   - EXPO_PUBLIC_SUPABASE_ANON_KEY"
    echo ""
else
    echo "✅ .env file exists"
fi
echo ""

# Menu
echo "What would you like to do?"
echo ""
echo "1) Start mobile app development server"
echo "2) Start with cache cleared (use after config changes)"
echo "3) Run on iOS simulator (Mac only)"
echo "4) Run on Android emulator"
echo "5) Install dependencies"
echo "6) Clean and reinstall everything"
echo "7) Check project status"
echo "8) Exit"
echo ""
read -p "Enter your choice (1-8): " choice

case $choice in
    1)
        echo "🚀 Starting Expo development server..."
        npm start --prefix mobile
        ;;
    2)
        echo "🧹 Starting with cleared cache..."
        npm start --prefix mobile -- --clear
        ;;
    3)
        echo "📱 Starting on iOS simulator..."
        npm run ios --prefix mobile
        ;;
    4)
        echo "🤖 Starting on Android emulator..."
        npm run android --prefix mobile
        ;;
    5)
        echo "📦 Installing dependencies..."
        npm install --prefix mobile
        echo "✅ Done!"
        ;;
    6)
        echo "🧹 Cleaning node_modules..."
        rm -rf mobile/node_modules
        echo "📦 Reinstalling dependencies..."
        npm install --prefix mobile
        echo "✅ Done!"
        ;;
    7)
        echo "📊 Project Status:"
        echo ""
        echo "Mobile App:"
        if [ -d "mobile/node_modules" ]; then
            echo "  ✅ Dependencies installed"
        else
            echo "  ❌ Dependencies not installed"
        fi
        
        if [ -f "mobile/.env" ]; then
            echo "  ✅ .env file exists"
        else
            echo "  ❌ .env file missing"
        fi
        
        echo ""
        echo "Backend:"
        if [ -d "backend" ]; then
            echo "  📁 Backend directory exists"
        else
            echo "  ⚠️  Backend not yet created"
        fi
        
        echo ""
        echo "Admin Dashboard:"
        if [ -d "admin-dashboard" ]; then
            echo "  📁 Admin directory exists"
        else
            echo "  ⚠️  Admin dashboard not yet created"
        fi
        ;;
    8)
        echo "👋 Goodbye!"
        exit 0
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac
