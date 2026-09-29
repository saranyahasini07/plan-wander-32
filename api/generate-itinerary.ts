import { GoogleGenAI, Type } from '@google/genai';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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

  // 1. Optional n8n webhook integration
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
        return res.status(200).json({
          ...baseItinerary,
          ...webhookData,
          generatedBy: 'n8n-webhook',
        });
      }
    } catch {
      // Fallback to Gemini or local smart itinerary
    }
  }

  // 2. Server-side Gemini personalization
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
        return res.status(200).json({
          ...baseItinerary,
          whyThisFitsYou: parsed.whyThisFitsYou || baseItinerary?.whyThisFitsYou,
          optimizationHighlights:
            parsed.optimizationHighlights || baseItinerary?.optimizationHighlights,
          generatedBy: 'ai-engine',
        });
      }
    } catch {
      // Fallback to local smart itinerary
    }
  }

  return res.status(200).json({
    ...(baseItinerary || {}),
    generatedBy: 'smart-planner',
  });
}
