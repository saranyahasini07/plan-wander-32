import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

  return `Here is a tailored **${days}-Day ${dest} Plan (${dep} → ${dest})** within your **₹${Number(
    budget
  ).toLocaleString('en-IN')}** target budget:\n\n• **Day 1 — Arrival & Sunset**: Arrive from ${dep}, check into your stay, enjoy a regional lunch, and visit the main waterfront/viewpoint at sunset.\n• **Day 2 — Signature Landmarks**: Morning heritage walk (${places}), midday courtyard cafe, and golden-hour guided activity.\n• **Day 3 — Hidden Gems & Local Flavors**: Explore uncrowded nature trails/coves in the morning and evening street-food markets.\n${
    days >= 4
      ? `• **Day ${days} — Leisure & Departure**: Slow morning breakfast, souvenir bazaar stroll, and return transfer to ${dep}.\n`
      : ''
  }\nClick **"Build Itinerary" (Step 6)** to customize times, reorder stops, or add places!`;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '2mb' }));

  // n8n Chat Trigger proxy route with automatic fallback if n8n workflow errors
  app.post('/api/n8n-chat', async (req, res) => {
    const { chatInput, sessionId, action = 'sendMessage', metadata } = req.body || {};
    const rawWebhookUrl = process.env.N8N_WEBHOOK_URL?.trim() || DEFAULT_N8N_CHAT_URL;
    const webhookUrl = rawWebhookUrl.includes('?')
      ? rawWebhookUrl
      : `${rawWebhookUrl}?action=${encodeURIComponent(action)}`;

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
        return res.json({
          output: replyText,
          source: 'n8n',
        });
      }
    } catch {
      // Fall through to Gemini / Smart Local Engine
    }

    // Fallback 1: Server-side Gemini AI
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
          return res.json({
            output: geminiRes.text,
            source: 'ai-engine',
          });
        }
      } catch {
        // Fall through to smart local engine
      }
    }

    // Fallback 2: Rich destination-aware travel response
    return res.json({
      output: buildSmartLocalTravelReply(chatInput, metadata),
      source: 'smart-engine',
    });
  });

  // Configurable n8n webhook + Server-Side Gemini Itinerary Engine
  app.post('/api/generate-itinerary', async (req, res) => {
    const payload = req.body || {};
    const {
      destination,
      departure,
      dates,
      travelers,
      budget,
      transportation,
      hotel,
      attractions,
      restaurants,
      activities,
      preferences,
      baseItinerary,
    } = payload;

    // 1. Optional n8n webhook integration if N8N_WEBHOOK_URL is configured
    const webhookUrl = process.env.N8N_WEBHOOK_URL?.trim();
    if (webhookUrl && webhookUrl.startsWith('http')) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 5500);
        const webhookRes = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            destination,
            departure,
            dates,
            travelers,
            budget,
            transportation,
            hotel,
            attractions,
            restaurants,
            activities,
            preferences,
          }),
          signal: controller.signal,
        });
        clearTimeout(timer);
        if (webhookRes.ok) {
          const webhookData = await webhookRes.json();
          if (
            webhookData &&
            typeof webhookData === 'object' &&
            webhookData.whyThisFitsYou &&
            !/error in workflow/i.test(String(webhookData.whyThisFitsYou))
          ) {
            return res.json({
              ...baseItinerary,
              ...webhookData,
              generatedBy: 'n8n-webhook',
            });
          }
        }
      } catch (err) {
        console.warn('n8n webhook unavailable, falling back to built-in AI itinerary engine:', err);
      }
    }

    // 2. Server-side Gemini personalization if GEMINI_API_KEY is available
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

        const prompt = `You are the invisible AI trip optimization engine inside "Plan & Wander".
Analyze the traveler's selections and provide a concise, specific personalization rationale ("whyThisFitsYou") and 3 concrete optimization highlights ("optimizationHighlights").

Trip Selections:
- Route: ${departure || 'Origin'} -> ${destination || 'Destination'}
- Duration: ${dates?.durationDays || 4} days (${dates?.preferredMonth || dates?.startDate || 'Flexible dates'})
- Travelers: ${travelers?.adults || 2} adults, ${travelers?.children || 0} children
- Target Budget: ₹${budget?.target || 35000} (Estimated Cost: ₹${budget?.estimated || 32000})
- Transport: ${transportation?.operator || 'Selected transit'} (${transportation?.category || 'Flight'})
- Hotel: ${hotel?.name || 'Selected stay'} (${hotel?.tier || 'Comfortable Stay'})
- Selected Attractions: ${(attractions || []).map((a: { name: string }) => a.name).join(', ') || 'Top landmarks'}
- Selected Restaurants: ${(restaurants || []).map((r: { name: string }) => r.name).join(', ') || 'Local dining'}
- Selected Activities: ${(activities || []).map((a: { name: string }) => a.name).join(', ') || 'Curated activities'}
- Travel Styles: ${(preferences?.travelStyles || []).join(', ') || 'Balanced'}
- Interests: ${(preferences?.interests || []).join(', ') || 'Sightseeing'}

Respond in JSON matching the schema.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                whyThisFitsYou: {
                  type: Type.STRING,
                  description:
                    '2-3 sentences explaining specifically why this itinerary fits their interests, travel time, and ₹ budget.',
                },
                optimizationHighlights: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description:
                    '3 short bullet strings describing how nearby places were grouped, opening hours respected, and budget balanced.',
                },
              },
              required: ['whyThisFitsYou', 'optimizationHighlights'],
            },
          },
        });

        const text = response.text;
        if (text) {
          const parsed = JSON.parse(text);
          return res.json({
            ...baseItinerary,
            whyThisFitsYou: parsed.whyThisFitsYou || baseItinerary?.whyThisFitsYou,
            optimizationHighlights:
              parsed.optimizationHighlights || baseItinerary?.optimizationHighlights,
            generatedBy: 'ai-engine',
          });
        }
      } catch (err) {
        console.warn('Gemini optimization fallback to local smart engine:', err);
      }
    }

    // 3. Always succeed with local smart itinerary generator
    return res.json({
      ...(baseItinerary || {}),
      generatedBy: 'smart-planner',
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Plan & Wander server running on http://localhost:${PORT}`);
  });
}

startServer();
