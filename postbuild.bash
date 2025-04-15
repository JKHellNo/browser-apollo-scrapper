#!/bin/bash

echo "📦 Moving Puppeteer Chromium to persistent cache..."

# Ensure cache dir exists
mkdir -p ./.cache/puppeteer

# Default Puppeteer cache (location varies, this works in most cases)
if [ -d ~/.cache/puppeteer ]; then
  mv ~/.cache/puppeteer ./.cache/puppeteer
  echo "✅ Chromium moved to ./.cache/puppeteer"
else
  echo "⚠️  Puppeteer Chromium not found in ~/.cache"
fi
