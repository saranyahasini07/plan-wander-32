const DEFAULT_N8N_CHAT_URL =
  'https://hasinisaranya07.app.n8n.cloud/webhook/58716176-6919-4926-8145-ab2512bb0d8d/chat';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { chatInput, sessionId, action = 'sendMessage', metadata } = req.body || {};
  const webhookUrl = process.env.N8N_WEBHOOK_URL?.trim() || DEFAULT_N8N_CHAT_URL;

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/plain, */*',
      },
      body: JSON.stringify({
        action,
        sessionId: sessionId || 'pw-session-default',
        chatInput: chatInput || '',
        metadata: metadata || {},
      }),
    });

    const rawText = await response.text();
    let replyText = '';

    try {
      const data = JSON.parse(rawText);
      if (typeof data === 'string') {
        replyText = data;
      } else if (Array.isArray(data) && data.length > 0) {
        const first = data[0];
        replyText =
          first?.output ||
          first?.text ||
          first?.response ||
          first?.message ||
          JSON.stringify(first);
      } else if (data && typeof data === 'object') {
        replyText =
          data.output ||
          data.text ||
          data.response ||
          data.message ||
          data.reply ||
          (data.data && (data.data.output || data.data.text)) ||
          '';
      }
    } catch {
      replyText = rawText;
    }

    if (!response.ok && !replyText) {
      return res.status(response.status).json({
        error: `Webhook returned HTTP ${response.status}`,
      });
    }

    return res.status(200).json({
      output: replyText || 'Message received by n8n workflow.',
    });
  } catch (err: any) {
    return res.status(502).json({
      error: err?.message || 'Failed to connect to n8n chat webhook',
    });
  }
}
