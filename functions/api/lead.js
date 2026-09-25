/* Cloudflare Pages Function: /api/lead. Вся логика — в src/lead-handler.js,
   тот же код использует и Worker (src/worker.js). */
import { handleLead, json } from '../../src/lead-handler.js';

export const onRequestPost = ({ request, env }) => handleLead(request, env);
export const onRequestGet = () => json({ ok: true, service: 'konga-leads' }, 200);
