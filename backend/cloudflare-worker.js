/**
 * Konga Kratom — приём заявок с лендинга и отправка в Telegram.
 * Cloudflare Worker (бесплатный план: 100 000 запросов в день).
 *
 * Переменные окружения (Settings → Variables and Secrets):
 *   BOT_TOKEN        (Secret) — токен от @BotFather
 *   CHAT_ID          (Secret) — id чата/группы, куда падают заявки
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

    const tg = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: env.CHAT_ID,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });

    const result = await tg.json().catch(() => ({ ok: false }));
    if (!result.ok) {
      console.log('telegram error', JSON.stringify(result));
      return json({ ok: false, error: 'telegram_failed' }, 502, cors);
    }
    return json({ ok: true }, 200, cors);
  },
};

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
    `🏷 <b>Sleva:</b> ${esc(d.discount || 15)} %`,
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
