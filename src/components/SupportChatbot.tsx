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
    <div className="fixed bottom-5 right-5 z-50">
      {/* Floating Launcher Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="relative h-14 w-14 rounded-full bg-[#F09E4F] hover:bg-[#E08E3F] text-slate-950 shadow-lg shadow-[rgba(240,158,79,0.3)] hover:shadow-[0_0_24px_rgba(240,158,79,0.45)] transition-all duration-200 flex items-center justify-center cursor-pointer group hover:scale-105"
          title="Open CyberShield Support Assistant"
        >
          <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-[#64D771] border-2 border-[#0A0D14] animate-pulse" />
          <MessageSquare className="h-6 w-6 text-slate-950 group-hover:scale-110 transition-transform" />
        </button>
      )}

      {/* Expandable Chat Window */}
      {isOpen && (
        <div className="w-[360px] sm:w-[420px] h-[540px] max-h-[85vh] vault-card bg-[#0A0D14]/95 border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="bg-[#0E1017] text-white px-5 py-3.5 flex items-center justify-between border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-full bg-[#F09E4F]/15 border border-[#F09E4F]/30 text-[#F09E4F] flex items-center justify-center shadow-xs">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-bold text-white">CyberShield Assistant</h4>
                  <span className="h-2 w-2 rounded-full bg-[#64D771] animate-pulse" />
                </div>
                <p className="text-[10px] text-slate-400 font-mono">Defensive AST AI Knowledge</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleClear}
                className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-white/5 transition cursor-pointer"
                title="Clear conversation"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-white/5 transition cursor-pointer"
                title="Close chat"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[#0A0D14]/90 text-xs">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2 ${m.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.sender === "bot" && (
                  <div className="h-6 w-6 rounded-full bg-[#F09E4F]/20 text-[#F09E4F] border border-[#F09E4F]/30 flex items-center justify-center shrink-0 mt-0.5">
                    <Shield className="h-3 w-3" />
                  </div>
                )}

                <div
                  className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 shadow-xs ${
                    m.sender === "user"
                      ? "bg-[#F09E4F] text-slate-950 font-medium rounded-br-xs"
                      : "bg-[#131620] border border-white/10 text-slate-200 rounded-bl-xs leading-relaxed"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.text}</p>
                  <span
                    className={`block text-[9px] mt-1 text-right font-mono ${
                      m.sender === "user" ? "text-slate-800" : "text-slate-500"
                    }`}
                  >
                    {m.timestamp}
                  </span>
                </div>

                {m.sender === "user" && (
                  <div className="h-6 w-6 rounded-full bg-white/10 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <User className="h-3 w-3" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-slate-400 text-xs py-1 font-mono">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-[#F09E4F]" />
                <span className="italic text-[11px]">Assistant researching security specs...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Quick Questions */}
          {messages.length <= 3 && (
            <div className="px-3 py-2 bg-[#0E1017] border-t border-white/5 flex flex-wrap gap-1.5">
              {SUGGESTED_QUESTIONS.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(q)}
                  disabled={loading}
                  className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-white/5 text-[#F09E4F] hover:bg-[#F09E4F]/10 border border-[#F09E4F]/30 transition text-left cursor-pointer disabled:opacity-50"
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
            className="p-3 bg-[#0E1017] border-t border-white/10 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about scans, AST analysis, or risk..."
              disabled={loading}
              className="flex-1 px-3.5 py-2 text-xs bg-white/5 border border-white/10 rounded-full text-white placeholder:text-slate-500 focus:outline-none focus:border-[#F09E4F]"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="h-8 w-8 rounded-full bg-[#F09E4F] hover:bg-[#E08E3F] disabled:opacity-40 text-slate-950 flex items-center justify-center transition cursor-pointer shrink-0 shadow-md shadow-[rgba(240,158,79,0.25)]"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>

          {/* Bottom Footer Note */}
          <div className="px-3 py-1.5 bg-[#080A0F] border-t border-white/5 flex items-center justify-between text-[10px] text-slate-500 font-mono">
            <span>Grounded in CyberShield specs</span>
            <a
              href="mailto:support@cybershield.dev"
              className="text-[#F09E4F] hover:underline flex items-center gap-0.5"
            >
              Email Support <ExternalLink className="h-2.5 w-2.5" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
