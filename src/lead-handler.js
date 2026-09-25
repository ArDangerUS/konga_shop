/**
 * Konga Kratom — приём заявки и отправка в Telegram.
 * Общее ядро: его зовут и Worker (src/worker.js), и Pages Function
 * (functions/api/lead.js). Токен бота сюда приходит из переменных
 * окружения хостинга, в коде его нет.
 *
 *   BOT_TOKEN  (Secret) — токен от @BotFather
 *   CHAT_ID    (Secret) — id чата. Несколько — через запятую: 111,222
 */

const MAX_BODY = 8 * 1024;

export async function handleLead(request, env) {
  if (!env.BOT_TOKEN || !env.CHAT_ID) {
    return json({ ok: false, error: 'not_configured' }, 500);
  }

  let data;
  try {
    const raw = await request.text();
    if (raw.length > MAX_BODY) return json({ ok: false, error: 'too_large' }, 413);
    data = JSON.parse(raw);
  } catch {
    return json({ ok: false, error: 'bad_json' }, 400);
  }

  // honeypot — молча делаем вид, что всё хорошо
  if (data.website) return json({ ok: true }, 200);

  const name = clean(data.name, 120);
  const phone = clean(data.phone, 40);
  if (name.length < 2 || phone.replace(/\D/g, '').length < 9) {
    return json({ ok: false, error: 'validation' }, 400);
  }

  const text = buildMessage({ ...data, name, phone }, request);
  const chatIds = String(env.CHAT_ID).split(',').map((s) => s.trim()).filter(Boolean);
  const results = await Promise.all(chatIds.map((id) => sendTelegram(env.BOT_TOKEN, id, text)));

  const delivered = results.filter((r) => r.ok).length;
  results.forEach((r, i) => {
    if (!r.ok) console.log('telegram error for', chatIds[i], JSON.stringify(r));
  });

  // хотя бы один получатель — заявка не потеряна, посетителю показываем успех
  if (!delivered) return json({ ok: false, error: 'telegram_failed' }, 502);
  return json({ ok: true, delivered, of: chatIds.length }, 200);
}

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
  lines.push(`🕒 ${new Date().toLocaleString('cs-CZ', { timeZone: 'Europe/Prague' })}`);
  return lines.join('\n');
}

export function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json;charset=utf-8' },
  });
}
