# Деплой сайта + заявки в Telegram

Сайт — статика: `index.html` + `assets/`. Сборки нет.
Заявка с формы уходит в Telegram-бота.

> ## Главное про токен
>
> GitHub Pages — **только статика, сервера нет**. Всё, что лежит в репозитории,
> отдаётся браузеру как есть. Если вписать токен бота в `assets/config.js`,
> его увидит любой, кто откроет исходник страницы: сможет писать от имени бота,
> читать ваши заявки и удалять сообщения. А для бесплатного Pages репозиторий
> ещё и должен быть публичным.
>
> Поэтому токен живёт **не в коде**, а в настройках хостинга — как секретная
> переменная. Ниже два способа, оба бесплатные и без карты.
>
> Если токен всё-таки попал в репозиторий — отозвать у @BotFather
> командой `/revoke` и выпустить новый. Удалить файл недостаточно:
> токен остаётся в истории git.

## С нуля: Cloudflare Pages + домен konga.cz

Пошаговый порядок. Всё бесплатно, карта не нужна. Занимает ~30 минут плюс
ожидание DNS.

### 0. Почта — сделать ПЕРВЫМ делом

Сейчас у домена нет MX-записей, значит `info@konga.cz` и `b2b@konga.cz`
не работают. Если почта нужна, включи её в Forpsi **до** смены NS-серверов:
панель домена → кнопка **Set to FORPSI mailserver** (`mxavas.forpsi.com`).
Тогда Cloudflare при подключении домена сам подхватит MX-записи.
Если сделать потом — придётся добавлять их в Cloudflare руками.

### 1. Аккаунт Cloudflare

