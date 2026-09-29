import React, { useState, useRef, useEffect } from 'react';
import { Destination, TripState } from '../types/travel';
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
      text: `Hi! I'm your Plan & Wander Travel Assistant powered by n8n. Ask me anything about ${destination.name}, routes from ${trip.departureCity || 'your city'}, hidden gems, hotels, or itinerary ideas!`,
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

    const enrichedInput = includeTripContext
      ? `${textToSend}\n\n[Current Trip Context: ${trip.departureCity || 'Visakhapatnam'} -> ${destination.name}, ${trip.durationDays} days, ${trip.adults} adults, Target Budget: ₹${trip.targetBudget}, Selected Stay: ${trip.selectedHotel?.name || 'None'}, Selected Places: ${trip.selectedPlaces.map((p) => p.name).join(', ') || 'None'}]`
      : textToSend;

    const payload = {
      action: 'sendMessage',
      sessionId,
      chatInput: enrichedInput,
      metadata: {
        destination: destination.name,
        departureCity: trip.departureCity,
        durationDays: trip.durationDays,
        targetBudget: trip.targetBudget,
      },
    };

    let replyText = '';

    try {
      // 1. Try server-side proxy first to avoid any browser CORS issues
      const proxyRes = await fetch('/api/n8n-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (proxyRes.ok) {
        const data = await proxyRes.json();
        replyText = data.output || '';
      } else {
        throw new Error(`Proxy status ${proxyRes.status}`);
      }
    } catch {
      // 2. Fallback: Direct browser POST to n8n Chat Trigger webhook URL
      try {
        const directRes = await fetch(N8N_WEBHOOK_CHAT_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json, text/plain, */*',
          },
          body: JSON.stringify(payload),
        });

        const rawText = await directRes.text();
        try {
          const parsed = JSON.parse(rawText);
          if (typeof parsed === 'string') {
            replyText = parsed;
          } else if (Array.isArray(parsed) && parsed.length > 0) {
            replyText =
              parsed[0]?.output ||
              parsed[0]?.text ||
              parsed[0]?.response ||
              parsed[0]?.message ||
              JSON.stringify(parsed[0]);
          } else if (parsed && typeof parsed === 'object') {
            replyText =
              parsed.output ||
              parsed.text ||
              parsed.response ||
              parsed.message ||
              parsed.reply ||
              '';
          }
        } catch {
          replyText = rawText;
        }
      } catch {
        replyText =
          'Could not reach the n8n workflow right now. Please verify that your n8n cloud workflow is active.';
      }
    }

    const botMsg: ChatMessage = {
      id: `bot-${Date.now()}`,
      role: 'assistant',
      text:
        replyText?.trim() ||
        'Received response from n8n workflow. Let me know how else I can help plan your trip!',
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
                Connected to n8n Agent · {destination.name}
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
