/* Konga Kratom — отправка заявки (имя + телефон) в Telegram.
   Порядок: если задан KONGA_CONFIG.endpoint — шлём туда (токен спрятан
   на сервере). Иначе, если заданы botToken+chatId — шлём прямо в Telegram
   Bot API. Иначе — показываем ошибку и телефон для звонка. */
(function () {
  'use strict';

  var CFG = window.KONGA_CONFIG || {};
  var form = document.getElementById('lead-form');
  if (!form) return;

  var errorBox = document.getElementById('form-error');
  var successBox = document.getElementById('form-success');
  var successPhone = document.getElementById('success-phone');
  var button = form.querySelector('button[type="submit"]');
  var buttonLabel = button ? button.textContent : '';

  function log() {
    if (CFG.debug && window.console) console.log.apply(console, ['[konga]'].concat([].slice.call(arguments)));
  }

  /* ---------- служебные поля: UTM, источник, время ---------- */
  function fillMeta() {
    var q = new URLSearchParams(location.search);
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid'].forEach(function (k) {
      var input = form.elements[k];
      if (input) input.value = q.get(k) || '';
    });
    if (form.elements['page']) form.elements['page'].value = location.href;
    if (form.elements['referrer']) form.elements['referrer'].value = document.referrer || '';
    if (form.elements['ts']) form.elements['ts'].value = new Date().toISOString();
  }
  fillMeta();

  /* ---------- валидация ---------- */
  function digits(s) { return (s || '').replace(/\D/g, ''); }

  function validate(data) {
    if (!data.name || data.name.trim().length < 2) return 'Zadejte prosím své jméno.';
    if (digits(data.phone).length < 9) return 'Zadejte prosím platné telefonní číslo.';
    if (!form.elements['consent'] || !form.elements['consent'].checked) return 'Potvrďte prosím souhlas se zpracováním údajů.';
    return null;
  }

  function showError(msg) {
    if (!errorBox) return;
    errorBox.textContent = msg;
    errorBox.hidden = false;
  }
  function clearError() { if (errorBox) { errorBox.hidden = true; errorBox.textContent = ''; } }

  /* ---------- текст сообщения для Telegram ---------- */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function buildMessage(d) {
    var lines = [
      '🌿 <b>Nová poptávka — Konga Kratom</b>',
      '',
      '👤 <b>Jméno:</b> ' + esc(d.name),
      '📞 <b>Telefon:</b> ' + esc(d.phone),
      '🏷 <b>Sleva:</b> ' + (CFG.discount || 15) + ' %'
    ];
    var utm = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content']
      .map(function (k) { return d[k] ? k.replace('utm_', '') + ': ' + d[k] : null; })
      .filter(Boolean);
    if (utm.length) lines.push('🎯 <b>Kampaň:</b> ' + esc(utm.join(' · ')));
    if (d.gclid) lines.push('🆔 gclid: ' + esc(d.gclid));
    if (d.referrer) lines.push('↩️ <b>Zdroj:</b> ' + esc(d.referrer));
    lines.push('🌐 ' + esc(d.page));
    lines.push('🕒 ' + new Date().toLocaleString('cs-CZ', { timeZone: 'Europe/Prague' }));
    return lines.join('\n');
  }

  /* ---------- транспорт ---------- */
  function withTimeout(ms) {
    if (typeof AbortController === 'undefined') return {};
    var ctrl = new AbortController();
    setTimeout(function () { ctrl.abort(); }, ms);
    return { signal: ctrl.signal };
  }

  /* Свой прокси. Content-Type: text/plain — чтобы браузер не слал
     preflight OPTIONS (Google Apps Script его не умеет). */
  function sendToEndpoint(d) {
    var opts = withTimeout(12000);
    opts.method = 'POST';
    opts.headers = { 'Content-Type': 'text/plain;charset=utf-8' };
    opts.body = JSON.stringify(d);
    return fetch(CFG.endpoint, opts).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.text();
    }).then(function (t) {
      log('endpoint odpověď:', t);
      // Apps Script и Worker возвращают JSON {ok:true}; пустой ответ тоже ок
      if (t && t.indexOf('"ok":false') !== -1) throw new Error('endpoint: ' + t);
      return true;
    });
  }

  /* Прямая отправка в Telegram. urlencoded — тоже без preflight. */
  function sendToTelegram(d) {
    var tg = CFG.telegram || {};
    var body = new URLSearchParams({
      chat_id: tg.chatId,
      text: buildMessage(d),
      parse_mode: 'HTML',
      disable_web_page_preview: 'true'
    });
    var opts = withTimeout(12000);
    opts.method = 'POST';
    opts.body = body;
    return fetch('https://api.telegram.org/bot' + tg.botToken + '/sendMessage', opts)
      .then(function (r) { return r.json(); })
      .then(function (j) {
        log('telegram odpověď:', j);
        if (!j.ok) throw new Error('telegram: ' + (j.description || 'neznámá chyba'));
        return true;
      });
  }

  function send(d) {
    if (CFG.endpoint) return sendToEndpoint(d);
    if (CFG.telegram && CFG.telegram.botToken && CFG.telegram.chatId) return sendToTelegram(d);
    return Promise.reject(new Error('Formulář není nakonfigurován (assets/config.js).'));
  }

  /* ---------- аналитика ---------- */
  function track(name, params) {
    try {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push(Object.assign({ event: name }, params || {}));
      if (typeof window.gtag === 'function') window.gtag('event', name, params || {});
      if (typeof window.fbq === 'function') window.fbq('track', name === 'generate_lead' ? 'Lead' : name);
    } catch (e) { log('track error', e); }
  }

  /* ---------- сабмит ---------- */
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    clearError();
    fillMeta();

    var fd = new FormData(form);
    var data = {};
    fd.forEach(function (v, k) { data[k] = typeof v === 'string' ? v.trim() : v; });

    // honeypot: люди это поле не видят, боты заполняют
    if (data.website) { log('honeypot'); showSuccess(data.phone); return; }

    data.discount = CFG.discount || 15;
    data.text = buildMessage(data); // готовый текст для прокси

    var err = validate(data);
    if (err) { showError(err); return; }

    if (button) { button.disabled = true; button.textContent = 'Odesíláme…'; }

    send(data)
      .then(function () {
        track('generate_lead', { form: 'lead-form', value: 1 });
        showSuccess(data.phone);
      })
      .catch(function (e2) {
        log('chyba odeslání', e2);
        showError('Formulář se nepodařilo odeslat. Zavolejte nám prosím na ' + (CFG.fallbackPhone || '') + ' nebo to zkuste za chvíli znovu.');
        if (button) { button.disabled = false; button.textContent = buttonLabel; }
      });
  });

  function showSuccess(phone) {
    if (successPhone) successPhone.textContent = phone || '';
    // у формы инлайновый display:flex — атрибут hidden его не перебьёт
    if (form) { form.hidden = true; form.style.display = 'none'; }
    if (successBox) {
      successBox.hidden = false;
      successBox.style.display = 'block';
      successBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  /* клики по CTA — в аналитику */
  document.querySelectorAll('[data-cta]').forEach(function (el) {
    el.addEventListener('click', function () {
      track('cta_click', { cta: el.getAttribute('data-cta') });
    });
  });
})();
