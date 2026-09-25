/**
 * Konga Kratom — приём заявок с лендинга и отправка в Telegram.
 * Cloudflare Worker (бесплатный план: 100 000 запросов в день).
 *
 * Переменные окружения (Settings → Variables and Secrets):
 *   BOT_TOKEN        (Secret) — токен от @BotFather
 *   CHAT_ID          (Secret) — id чата, куда падают заявки. Несколько —
 *                               через запятую: 111111111,222222222
 *   ALLOWED_ORIGINS  (Text)   — через запятую, например:
 *                               https://ardangerus.github.io,https://konga.cz
 *
 * Деплой: dash.cloudflare.com → Workers & Pages → Create → Worker →
 * вставить этот код → Deploy → добавить переменные → Deploy ещё раз.
 * Полученный URL вписать в assets/config.js → endpoint.
 */

const MAX_BODY = 8 * 1024;

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const allowed = (env.ALLOWED_ORIGINS || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const originOk = allowed.length === 0 || allowed.includes(origin);

    const cors = {
      'Access-Control-Allow-Origin': originOk && origin ? origin : allowed[0] || '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
      Vary: 'Origin',
    };

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method !== 'POST') return json({ ok: false, error: 'method_not_allowed' }, 405, cors);
    if (!originOk) return json({ ok: false, error: 'origin_not_allowed' }, 403, cors);
    if (!env.BOT_TOKEN || !env.CHAT_ID) return json({ ok: false, error: 'not_configured' }, 500, cors);

    let data;
    try {
      const raw = await request.text();
      if (raw.length > MAX_BODY) return json({ ok: false, error: 'too_large' }, 413, cors);
      data = JSON.parse(raw);
    } catch {
      return json({ ok: false, error: 'bad_json' }, 400, cors);
    }

    // honeypot — молча делаем вид, что всё хорошо
    if (data.website) return json({ ok: true }, 200, cors);

    const name = clean(data.name, 120);
    const phone = clean(data.phone, 40);
    if (name.length < 2 || phone.replace(/\D/g, '').length < 9) {
      return json({ ok: false, error: 'validation' }, 400, cors);
    }

    const text = buildMessage({ ...data, name, phone }, request);

    const chatIds = String(env.CHAT_ID).split(',').map((s) => s.trim()).filter(Boolean);
    const results = await Promise.all(chatIds.map((id) => sendTelegram(env.BOT_TOKEN, id, text)));

    const delivered = results.filter((r) => r.ok).length;
    results.forEach((r, i) => {
      if (!r.ok) console.log('telegram error for', chatIds[i], JSON.stringify(r));
    });

    // хотя бы один получатель — заявка не потеряна, посетителю показываем успех
    if (!delivered) return json({ ok: false, error: 'telegram_failed' }, 502, cors);
    return json({ ok: true, delivered, of: chatIds.length }, 200, cors);
  },
};

async function sendTelegram(token, chatId, text) {
  try {
    const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true }),
    });
    return await r.json();
  } catch (e) {
    return { ok: false, description: String(e) };
  }
}

function clean(v, max) {
  return String(v == null ? '' : v).trim().slice(0, max);
}

function esc(v) {
  return clean(v, 300).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function buildMessage(d, request) {
  const lines = [
    '🌿 <b>Nová poptávka — Konga Kratom</b>',
    '',
    `👤 <b>Jméno:</b> ${esc(d.name)}`,
    `📞 <b>Telefon:</b> ${esc(d.phone)}`,
  ];

  const utm = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content']
    .filter((k) => d[k])
    .map((k) => `${k.replace('utm_', '')}: ${esc(d[k])}`);
  if (utm.length) lines.push(`🎯 <b>Kampaň:</b> ${utm.join(' · ')}`);
  if (d.gclid) lines.push(`🆔 gclid: ${esc(d.gclid)}`);
  if (d.referrer) lines.push(`↩️ <b>Zdroj:</b> ${esc(d.referrer)}`);
  if (d.page) lines.push(`🌐 ${esc(d.page)}`);

  const country = request.headers.get('CF-IPCountry');
  if (country) lines.push(`📍 ${esc(country)}`);
  lines.push(
    `🕒 ${new Date().toLocaleString('cs-CZ', { timeZone: 'Europe/Prague' })}`
  );
  return lines.join('\n');
}

function json(obj, status, headers) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json;charset=utf-8' },
  });
}
