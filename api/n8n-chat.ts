import { GoogleGenAI } from '@google/genai';

const DEFAULT_N8N_CHAT_URL =
  'https://hasinisaranya07.app.n8n.cloud/webhook/58716176-6919-4926-8145-ab2512bb0d8d/chat';

function isN8nErrorResponse(statusOk: boolean, text: string): boolean {
  if (!statusOk) return true;
  const trimmed = (text || '').trim();
  if (!trimmed) return true;
  return /^(error in workflow|problem running workflow|workflow could not be started|internal server error|error:)/i.test(
    trimmed
  );
}

function buildSmartLocalTravelReply(chatInput: string, metadata: any): string {
  const dest = metadata?.destination || 'Goa';
  const dep = metadata?.departureCity || 'Visakhapatnam';
  const days = metadata?.durationDays || 4;
  const budget = metadata?.targetBudget || 35000;
  const hotels = metadata?.hotelsSummary || 'curated boutique stays (₹1,450–₹18,500/night)';
  const places =
    metadata?.placesSummary ||
    'top coastal/heritage landmarks and uncrowded hidden gems';
  const transport =
    metadata?.transportSummary ||
    `direct & connecting Flights, Express Trains, and AC Sleeper Buses from ${dep} to ${dest}`;

  const q = (chatInput || '').toLowerCase();

  if (q.includes('hidden gem') || q.includes('secret') || q.includes('less crowded')) {
    return `Here are the top **Hidden Gems in ${dest}** for your ${days}-day trip:\n\n• **Uncrowded Local Sanctuaries**: ${places}\n• **Best Timing**: Visit between 7:30 AM – 10:00 AM or 4:30 PM – 6:30 PM for golden light and minimal crowds.\n• **Tip**: Open **Step 4 (Discover Places → Hidden Gems Only)** in the planner to add these directly to your My Trip basket.`;
  }

  if (
    q.includes('flight') ||
    q.includes('train') ||
    q.includes('bus') ||
    q.includes('transport') ||
    q.includes('how to reach') ||
    q.includes('travel from')
  ) {
    return `For your route **${dep} → ${dest}**, here are the best transportation options:\n\n• **Available Options**: ${transport}\n• **Fastest**: Morning Non-Stop Flight (saves maximum sightseeing time on Day 1).\n• **Most Economical**: Overnight Express Train (3AC/2AC) or Multi-Axle AC Sleeper Bus.\n• **Local Mobility**: Rent a scooter/bike (~₹550/day) or book a full-day AC sightseeing cab (~₹2,200/day) in **Step 2 (Compare Transport)**.`;
  }

  if (q.includes('hotel') || q.includes('stay') || q.includes('resort') || q.includes('where to stay')) {
    return `Recommended stays in **${dest}** for your ₹${Number(budget).toLocaleString('en-IN')} target budget:\n\n• **Budget Stay (₹1,000–₹3,000/n)**: Clean hostels & family homestays with breakfast.\n• **Comfortable Stay (₹3,000–₹7,000/n)**: Boutique hotels with pool & central access (${hotels}).\n• **Premium & Luxury (₹7,000+/n)**: Heritage villas & horizon pool resorts.\n\nYou can compare all 8 properties and check demo availability in **Step 3 (Pick Your Stay)**.`;
  }

  if (q.includes('budget') || q.includes('cost') || q.includes('price') || q.includes('cheap')) {
    return `Here is a smart budget breakdown for **${dep} → ${dest} (${days} Days, Target: ₹${Number(
      budget
    ).toLocaleString('en-IN')})**:\n\n• **Transportation**: ~25–30% of budget (choose train or early saver flight to save ₹3,500+).\n• **Stay (${Math.max(1, days - 1)} nights)**: ~35% of budget.\n• **Food & Local Experiences**: ~25% of budget (mix regional thalis/cafes with 1 fine dining evening).\n• **Buffer**: ~10%.\n\nGo to **Step 5 (Budget & Map)** to see live progress bars and one-click cost-saving swaps.`;
  }

  // Default comprehensive itinerary & planning reply
  return `Here is a tailored **${days}-Day ${dest} Plan (${dep} → ${dest})** within your **₹${Number(
    budget
  ).toLocaleString('en-IN')}** target budget:\n\n• **Day 1 — Arrival & Sunset**: Arrive from ${dep}, check into your stay, enjoy a regional lunch, and visit the main waterfront/viewpoint at sunset.\n• **Day 2 — Signature Landmarks**: Morning heritage walk (${places}), midday courtyard cafe, and golden-hour guided activity.\n• **Day 3 — Hidden Gems & Local Flavors**: Explore uncrowded nature trails/coves in the morning and evening street-food markets.\n${
    days >= 4
      ? `• **Day ${days} — Leisure & Departure**: Slow morning breakfast, souvenir bazaar stroll, and return transfer to ${dep}.\n`
      : ''
  }\nClick **"Build Itinerary" (Step 6)** to customize times, reorder stops, or add places!`;
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { chatInput, sessionId, action = 'sendMessage', metadata } = req.body || {};
  const rawWebhookUrl = process.env.N8N_WEBHOOK_URL?.trim() || DEFAULT_N8N_CHAT_URL;
  const webhookUrl = rawWebhookUrl.includes('?')
    ? rawWebhookUrl
    : `${rawWebhookUrl}?action=${encodeURIComponent(action)}`;

  // 1. Try n8n Webhook with a 6-second timeout
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);

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
      }),
      signal: controller.signal,
    });

    clearTimeout(timer);
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
          '';
      } else if (data && typeof data === 'object') {
        replyText =
          data.output ||
          data.text ||
          data.response ||
          data.reply ||
          (data.data && (data.data.output || data.data.text)) ||
          (response.ok ? data.message : '') ||
          '';
      }
    } catch {
      replyText = response.ok ? rawText : '';
    }

    if (!isN8nErrorResponse(response.ok, replyText)) {
      return res.status(200).json({
        output: replyText,
        source: 'n8n',
      });
    }
  } catch {
    // n8n workflow errored or timed out -> proceed to Gemini / Smart Fallback
  }

  // 2. Fallback to Server-Side Gemini AI if GEMINI_API_KEY is available
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey && apiKey !== 'MY_GEMINI_API_KEY' && apiKey.trim().length > 5) {
    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const prompt = `You are the Plan & Wander Travel Assistant helping a traveler build their trip.
Current Trip Context:
- Departure: ${metadata?.departureCity || 'Visakhapatnam'}
- Destination: ${metadata?.destination || 'Goa'}
- Duration: ${metadata?.durationDays || 4} days
- Target Budget: ₹${metadata?.targetBudget || 35000}
- Selected Stay: ${metadata?.hotelsSummary || 'Not selected yet'}
- Selected Places: ${metadata?.placesSummary || 'Exploring options'}

Traveler Question: ${chatInput}

Provide a helpful, concise, practical travel response with concrete recommendations and ₹ estimates where relevant.`;

      const geminiRes = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
      });

      if (geminiRes.text) {
        return res.status(200).json({
          output: geminiRes.text,
          source: 'ai-engine',
        });
      }
    } catch {
      // Proceed to deterministic smart travel engine
    }
  }

  // 3. Always succeed with rich destination-aware travel response
  return res.status(200).json({
    output: buildSmartLocalTravelReply(chatInput, metadata),
    source: 'smart-engine',
  });
}
