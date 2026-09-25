#!/usr/bin/env bash
# Собирает статику сайта в _site/. Используется и GitHub Actions,
# и Cloudflare Pages (Build command: bash tools/build-site.sh, Output: _site).
set -euo pipefail
cd "$(dirname "$0")/.."

rm -rf _site
mkdir -p _site
cp index.html 404.html robots.txt sitemap.xml .nojekyll _site/
cp -r assets _site/assets

echo "_site готов:"
find _site -type f | sed 's#^_site#  #'
