#!/bin/bash
cd "$(dirname "$0")"
echo "Installing dependencies..."
npm install
echo ""
echo "Starting Aim Lab..."
npm run dev