[dash.cloudflare.com](https://dash.cloudflare.com) → Sign up → подтвердить почту.

### 2. Создать проект Pages

1. **Workers & Pages** → **Create** → вкладка **Pages** → **Connect to Git**.
2. Разрешить доступ к репозиторию `konga_shop`, выбрать его.
3. **Production branch** — ветка, с которой собирать (`main`, если смёржишь,
   или рабочая ветка как есть).
4. Настройки сборки:

   | Поле | Значение |
   |---|---|
   | Framework preset | None |
   | Build command | `bash tools/build-site.sh` |
   | Build output directory | `_site` |
   | Root directory | оставить пустым |

5. **Save and Deploy**. Через пару минут будет адрес `<проект>.pages.dev`.

Папку `functions/` Cloudflare подхватывает из корня репозитория сам —
настраивать её не надо.

### 2б. Если Cloudflare предложил Worker, а не Pages

В новом интерфейсе Cloudflare сборка из Git часто создаётся как **Worker**
(в настройках видно поле *Deploy command*). Это тоже рабочий вариант,
репозиторий к нему готов — есть `wrangler.toml` и `src/worker.js`.
Настройки тогда такие:

| Поле | Значение |
|---|---|
| Build command | `bash tools/build-site.sh` |
| Deploy command | `npx wrangler deploy` |
| Root directory | `/` |

Статику отдаёт биндинг `ASSETS` из `_site`, а `/api/lead` обрабатывает
`src/worker.js`. Логика приёма заявок общая с Pages — лежит
в `src/lead-handler.js`, дублей нет.

Домен в этом случае подключается там же: **Worker → Settings → Domains &
Routes → Add → Custom domain**.

### 3. Вписать токен бота

**Settings → Variables and Secrets** →окружение **Production** → Add:

| Имя | Тип | Значение |
|---|---|---|
| `BOT_TOKEN` | Secret | токен от @BotFather |
| `CHAT_ID` | Secret | id получателей через запятую, например `111,222` |

Потом **Deployments → последний деплой → Retry deployment** — переменные
подхватываются только при сборке.

Хочешь, чтобы форма работала и на preview-деплоях веток — добавь те же
переменные в окружение Preview.

### 4. Проверить, что заявки ходят

Открыть `<проект>.pages.dev`, заполнить форму. В Telegram должно прилететь
сообщение обоим получателям.

Не пришло — смотри таблицу ошибок в разделе «Шаг 4. Проверить» ниже.
Чаще всего: получатель не нажал `/start` у бота, поэтому Telegram не даёт
боту написать первым.

### 5. Подключить домен

1. Cloudflare → **Add a site** (кнопка вверху дашборда) → `konga.cz` → тариф **Free**.
2. Cloudflare просканирует текущие записи и покажет **два своих NS-сервера**
   вида `xxx.ns.cloudflare.com`.
3. [admin.forpsi.com](https://admin.forpsi.com) → домен `konga.cz` → раздел смены
   **NS-серверов** (не DNS-записей!) → вписать эти два адреса, сохранить.
4. Ждать. Обычно 15–60 минут, изредка до суток. Cloudflare пришлёт письмо,
   когда домен станет Active.
5. В Cloudflare → **DNS** удалить лишнее, что осталось от Forpsi:
   - `A konga.cz → 81.2.196.19` (парковка Forpsi)
   - `CNAME *.konga.cz → konga.cz` (лишний wildcard)

   MX-записи, если ты включил почту на шаге 0, **не трогать**.
6. Pages → проект → **Custom domains** → **Set up a domain** → `konga.cz`.
   Повторить для `www.konga.cz`. Записи Cloudflare создаст сам,
   сертификат выпустит сам (10–15 минут).

### 6. После того как домен заработал

1. Проверить, что `https://konga.cz` открывается и форма шлёт заявки.
2. Сбросить кэш превью ссылки: боту [@WebpageBot](https://t.me/WebpageBot)
   команда `/start`, потом отправить ему `https://konga.cz`.
3. GitHub Pages можно выключить, чтобы не было копии сайта:
   Settings → Pages → Source → **None**. Файл
   `.github/workflows/deploy-pages.yml` тогда просто не нужен.

### Что где лежит после настройки

| Что | Где |
|---|---|
| код сайта | GitHub, репозиторий `konga_shop` |
| сборка и хостинг | Cloudflare Pages, пересобирает при каждом пуше |
| токен бота | Cloudflare Pages → Variables and Secrets |
| DNS домена | Cloudflare (домен куплен в Forpsi, там только NS) |
| почта | Forpsi (`mxavas.forpsi.com`), MX-записи живут в Cloudflare |

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

## Шаг 2. Выбрать, где живёт сайт

### Путь 1 (рекомендую): Cloudflare Pages — сайт, бэкенд и домен в одном месте

Бесплатно, без карты. Сайт статический, а рядом работает маленькая функция
`functions/api/lead.js`, которая знает токен и шлёт заявки в Telegram.
Она на том же домене, поэтому никакого CORS и никаких лишних настроек.

1. [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages** →
   **Create** → вкладка **Pages** → **Connect to Git** → выбрать репозиторий
   `konga_shop` и ветку.
2. Настройки сборки:
   - **Framework preset:** None
   - **Build command:** `bash tools/build-site.sh`
   - **Build output directory:** `_site`
3. **Save and Deploy**. Получится адрес вида `konga-shop.pages.dev`.
4. **Settings → Variables and Secrets** → добавить для Production:

   | Имя | Тип | Значение |
   |---|---|---|
   | `BOT_TOKEN` | Secret | токен от @BotFather |
   | `CHAT_ID` | Secret | id чатов через запятую, например `111,222` |

5. Пересобрать (**Deployments → Retry deployment**) — переменные подхватываются
   при сборке.
6. В `assets/config.js` оставить:

   ```js
   endpoint: '/api/lead',
   ```

Каждый пуш в ветку пересобирает сайт сам.

### Путь 2: остаться на GitHub Pages + отдельный Cloudflare Worker

Если сайт уже на Pages и переезжать не хочется. Разница одна: прослойка живёт
отдельно, на своём адресе, поэтому нужен список разрешённых доменов.

1. **Workers & Pages** → **Create** → **Worker** → назвать `konga-leads` → **Deploy**.
2. **Edit code** → вставить содержимое [`backend/cloudflare-worker.js`](backend/cloudflare-worker.js) → **Deploy**.
3. **Settings → Variables and Secrets**:

   | Имя | Тип | Значение |
   |---|---|---|
   | `BOT_TOKEN` | Secret | токен от @BotFather |
   | `CHAT_ID` | Secret | id чатов через запятую |
   | `ALLOWED_ORIGINS` | Text | `https://ardangerus.github.io,https://konga.cz` |

4. Скопировать адрес воркера в `assets/config.js`:

   ```js
   endpoint: 'https://konga-leads.твой-аккаунт.workers.dev',
   ```

Сам сайт включается в Settings → Pages → Source: **GitHub Actions**
(workflow `.github/workflows/deploy-pages.yml` уже в репозитории).

### Путь 3: Google Apps Script — если не хочешь Cloudflare вообще

Код в [`backend/google-apps-script.gs`](backend/google-apps-script.gs), инструкция —
в комментарии в начале файла. Нужен только Google-аккаунт. Бонус: умеет писать
заявки ещё и в Google-таблицу (переменная `SHEET_ID`). Полученный `.../exec` URL
идёт в `endpoint`.

### Чего делать не надо: токен прямо в config.js

```js
telegram: { botToken: '8123...', chatId: '111,222' }   // так не надо
```

Работает, но токен виден всем. Годится только чтобы проверить за пять минут
на локальном файле, и то лучше не коммитить.

## Шаг 3. Подвязать домен

### На Cloudflare Pages (путь 1)

1. Проект → **Custom domains** → **Set up a domain** → ввести `konga.cz`.
2. Если домен уже в Cloudflare — записи создадутся сами, останется подтвердить.
   Если у другого регистратора — Cloudflare покажет, какой `CNAME` прописать,
   либо предложит перевести к себе NS-записи (бесплатно и проще).
3. Так же добавить `www.konga.cz` — Cloudflare сам сделает редирект.

HTTPS-сертификат выпускается автоматически, минут за 10–15.

### На GitHub Pages (путь 2)

1. У регистратора домена — `A`-записи на `185.199.108.153`, `185.199.109.153`,
   `185.199.110.153`, `185.199.111.153`; для `www` — `CNAME` на `ardangerus.github.io`.
2. Settings → Pages → **Custom domain** → `konga.cz` → включить **Enforce HTTPS**.
   GitHub создаст в репозитории файл `CNAME` — его не удалять.

### Домен куплен у Forpsi — что делать там

Самый простой путь — отдать DNS Cloudflare, тогда Pages подключит домен сам
и корень домена (без www) заработает без плясок.

1. Cloudflare → **Add a site** → ввести домен → тариф **Free**.
   Cloudflare просканирует записи и выдаст два своих NS-сервера
   вида `xxx.ns.cloudflare.com`.
2. [admin.forpsi.com](https://admin.forpsi.com) → домен → раздел смены
   NS-серверов (не DNS-записей) → вписать те два адреса, сохранить.
3. Подождать. Обычно 15–60 минут, изредка до суток.
4. Cloudflare Pages → проект → **Custom domains** → добавить `konga.cz`
   и `www.konga.cz`. Сертификат выпустится сам.

Без смены NS тоже можно, но с оговоркой: в DNS Forpsi надо добавить
`CNAME www → <проект>.pages.dev`, а для корня домена обычный CNAME
стандартом не разрешён — нужна поддержка ALIAS/ANAME. Есть ли она
у Forpsi, зависит от тарифа; если нет, корень домена работать не будет.
Поэтому проще перенести NS.

### После переезда на домен — в обоих случаях

Прописать домен в коде одной командой:

```bash
bash tools/set-domain.sh konga.cz
```

Скрипт поправит `canonical`, `og:url`, `og:image`, `twitter:image`, JSON-LD,
`robots.txt`, `sitemap.xml` и ссылку на главную в `404.html`. После этого
закоммитить и запушить.

Отдельно, руками:

- почта `info@` / `b2b@` в `index.html`, если домен не `konga.cz`
- `ALLOWED_ORIGINS` воркера (только путь 2)

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
| `CORS` / `origin_not_allowed` | домен сайта не добавлен в `ALLOWED_ORIGINS` воркера (путь 2) |
| `404` на `/api/lead` | на Cloudflare Pages не подхватилась папка `functions/` — проверь, что Build output = `_site`, а `functions/` лежит в корне репозитория |
| `telegram_failed`, `chat not found` | неверный `CHAT_ID`, или получатель не написал боту первым |
| заявка пришла только одному | второй получатель не нажал `/start` у бота либо заблокировал его; в логах видно, кому не ушло |
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
| `src/lead-handler.js` | приём заявки и отправка в Telegram — общее ядро |
| `src/worker.js` + `wrangler.toml` | точка входа для Cloudflare Workers (`npx wrangler deploy`) |
| `functions/api/lead.js` | то же самое для Cloudflare Pages |
| `backend/cloudflare-worker.js` | отдельный воркер для GitHub Pages (путь 2) |
| `backend/google-apps-script.gs` | прослойка Google (путь 3) |
| `tools/build-site.sh` | сборка статики в `_site/`, общая для Pages и Actions |
| `tools/set-domain.sh` | прописать боевой домен во всех файлах разом |
| `.github/workflows/deploy-pages.yml` | автодеплой на GitHub Pages |
| `robots.txt`, `sitemap.xml`, `404.html` | SEO и страница 404 |
| `Konga Kratom.dc.html`, `support.js`, `ios-frame.jsx` | исходный дизайн-макет, на сайте не используется |
