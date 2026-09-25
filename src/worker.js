/* Точка входа для Cloudflare Workers (деплой командой `npx wrangler deploy`).
   Статику из _site отдаёт биндинг ASSETS, а /api/lead обрабатываем сами.
   Настройки — в wrangler.toml. */
import { handleLead, json } from './lead-handler.js';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/lead') {
      if (request.method === 'POST') return handleLead(request, env);
      if (request.method === 'GET') return json({ ok: true, service: 'konga-leads' }, 200);
      return json({ ok: false, error: 'method_not_allowed' }, 405);
    }

    return env.ASSETS.fetch(request);
  },
};
