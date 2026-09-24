/* Перерисовать превью ссылки (assets/og-image.jpg, 1200×630).
   Запуск:  node tools/make-og-image.mjs
   Нужен playwright:  npm i -D playwright && npx playwright install chromium
   Макет правится в tools/og-image.html */
import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const HERE = path.dirname(new URL(import.meta.url).pathname);
const ROOT = path.join(HERE, '..');
const CACHE = path.join(ROOT, '.og-cache');
const OUT = path.join(ROOT, 'assets', 'og-image.jpg');
fs.mkdirSync(CACHE, { recursive: true });

// playwright из проекта, иначе из глобальных модулей
let chromium;
try { ({ chromium } = await import('playwright')); }
catch { ({ chromium } = await import('/opt/node22/lib/node_modules/playwright/index.mjs')); }

// шрифты Google качаем один раз и кладём в кэш
function fetchCached(url) {
  const key = path.join(CACHE, Buffer.from(url).toString('base64url').slice(0, 60));
  if (!fs.existsSync(key)) execFileSync('curl', ['-sS', '-A', 'Mozilla/5.0 Chrome/140', '-o', key, url], { stdio: 'pipe' });
  return fs.readFileSync(key);
}

const logo = 'data:image/jpeg;base64,' + fs.readFileSync(path.join(ROOT, 'assets', 'konga-logo.jpg')).toString('base64');
const html = fs.readFileSync(path.join(HERE, 'og-image.html'), 'utf8').replace('LOGO_SRC', logo);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await ctx.route('https://fonts.googleapis.com/**', r => r.fulfill({ status: 200, contentType: 'text/css', body: fetchCached(r.request().url()) }));
await ctx.route('https://fonts.gstatic.com/**', r => r.fulfill({ status: 200, contentType: 'font/woff2', body: fetchCached(r.request().url()) }));

const page = await ctx.newPage();
await page.setContent(html, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(400);
await page.screenshot({ path: OUT, type: 'jpeg', quality: 88, clip: { x: 0, y: 0, width: 1200, height: 630 } });
await browser.close();

console.log('готово: assets/og-image.jpg —', (fs.statSync(OUT).size / 1024).toFixed(0) + ' КБ');
