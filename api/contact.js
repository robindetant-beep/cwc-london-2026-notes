// Vercel serverless function — Contact form handler
// POST /api/contact { name, email, topic, message, hp } -> sends email via Resend
// Required env vars:
//   RESEND_API_KEY  — Resend API key
//   CONTACT_TO      — destination email (default: robin.detant@sagora.eu)
//   CONTACT_FROM    — sender (default: "CwC Recap <noreply@sagora.eu>")

export default async function handler(req, res) {
  // CORS (same-origin in prod, but safe defaults)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    // Parse body (Vercel auto-parses JSON, but be defensive)
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { name, email, phone, topic, message, hp } = body;

    // Honeypot: bots fill hidden fields; humans don't
    if (hp && hp.trim() !== '') {
      // Silently accept to not tip off the bot
      return res.status(200).json({ ok: true });
    }

    // Validation
    const errors = [];
    if (!name || typeof name !== 'string' || name.trim().length < 2) errors.push('name');
    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('email');
    if (!message || typeof message !== 'string' || message.trim().length < 10) errors.push('message');
    if (errors.length) {
      return res.status(400).json({ ok: false, error: 'invalid_fields', fields: errors });
    }

    // Length caps to prevent abuse
    const safe = {
      name: name.trim().slice(0, 120),
      email: email.trim().slice(0, 200),
      phone: (phone || '').toString().trim().slice(0, 40),
      topic: (topic || 'Question').toString().trim().slice(0, 200),
      message: message.trim().slice(0, 8000),
    };

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error('Missing RESEND_API_KEY env var');
      return res.status(500).json({ ok: false, error: 'config_missing' });
    }

    const to = process.env.CONTACT_TO || 'robin.detant@sagora.eu';
    const from = process.env.CONTACT_FROM || 'CwC Recap <noreply@sagora.eu>';

    // Build email content
    const subject = `[CwC Recap] ${safe.topic}`;
    const referer = req.headers['referer'] || req.headers['referrer'] || 'direct';
    const ua = req.headers['user-agent'] || 'unknown';

    const textLines = [
      safe.message,
      '',
      '---',
      `De : ${safe.name} <${safe.email}>`,
    ];
    if (safe.phone) textLines.push(`Tel : ${safe.phone}`);
    textLines.push(`Sujet : ${safe.topic}`);
    textLines.push(`Source : ${referer}`);
    textLines.push(`UA : ${ua}`);
    const text = textLines.join('\n');

    const escapeHtml = (s) => String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

    const html = `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1a1915;max-width:560px;">
        <div style="border-left:3px solid #cc785c;padding-left:14px;margin-bottom:18px;">
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#888;margin-bottom:4px;">Nouveau contact · CwC Recap</div>
          <div style="font-size:18px;font-weight:600;color:#1a1915;">${escapeHtml(safe.name)}</div>
          <div style="font-size:13px;color:#666;"><a href="mailto:${escapeHtml(safe.email)}" style="color:#cc785c;">${escapeHtml(safe.email)}</a></div>
          ${safe.phone ? `<div style="font-size:13px;color:#666;margin-top:2px;">Tel : <a href="tel:${escapeHtml(safe.phone.replace(/[^+0-9]/g,''))}" style="color:#cc785c;">${escapeHtml(safe.phone)}</a></div>` : ''}
        </div>
        <div style="font-size:12px;text-transform:uppercase;letter-spacing:0.06em;color:#888;margin-bottom:6px;">Sujet</div>
        <div style="font-size:15px;margin-bottom:18px;">${escapeHtml(safe.topic)}</div>
        <div style="font-size:12px;text-transform:uppercase;letter-spacing:0.06em;color:#888;margin-bottom:6px;">Message</div>
        <div style="font-size:14px;line-height:1.55;white-space:pre-wrap;background:#faf9f6;border:1px solid #e6e3dc;border-radius:8px;padding:14px 16px;">${escapeHtml(safe.message)}</div>
        <hr style="border:0;border-top:1px solid #e6e3dc;margin:24px 0 12px;">
        <div style="font-size:11px;color:#999;">
          Envoyé depuis <a href="${escapeHtml(referer)}" style="color:#999;">le recap CwC London</a>.<br>
          Réponds directement à ce mail pour répondre à ${escapeHtml(safe.name)}.
        </div>
      </div>
    `;

    // Call Resend
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: safe.email,
        subject,
        text,
        html,
      }),
    });

    if (!resp.ok) {
      const err = await resp.text();
      console.error('Resend error:', resp.status, err);
      return res.status(502).json({ ok: false, error: 'send_failed' });
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('Contact handler error:', e);
    return res.status(500).json({ ok: false, error: 'unexpected' });
  }
}
