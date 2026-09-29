import React, { useState, useRef, useEffect } from 'react';
import { Destination, TripState } from '../types/travel';
import {
  getActivitiesForDestination,
  getHotelsForDestination,
  getPlacesForDestination,
  getRestaurantsForDestination,
  getTransportOptionsForRoute,
} from '../data/destinations';
import { MessageSquare, X, Send, RotateCcw, Minimize2 } from 'lucide-react';

const N8N_WEBHOOK_CHAT_URL =
  'https://hasinisaranya07.app.n8n.cloud/webhook/58716176-6919-4926-8145-ab2512bb0d8d/chat';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

interface N8nChatbotProps {
  trip: TripState;
  destination: Destination;
}

function getOrCreateSessionId(): string {
  try {
    const existing = sessionStorage.getItem('pw_n8n_chat_session_id');
    if (existing) return existing;
    const created = `pw-session-${Math.random().toString(36).substring(2, 10)}-${Date.now()}`;
    sessionStorage.setItem('pw_n8n_chat_session_id', created);
    return created;
  } catch {
    return `pw-session-${Date.now()}`;
  }
}

function isErrorWorkflowText(statusOk: boolean, text: string): boolean {
  if (!statusOk) return true;
  const trimmed = (text || '').trim();
  if (!trimmed) return true;
  return /^(error in workflow|problem running workflow|workflow could not be started|internal server error|error:)/i.test(
    trimmed
  );
}

function generateClientCatalogReply(
  question: string,
  trip: TripState,
  destination: Destination
): string {
  const q = question.toLowerCase();
  const dep = trip.departureCity || 'Visakhapatnam';
  const places = getPlacesForDestination(destination);
  const gems = places.filter((p) => p.isHiddenGem);
  const popular = places.filter((p) => !p.isHiddenGem);
  const hotels = getHotelsForDestination(destination);
  const restaurants = getRestaurantsForDestination(destination);
  const activities = getActivitiesForDestination(destination);
  const transports = getTransportOptionsForRoute(dep, destination);

  if (q.includes('hidden gem') || q.includes('secret') || q.includes('less crowded')) {
    const gemLines = gems
      .map(
        (g) =>
          `• ${g.name} (${g.entryFee === 0 ? 'Free Entry' : `₹${g.entryFee}`} · Best time: ${
            g.bestTimeToVisit
          }) — ${g.shortDescription}`
      )
      .join('\n');
    return `Here are the top Hidden Gems in ${destination.name}:\n\n${gemLines}\n\nYou can add any of these to your My Trip basket in Step 4 (Discover Places).`;
  }

  if (
    q.includes('flight') ||
    q.includes('train') ||
    q.includes('bus') ||
    q.includes('transport') ||
    q.includes('travel from') ||
    q.includes('reach')
  ) {
    const topTrans = transports
      .slice(0, 4)
      .map(
        (t) =>
          `• ${t.category}: ${t.operator} (${t.departureTime} → ${t.arrivalTime}, ${
            t.durationLabel
          }) — ₹${t.price.toLocaleString('en-IN')}/person`
      )
      .join('\n');
    return `Best ways to travel for ${dep} → ${destination.name}:\n\n${topTrans}\n\nCompare and select your preferred option in Step 2 (Compare Transport).`;
  }

  if (q.includes('hotel') || q.includes('stay') || q.includes('resort') || q.includes('room')) {
    const topHotels = hotels
      .slice(0, 4)
      .map(
        (h) =>
          `• ${h.name} (${h.tier}) — ₹${h.pricePerNight.toLocaleString('en-IN')}/night · ★ ${h.rating.toFixed(
            1
          )}`
      )
      .join('\n');
    return `Top stays in ${destination.name} across budget tiers:\n\n${topHotels}\n\nView full details and select your stay in Step 3 (Pick Your Stay).`;
  }

  if (q.includes('food') || q.includes('restaurant') || q.includes('eat') || q.includes('cafe') || q.includes('dinner')) {
    const topFood = restaurants
      .slice(0, 4)
      .map(
        (r) =>
          `• ${r.name} (${r.category} · ${r.cuisine}) — ~₹${r.averageCostPerPerson}/person · Try: ${r.signatureDish}`
      )
      .join('\n');
    return `Must-try dining spots in ${destination.name}:\n\n${topFood}`;
  }

  if (q.includes('weather') || q.includes('best time') || q.includes('season') || q.includes('month')) {
    return `Seasonal guide for ${destination.name}:\n\n• Best Months: ${destination.seasonal.bestMonths}\n• Temperature: ${destination.seasonal.temperatureRange}\n• Weather: ${destination.seasonal.weatherSummary}\n• Savings Tip: ${destination.seasonal.priceDifferenceNote}`;
  }

  // Default: Multi-day itinerary summary using real destination places & activities
  return `Here is a recommended ${trip.durationDays}-Day plan for ${dep} → ${
    destination.name
  } (Target budget: ₹${trip.targetBudget.toLocaleString('en-IN')}):\n\n• Day 1: Arrive from ${dep}, check into ${
    trip.selectedHotel?.name || hotels[2]?.name
  }, lunch at ${restaurants[0]?.name}, and sunset at ${popular[0]?.name}.\n• Day 2: Morning visit to ${
    popular[1]?.name
  }, afternoon at ${popular[2]?.name}, and ${activities[0]?.name}.\n• Day 3: Discover hidden gems including ${
    gems[0]?.name
  } and ${gems[1]?.name}, followed by dinner at ${restaurants[2]?.name}.\n${
    trip.durationDays >= 4
      ? `• Day ${trip.durationDays}: Morning ${activities[1]?.name}, local market shopping, and return journey to ${dep}.`
      : ''
  }`;
}

