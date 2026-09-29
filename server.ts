import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_N8N_CHAT_URL =
  'https://hasinisaranya07.app.n8n.cloud/webhook/58716176-6919-4926-8145-ab2512bb0d8d/chat';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '2mb' }));

  // n8n Chat Trigger proxy route
  app.post('/api/n8n-chat', async (req, res) => {
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

      return res.json({
        output: replyText || 'Message received by n8n workflow.',
      });
    } catch (err: any) {
      return res.status(502).json({
        error: err?.message || 'Failed to connect to n8n chat webhook',
      });
    }
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
        });
        if (webhookRes.ok) {
          const webhookData = await webhookRes.json();
          return res.json({
            ...baseItinerary,
            ...webhookData,
            generatedBy: 'n8n-webhook',
          });
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
