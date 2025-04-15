#!/bin/bash

# Install dependencies (but skip Puppeteer’s Chromium download)
PUPPETEER_SKIP_DOWNLOAD=true npm install

# Install Chromium separately
node -e "require('puppeteer').createBrowserFetcher().download('118.0.5993.70')"

# Run postbuild to move chromium to ./cache
bash postbuild.sh
