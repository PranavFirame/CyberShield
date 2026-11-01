"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Shield, Sparkles, Trash2, ExternalLink, Bot, User, Loader2 } from "lucide-react";

interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: string;
}

const SUGGESTED_QUESTIONS = [
  "How does repository scanning work?",
  "What is Novel Bug Discovery & AST taint?",
  "How is the worst-case disaster risk calculated?",
  "How do I audit my GitHub repos with 1-click?",
];

export default function SupportChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      sender: "bot",
      text: "👋 Hello! I am your CyberShield Security Assistant. How can I help you understand your repository audits, AST novel bug findings, or worst-case disaster models today?",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  async function handleSend(textToSend?: string) {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: "usr_" + Date.now(),
      sender: "user",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/support/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reach support assistant");

      const botMsg: ChatMessage = {
        id: "bot_" + Date.now(),
        sender: "bot",
        text: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: "err_" + Date.now(),
          sender: "bot",
          text: "I am having trouble connecting to the support service right now. Please email our human team directly at support@cybershield.dev.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleClear() {
    setMessages([
      {
        id: "welcome_reset",
        sender: "bot",
        text: "Conversation cleared. How can I help you today?",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  }

  return (
    <div className="fixed bottom-3 right-3 sm:bottom-5 sm:right-5 z-50">
      {/* Floating Launcher Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="relative h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-slate-900 hover:bg-slate-800 text-white shadow-xl hover:shadow-2xl transition-all duration-200 flex items-center justify-center cursor-pointer group hover:scale-105"
          title="Open CyberShield Support Assistant"
          aria-label="Open CyberShield Support Assistant"
        >
          <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-white animate-pulse" />
          <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6 text-sky-400 group-hover:scale-110 transition-transform" />
        </button>
      )}

      {/* Expandable Chat Window */}
      {isOpen && (
        <div className="w-[calc(100vw-24px)] sm:w-[400px] md:w-[420px] max-w-[420px] h-[500px] sm:h-[540px] max-h-[82vh] sm:max-h-[85vh] bg-white border border-slate-200 rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-sky-600/30 border border-sky-400/40 text-sky-300 flex items-center justify-center shadow-xs">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-bold text-white">CyberShield Assistant</h4>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </div>
                <p className="text-[10px] text-slate-400">Defensive Knowledge & Support</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleClear}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/80 transition cursor-pointer"
                title="Clear conversation"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/80 transition cursor-pointer"
                title="Close chat"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/50 text-xs">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2 ${m.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.sender === "bot" && (
                  <div className="h-6 w-6 rounded-full bg-sky-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    <Shield className="h-3 w-3" />
                  </div>
                )}

                <div
                  className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 shadow-2xs ${
                    m.sender === "user"
                      ? "bg-slate-900 text-white rounded-br-xs"
                      : "bg-white border border-slate-200 text-slate-800 rounded-bl-xs leading-relaxed"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.text}</p>
                  <span
                    className={`block text-[9px] mt-1 text-right ${
                      m.sender === "user" ? "text-slate-400" : "text-slate-400"
                    }`}
                  >
                    {m.timestamp}
                  </span>
                </div>

                {m.sender === "user" && (
                  <div className="h-6 w-6 rounded-full bg-slate-700 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <User className="h-3 w-3" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-slate-500 text-xs py-1">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-sky-600" />
                <span className="italic text-[11px]">Assistant is researching documentation...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Quick Questions */}
          {messages.length <= 3 && (
            <div className="px-3 py-2 bg-white border-t border-slate-100 flex flex-wrap gap-1.5">
              {SUGGESTED_QUESTIONS.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(q)}
                  disabled={loading}
                  className="text-[10px] font-medium px-2.5 py-1 rounded-lg bg-sky-50 text-sky-800 hover:bg-sky-100 border border-sky-100 transition text-left cursor-pointer disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about scans, AST analysis, or risk..."
              disabled={loading}
              className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="h-8 w-8 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white flex items-center justify-center transition cursor-pointer shrink-0 shadow-xs"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>

          {/* Bottom Footer Note */}
          <div className="px-3 py-1.5 bg-slate-100 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-500">
            <span>Grounded in CyberShield specs</span>
            <a
              href="mailto:support@cybershield.dev"
              className="text-sky-600 hover:underline flex items-center gap-0.5"
            >
              Email Support <ExternalLink className="h-2.5 w-2.5" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
