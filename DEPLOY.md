# Деплой на GitHub Pages + заявки в Telegram

Сайт — статика: `index.html` + `assets/`. Никакого билда, никакого сервера.
Заявка с формы уходит в Telegram-бота.

---

## Шаг 1. Создать бота и узнать chat_id

1. В Telegram напиши [@BotFather](https://t.me/BotFather) → `/newbot` → придумай имя.
   Он выдаст токен вида `8123456789:AAHdqTcvC...` — **это пароль от бота, не публикуй его.**
2. Напиши своему новому боту любое сообщение (иначе он не сможет тебе ответить).
3. Открой в браузере: `https://api.telegram.org/bot<ТВОЙ_ТОКЕН>/getUpdates`
   и найди `"chat":{"id":123456789` — это твой `chat_id`.

Хочешь, чтобы заявки падали в общую группу: добавь бота в группу, дай права писать,
напиши в группу сообщение и снова открой `getUpdates` — там будет id вида `-1001234567890`.

---

## Шаг 2. Куда шлём заявку — выбери один вариант

### Вариант A (рекомендую): Cloudflare Worker — токен спрятан

GitHub Pages — статика, кода на сервере нет. Чтобы токен бота не лежал открыто
в исходниках страницы, отправку делает бесплатный воркер-прослойка.

1. [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages** → **Create** → **Worker** → назови, например, `konga-leads` → **Deploy**.
2. **Edit code** → удали всё → вставь содержимое [`backend/cloudflare-worker.js`](backend/cloudflare-worker.js) → **Deploy**.
3. **Settings → Variables and Secrets** → добавь:

   | Имя | Тип | Значение |
   |---|---|---|
   | `BOT_TOKEN` | Secret | токен от BotFather |
   | `CHAT_ID` | Secret | id чата из шага 1 |
   | `ALLOWED_ORIGINS` | Text | `https://ardangerus.github.io,https://konga.cz` |

4. Ещё раз **Deploy**. Скопируй URL воркера (`https://konga-leads.<аккаунт>.workers.dev`).
5. Впиши его в `assets/config.js`:

   ```js
   endpoint: 'https://konga-leads.твой-аккаунт.workers.dev',
   ```

Бесплатный тариф — 100 000 запросов в сутки, для лендинга с головой.

### Вариант A2: Google Apps Script — то же самое, если не хочешь Cloudflare

Код в [`backend/google-apps-script.gs`](backend/google-apps-script.gs), инструкция —
в комментарии в начале файла. Бонус: может параллельно писать заявки
в Google-таблицу (переменная `SHEET_ID`). Полученный `.../exec` URL — тоже в `endpoint`.

### Вариант B: напрямую в Telegram, без прослойки

Быстрее всего, но **токен бота будет виден любому**, кто откроет исходник страницы:
чужие смогут писать от имени бота и читать переписку. Годится, чтобы проверить
за 5 минут, дальше лучше перейти на вариант A.

```js
endpoint: '',
telegram: { botToken: '8123456789:AAH...', chatId: '123456789' },
```

Если токен всё-таки утёк — отзови его у @BotFather (`/revoke`) и выпусти новый.

---

## Шаг 3. Включить GitHub Pages

1. Смёржить ветку `claude/cool-darwin-13xn0e` в `main`.
2. Repo → **Settings** → **Pages** → **Build and deployment** → Source: **GitHub Actions**.
3. Готово. Workflow `.github/workflows/deploy-pages.yml` соберёт и выложит сайт при
   каждом пуше в `main`. Статус — во вкладке **Actions**.

Адрес: **https://ardangerus.github.io/konga_shop/**

<details>
<summary>Альтернатива без Actions</summary>

Settings → Pages → Source: **Deploy from a branch** → ветка `main`, папка `/ (root)`.
Тогда файл `.github/workflows/deploy-pages.yml` можно удалить.
</details>

### Свой домен (konga.cz)

1. У регистратора домена: `A`-записи на `185.199.108.153`, `185.199.109.153`,
   `185.199.110.153`, `185.199.111.153`, плюс `CNAME` для `www` → `ardangerus.github.io`.
2. Settings → Pages → **Custom domain** → `konga.cz` → включить **Enforce HTTPS**.
3. В репозитории заменить адрес `https://ardangerus.github.io/konga_shop/` на `https://konga.cz/`
   в `index.html` (canonical + og:url), `robots.txt`, `sitemap.xml`, `404.html`
   и добавить домен в `ALLOWED_ORIGINS` воркера.

---

## Шаг 4. Проверить

1. Открыть сайт с телефона, заполнить форму, отправить.
2. В Telegram должно прилететь:

   ```
   🌿 Nová poptávka — Konga Kratom

   👤 Jméno: Jan Novák
   📞 Telefon: +420 777 123 456
   🎯 Kampaň: source: google · medium: cpc · campaign: kratom-praha
   🌐 https://konga.cz/?utm_source=google...
   🕒 19.09.2026 13:07
   ```

Не пришло — открой консоль браузера (F12), поставь `debug: true` в `assets/config.js`
и смотри ошибку:

| Что видно | Причина |
|---|---|
| `CORS` / `origin_not_allowed` | домен сайта не добавлен в `ALLOWED_ORIGINS` воркера |
| `telegram_failed`, `chat not found` | неверный `CHAT_ID`, или боту не написали первым |
| `401 Unauthorized` | неверный `BOT_TOKEN` |
| `not_configured` | не заданы переменные в Cloudflare / Apps Script |
| ничего не происходит | пустой `endpoint` и пустой `telegram` в `config.js` |

---

## Превью ссылки (Telegram, WhatsApp, Facebook)

Картинка превью — `assets/og-image.jpg` (1200×630, логотип + название + адрес),
подключена через `og:image` в `index.html`.

Перерисовать её можно скриптом `tools/make-og-image.mjs`
(`node tools/make-og-image.mjs`) — он рендерит `tools/og-image.html` в Chromium.

**Telegram кэширует превью намертво.** После деплоя старая картинка и старый текст
будут висеть ещё долго. Сбросить: написать боту
[@WebpageBot](https://t.me/WebpageBot) команду `/start`, потом отправить ему ссылку —
он обновит кэш. Для Facebook — [Sharing Debugger](https://developers.facebook.com/tools/debug/),
кнопка *Scrape Again*.

## Что ещё заполнить перед рекламой

Плейсхолдеры из макета остались в `index.html` — найди и замени:

- адрес превью `https://ardangerus.github.io/konga_shop/` в `og:image`, `og:url`, `canonical` — при переезде на свой домен
- `+420 000 000 000` → реальный телефон (все вхождения: блок контактов, `tel:` в мобильной панели, JSON-LD)
- `info@konga.cz`, `b2b@konga.cz` → реальные почты
- `IČO 000 00 000` → реальное IČO
- цены `249 Kč / 50 g` — в трёх карточках, в JSON-LD и в `contact` в `config.js`
- `fallbackPhone` в `assets/config.js`

## Всплывающий баннер при заходе

Настраивается в `assets/config.js` → `popup`. Три варианта вёрстки:

| `variant` | что это | когда брать |
|---|---|---|
| `'sheet'` | шторка снизу, крупная цена, 3 пункта о качестве, адрес, телефон, кнопка | по умолчанию; максимальная заметность на телефоне |
| `'card'` | окно по центру с логотипом, то же содержимое | если хочется «премиальнее» и заметнее |
| `'bar'` | узкая полоска внизу: цена, адрес, телефон, кнопка | самый мягкий, почти не мешает читать |

```js
popup: {
  enabled: true,
  variant: 'sheet',      // 'sheet' | 'card' | 'bar'
  delay: 1200,           // через сколько мс показать
  showAgain: 'session'   // как часто показывать одному человеку
}
```

Частота показа — `showAgain`:

| Значение | Поведение |
|---|---|
| `'session'` | раз за сеанс браузера: перезагрузка и переходы по сайту баннер не повторяют, но закрыл вкладку и зашёл снова — покажется (текущая настройка) |
| `'always'` | каждый раз, включая перезагрузку. Удобно, пока настраиваешь; живым посетителям надоедает |
| `24` (число) | не показывать столько часов. Считается от момента показа, хранится в localStorage |

Цена, адрес, часы и телефон в баннере берутся из блока `contact` того же файла.
Кнопка скроллит к форме `#kontakt` и ставит курсор в поле имени.
Закрыть можно крестиком, кликом по фону или Esc.

Чтобы увидеть баннер снова во время проверки: открыть сайт в анонимном окне,
либо выполнить в консоли браузера
`sessionStorage.removeItem('konga_popup_seen'); localStorage.removeItem('konga_popup_seen')`
и перезагрузить страницу.

События для аналитики: `popup_shown`, `popup_cta`, `popup_close`, `popup_call`.

> **Про SEO:** Google не любит навязчивые попапы на мобильных при переходе
> **из поиска** — это может понижать позиции. На платный трафик это не
> распространяется. Если органика важна, возьми `variant: 'bar'` — он
> не перекрывает контент и под санкции не попадает.

### Аналитика

Форма уже дёргает события при отправке — остаётся вставить счётчики
перед `</head>` в `index.html`:

- `dataLayer` / GTM: событие `generate_lead`, клики по кнопкам — `cta_click`
- `gtag()`: `generate_lead`
- Meta Pixel: `Lead`

---

## Файлы

| Файл | Что это |
|---|---|
| `index.html` | сам лендинг (боевой, без рантайма макета) |
| `assets/config.js` | **единственное, что нужно править** для приёма заявок |
| `assets/form.js` | валидация, отправка, honeypot, UTM, события аналитики |
| `backend/cloudflare-worker.js` | прослойка Cloudflare (вариант A) |
| `backend/google-apps-script.gs` | прослойка Google (вариант A2) |
| `.github/workflows/deploy-pages.yml` | автодеплой на Pages |
| `robots.txt`, `sitemap.xml`, `404.html` | SEO и страница 404 |
| `Konga Kratom.dc.html`, `support.js`, `ios-frame.jsx` | исходный дизайн-макет, на сайте не используется |
