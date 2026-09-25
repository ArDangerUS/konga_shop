/**
 * Konga Kratom — приём заявок и отправка в Telegram.
 * Google Apps Script (бесплатно, без карты, без Cloudflare).
 *
 * Как поднять:
 *  1. script.google.com → New project → вставить этот код.
 *  2. Project Settings → Script properties → добавить:
 *        BOT_TOKEN  = токен от @BotFather
 *        CHAT_ID    = id чата. Несколько — через запятую: 111111111,222222222
 *        SHEET_ID   = (необязательно) id Google-таблицы для журнала заявок
 *  3. Deploy → New deployment → type: Web app
 *        Execute as: Me
 *        Who has access: Anyone
 *  4. Скопировать URL (.../exec) в assets/config.js → endpoint.
 *
 * Важно: после любой правки кода нужно Deploy → Manage deployments →
 * Edit → Version: New version, иначе изменения не применятся.
 */

function doPost(e) {
  try {
    var props = PropertiesService.getScriptProperties();
    var token = props.getProperty('BOT_TOKEN');
    var chatId = props.getProperty('CHAT_ID');
    if (!token || !chatId) return out({ ok: false, error: 'not_configured' });

    var data = JSON.parse((e && e.postData && e.postData.contents) || '{}');

    // honeypot — бот заполнил скрытое поле
    if (data.website) return out({ ok: true });

    var name = clean_(data.name, 120);
    var phone = clean_(data.phone, 40);
    if (name.length < 2 || phone.replace(/\D/g, '').length < 9) {
      return out({ ok: false, error: 'validation' });
    }

    var text = buildMessage_(data, name, phone);

    var ids = String(chatId).split(',').map(function (v) { return v.trim(); }).filter(String);
    var delivered = 0, lastError = '';
    ids.forEach(function (id) {
      var res = UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/sendMessage', {
        method: 'post',
        contentType: 'application/json',
        payload: JSON.stringify({
          chat_id: id,
          text: text,
          parse_mode: 'HTML',
          disable_web_page_preview: true
        }),
        muteHttpExceptions: true
      });
      var body = JSON.parse(res.getContentText());
      if (body.ok) delivered++;
      else { lastError = body.description; console.log('telegram error for ' + id + ': ' + body.description); }
    });

    // хотя бы один получатель — заявка не потеряна
    if (!delivered) return out({ ok: false, error: 'telegram_failed', description: lastError });

    logToSheet_(props.getProperty('SHEET_ID'), name, phone, data);
    return out({ ok: true, delivered: delivered, of: ids.length });
  } catch (err) {
    return out({ ok: false, error: String(err) });
  }
}

function doGet() {
  return out({ ok: true, service: 'konga-leads' });
}

function clean_(v, max) {
  return String(v == null ? '' : v).trim().slice(0, max);
}

function esc_(v) {
  return clean_(v, 300).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function buildMessage_(d, name, phone) {
  var lines = [
    '🌿 <b>Nová poptávka — Konga Kratom</b>',
    '',
    '👤 <b>Jméno:</b> ' + esc_(name),
    '📞 <b>Telefon:</b> ' + esc_(phone)
  ];
  var utm = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content']
    .filter(function (k) { return d[k]; })
    .map(function (k) { return k.replace('utm_', '') + ': ' + esc_(d[k]); });
  if (utm.length) lines.push('🎯 <b>Kampaň:</b> ' + utm.join(' · '));
  if (d.gclid) lines.push('🆔 gclid: ' + esc_(d.gclid));
  if (d.referrer) lines.push('↩️ <b>Zdroj:</b> ' + esc_(d.referrer));
  if (d.page) lines.push('🌐 ' + esc_(d.page));
  lines.push('🕒 ' + Utilities.formatDate(new Date(), 'Europe/Prague', 'dd.MM.yyyy HH:mm'));
  return lines.join('\n');
}

function logToSheet_(sheetId, name, phone, d) {
  if (!sheetId) return;
  try {
    var sheet = SpreadsheetApp.openById(sheetId).getSheets()[0];
    sheet.appendRow([
      Utilities.formatDate(new Date(), 'Europe/Prague', 'dd.MM.yyyy HH:mm'),
      name, phone,
      d.utm_source || '', d.utm_medium || '', d.utm_campaign || '',
      d.page || '', d.referrer || ''
    ]);
  } catch (err) {
    console.log('sheet error: ' + err);
  }
}

function out(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