export const N8nChatbot: React.FC<N8nChatbotProps> = ({ trip, destination }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string>(() => getOrCreateSessionId());
  const [includeTripContext, setIncludeTripContext] = useState(true);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      text: `Hi! I'm your Plan & Wander Travel Assistant. Ask me anything about ${destination.name}, routes from ${trip.departureCity || 'your city'}, hidden gems, hotels, or itinerary ideas!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const sendMessage = async (rawMessageText?: string) => {
    const textToSend = (rawMessageText ?? input).trim();
    if (!textToSend || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!rawMessageText) setInput('');
    setIsLoading(true);

    const destPlaces = getPlacesForDestination(destination);
    const destHotels = getHotelsForDestination(destination);
    const destTransports = getTransportOptionsForRoute(trip.departureCity, destination);

    const payload = {
      action: 'sendMessage',
      sessionId,
      chatInput: textToSend,
      metadata: {
        destination: destination.name,
        departureCity: trip.departureCity || 'Visakhapatnam',
        durationDays: trip.durationDays,
        targetBudget: trip.targetBudget,
        includeTripContext,
        hotelsSummary:
          trip.selectedHotel?.name ||
          destHotels
            .slice(0, 3)
            .map((h) => `${h.name} (₹${h.pricePerNight}/n)`)
            .join(', '),
        placesSummary:
          trip.selectedPlaces.length > 0
            ? trip.selectedPlaces.map((p) => p.name).join(', ')
            : destPlaces
                .slice(0, 5)
                .map((p) => p.name)
                .join(', '),
        transportSummary: destTransports
          .slice(0, 3)
          .map((t) => `${t.category}: ${t.operator} (₹${t.price})`)
          .join(', '),
      },
    };

    let replyText = '';

    try {
      // 1. Call backend /api/n8n-chat (which tries n8n webhook -> Gemini AI -> smart fallback)
      const proxyRes = await fetch('/api/n8n-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (proxyRes.ok) {
        const data = await proxyRes.json();
        if (data?.output && !isErrorWorkflowText(true, data.output)) {
          replyText = data.output;
        }
      }
    } catch {
      // Proceed to direct webhook or client fallback
    }

    if (!replyText) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 5500);
        const directRes = await fetch(`${N8N_WEBHOOK_CHAT_URL}?action=sendMessage`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json, text/plain, */*',
          },
          body: JSON.stringify({
            action: 'sendMessage',
            sessionId,
            chatInput: textToSend,
          }),
          signal: controller.signal,
        });
        clearTimeout(timer);

        const rawText = await directRes.text();
        let candidate = '';
        try {
          const parsed = JSON.parse(rawText);
          if (typeof parsed === 'string') {
            candidate = parsed;
          } else if (Array.isArray(parsed) && parsed.length > 0) {
            candidate =
              parsed[0]?.output ||
              parsed[0]?.text ||
              parsed[0]?.response ||
              parsed[0]?.message ||
              '';
          } else if (parsed && typeof parsed === 'object') {
            candidate =
              parsed.output ||
              parsed.text ||
              parsed.response ||
              parsed.reply ||
              (directRes.ok ? parsed.message : '') ||
              '';
          }
        } catch {
          candidate = directRes.ok ? rawText : '';
        }

        if (!isErrorWorkflowText(directRes.ok, candidate)) {
          replyText = candidate;
        }
      } catch {
        // Use local catalog responder below
      }
    }

    if (!replyText) {
      replyText = generateClientCatalogReply(textToSend, trip, destination);
    }

    const botMsg: ChatMessage = {
      id: `bot-${Date.now()}`,
      role: 'assistant',
      text: replyText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, botMsg]);
    setIsLoading(false);
  };

  const handleResetSession = () => {
    const newId = `pw-session-${Math.random().toString(36).substring(2, 10)}-${Date.now()}`;
    try {
      sessionStorage.setItem('pw_n8n_chat_session_id', newId);
    } catch {
      // ignore
    }
    setSessionId(newId);
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        text: `Started a fresh conversation for ${trip.departureCity || 'Visakhapatnam'} → ${destination.name}. How can I help with your travel plans?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const quickPrompts = [
    `Suggest a ${trip.durationDays}-day plan for ${destination.name}`,
    `Best hidden gems in ${destination.name}`,
    `How to travel from ${trip.departureCity || 'Visakhapatnam'} to ${destination.name}?`,
  ];

  return (
    <div className="fixed right-5 bottom-5 z-50">
      {/* Chat Window */}
      {isOpen && (
        <div className="mb-3 flex h-[520px] max-h-[80vh] w-[360px] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden border border-slate-200 bg-[#FBFBF9] shadow-2xl sm:w-[400px]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-4 py-3.5 text-white">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <span className="font-display text-sm font-semibold">
                  Plan &amp; Wander Chat
                </span>
              </div>
              <div className="text-[11px] text-slate-300">
                AI Travel Concierge · {destination.name}
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleResetSession}
                title="New chat session"
                className="rounded p-1.5 text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Minimize chat"
                className="rounded p-1.5 text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                <Minimize2 className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close chat"
                className="rounded p-1.5 text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Context Bar */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2 text-[11px] text-slate-600">
            <span className="truncate">
              Route: <strong>{trip.departureCity || 'Visakhapatnam'}</strong> →{' '}
              <strong>{destination.name}</strong>
            </span>
            <label className="flex cursor-pointer items-center gap-1.5 whitespace-nowrap">
              <input
                type="checkbox"
                checked={includeTripContext}
                onChange={(e) => setIncludeTripContext(e.target.checked)}
                className="rounded border-slate-300 text-teal-700 focus:ring-teal-700"
              />
              <span>Share trip context</span>
            </label>
          </div>

          {/* Messages List */}
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-teal-700 text-white'
                      : 'border border-slate-200 bg-white text-slate-800'
                  }`}
                >
                  {msg.text}
                </div>
                <span className="mt-1 font-mono text-[10px] text-slate-400">
                  {msg.timestamp}
                </span>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-start">
                <div className="rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-500">
                  Thinking...
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Starter Prompts */}
          <div className="border-t border-slate-200 bg-white px-3 py-2">
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {quickPrompts.map((qp) => (
                <button
                  key={qp}
                  type="button"
                  onClick={() => sendMessage(qp)}
                  disabled={isLoading}
                  className="shrink-0 rounded border border-slate-200 bg-[#FBFBF9] px-2.5 py-1 text-[11px] text-slate-700 hover:border-teal-700 hover:text-teal-800 disabled:opacity-50"
                >
                  {qp}
                </button>
              ))}
            </div>
          </div>

          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="flex items-center gap-2 border-t border-slate-200 bg-white p-3"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Ask about ${destination.name}...`}
              className="flex-1 rounded-lg border border-slate-300 bg-[#FBFBF9] px-3 py-2 text-xs text-slate-900 focus:border-teal-700 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              aria-label="Send message"
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-700 text-white transition-colors hover:bg-teal-800 disabled:opacity-40"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      )}

      {/* Floating Toggle Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 rounded-full bg-teal-700 px-4 py-3 text-xs font-semibold text-white shadow-lg transition-transform hover:scale-[1.02] hover:bg-teal-800"
      >
        {isOpen ? (
          <>
            <X className="h-4 w-4" />
            <span>Close Chat</span>
          </>
        ) : (
          <>
            <MessageSquare className="h-4 w-4" />
            <span>Ask Travel AI</span>
          </>
        )}
      </button>
    </div>
  );
};
