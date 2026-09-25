#!/usr/bin/env bash
# Прописывает боевой домен во всех местах сразу.
# Запуск:  bash tools/set-domain.sh konga.cz
#
# Меняет: canonical, og:url, og:image, twitter:image, JSON-LD (@id, url, logo),
#         robots.txt, sitemap.xml, ссылку на главную в 404.html.
set -euo pipefail
cd "$(dirname "$0")/.."

[ $# -eq 1 ] || { echo "укажи домен: bash tools/set-domain.sh konga.cz"; exit 1; }

DOMAIN="${1#http://}"; DOMAIN="${DOMAIN#https://}"; DOMAIN="${DOMAIN%/}"
NEW="https://${DOMAIN}/"

# текущий базовый адрес берём из canonical
OLD=$(grep -o '<link rel="canonical" href="[^"]*"' index.html | sed 's/.*href="//;s/"$//')
[ -n "$OLD" ] || { echo "не нашёл canonical в index.html"; exit 1; }

echo "было: $OLD"
echo "стало: $NEW"

# старый адрес сайта -> новый
sed -i "s#${OLD}#${NEW}#g" index.html robots.txt sitemap.xml
# домен из макета в JSON-LD и прочих абсолютных ссылках
sed -i "s#https://konga\.cz/#${NEW}#g" index.html
sed -i "s#\"https://konga\.cz\"#\"https://${DOMAIN}\"#g" index.html
# 404 ведёт в корень домена, а не в /konga_shop/
sed -i 's#href="/konga_shop/"#href="/"#' 404.html

echo
echo "проверь и закоммить:"
grep -o 'rel="canonical" href="[^"]*"' index.html
grep -o 'property="og:url" content="[^"]*"' index.html
grep -o 'property="og:image" content="[^"]*"' index.html
grep -o 'Sitemap: .*' robots.txt
echo
echo "не забудь: почту info@ / b2b@ в index.html меняй отдельно, если домен другой"
