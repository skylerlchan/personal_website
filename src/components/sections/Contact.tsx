"use client";

import { useRef, useState, useEffect } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/utils";

/* ── Types ── */
type Message = { role: "bot" | "user"; text: string; time: string; delivered?: boolean };

const BOT_FINAL =
  "Thanks for reaching out! He'll get back to you soon.";

function timeNow() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function relativeTime(unix: number) {
  const s = Math.floor(Date.now() / 1000) - unix;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function Contact() {
  const sectionRef = useRef<HTMLElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  const [contact, setContact] = useState("");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { role: "bot", text: "Hey! Drop your email or number so Skyler can get back to you.", time: timeNow() },
  ]);
  const [hasContact, setHasContact] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [hasSent, setHasSent] = useState(false);

  /* ── Telegram status ── */
  const [tgStatus, setTgStatus] = useState<"connecting" | "online" | "offline">("connecting");
  const [tgLastSeen, setTgLastSeen] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/telegram-status")
      .then((r) => r.json())
      .then((d: { status: string; lastSeen?: number }) => {
        setTgStatus(d.status === "online" ? "online" : "offline");
        if (d.lastSeen) setTgLastSeen(d.lastSeen);
      })
      .catch(() => setTgStatus("offline"));
  }, []);

  /* ── Auto-scroll ── */
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTo({
        top: chatRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, isTyping]);

  /* ── GSAP entrance ── */
  useGSAP(
    () => {
      if (reducedMotion || !sectionRef.current) return;
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 75%",
          toggleActions: "play none none none",
        },
        defaults: { ease: "power3.out" },
      });
      tl.from(".contact-window", { y: 40, autoAlpha: 0, duration: 0.8, immediateRender: false });
    },
    { scope: sectionRef }
  );

  const addBotMessage = (text: string) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [...prev, { role: "bot", text, time: timeNow() }]);
    }, 600 + Math.random() * 400);
  };

  const submitContact = () => {
    if (!contact.trim()) return;
    setMessages((prev) => [...prev, { role: "user", text: contact.trim(), time: timeNow() }]);
    setHasContact(true);
    addBotMessage("Nice to meet you! What would you like to chat with Skyler about?");
  };

  const sendMessage = async () => {
    if (!input.trim() || isTyping) return;
    const text = input.trim();
    setMessages((prev) => [...prev, { role: "user", text, time: timeNow() }]);
    setInput("");
    setHasSent(true);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact: contact.trim(), message: text }),
      });
      if (res.ok) {
        setMessages((prev) => {
          const next = [...prev];
          for (let i = next.length - 1; i >= 0; i--) {
            if (next[i].role === "user") {
              next[i] = { ...next[i], delivered: true };
              break;
            }
          }
          return next;
        });
      }
    } catch {
      // silent — bot still responds
    }

    addBotMessage(BOT_FINAL);
  };

  const editMessage = (index: number) => {
    const msg = messages[index];
    if (msg.role !== "user") return;
    setInput(msg.text);
    setMessages((prev) => {
      const next = [...prev];
      const removeCount = next[index + 1]?.role === "bot" ? 2 : 1;
      next.splice(index, removeCount);
      return next;
    });
    setHasSent(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (!hasContact) submitContact();
      else sendMessage();
    }
  };

  const statusText =
    tgStatus === "connecting"
      ? "connecting..."
      : tgStatus === "online"
        ? tgLastSeen
          ? `last seen ${relativeTime(tgLastSeen)}`
          : "Active on Telegram"
        : "Telegram";

  return (
    <section
      ref={sectionRef}
      id="contact"
      data-snap
      className="relative min-h-screen w-full flex flex-col items-center justify-center px-3 py-3 sm:px-6 sm:py-8 lg:py-16"
    >
      <div className="w-full sm:max-w-md lg:max-w-5xl flex flex-col min-h-0">
        {/* Chat window */}
        <div
          data-project="assistant"
          className={cn(
            "contact-window rounded-2xl border border-foreground/[0.08]",
            "bg-surface/50 backdrop-blur-sm overflow-hidden",
            "flex flex-col min-h-0"
          )}
        >
          {/* Header — messaging app style */}
          <div className="px-4 py-3 sm:px-5 sm:py-3.5 border-b border-foreground/[0.06] flex items-center gap-3 shrink-0">
            <div className="relative shrink-0">
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                <span className="text-sm font-semibold text-accent">SC</span>
              </div>
              {tgStatus === "online" && (
                <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />
                  <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-surface" />
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">Skyler Chan</p>
              <p
                className={cn(
                  "text-xs truncate",
                  tgStatus === "online" ? "text-emerald-500/70" : "text-muted/40"
                )}
              >
                {statusText}
              </p>
            </div>
            {/* Telegram icon */}
            <div className="p-2 text-muted/30 shrink-0">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
              </svg>
            </div>
          </div>

          {/* Messages */}
          <div
            ref={chatRef}
            data-lenis-prevent
            className="chat-messages px-4 py-4 h-64 sm:h-80 lg:h-[420px] sm:px-6 sm:py-5 overflow-y-auto flex flex-col gap-3"
          >
            {messages.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  "flex animate-[fadeSlideIn_0.25s_ease-out]",
                  msg.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "flex flex-col",
                    "max-w-[80%] sm:max-w-[70%] lg:max-w-[50%]",
                    msg.role === "user" ? "items-end" : "items-start"
                  )}
                >
                  <div
                    className={cn(
                      "px-4 py-2.5 text-sm leading-relaxed",
                      msg.role === "user"
                        ? "bg-accent text-white rounded-2xl rounded-br-sm"
                        : "bg-foreground/[0.06] text-foreground rounded-2xl rounded-bl-sm"
                    )}
                  >
                    {msg.text}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 px-1">
                    <span className="text-[10px] text-muted/30">{msg.time}</span>
                    {msg.role === "user" && msg.delivered && (
                      <span className="text-[10px] text-emerald-500/50 flex items-center gap-0.5">
                        <svg
                          className="w-3 h-3"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                        Sent to Telegram
                      </span>
                    )}
                    {msg.role === "user" && hasContact && i > 1 && !msg.delivered && (
                      <button
                        onClick={() => editMessage(i)}
                        className="text-[10px] text-muted/30 hover:text-accent transition-colors duration-200 cursor-pointer"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex justify-start animate-[fadeSlideIn_0.2s_ease-out]">
                <div className="bg-foreground/[0.06] px-4 py-3 rounded-2xl rounded-bl-sm flex gap-1.5 items-center">
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-muted/50 animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  />
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-muted/50 animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-muted/50 animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Input area */}
          <div className="px-4 py-3 sm:px-5 sm:py-3.5 border-t border-foreground/[0.06] shrink-0">
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={hasContact ? input : contact}
                onChange={(e) =>
                  hasContact
                    ? setInput(e.target.value)
                    : setContact(e.target.value)
                }
                onKeyDown={handleKeyDown}
                placeholder={
                  !hasContact
                    ? "Your email or number"
                    : hasSent
                      ? "Send another message..."
                      : "Type a message..."
                }
                disabled={isTyping}
                className={cn(
                  "flex-1 bg-foreground/[0.04] rounded-full px-5 py-3",
                  "text-sm text-foreground placeholder:text-muted/30",
                  "outline-none border border-foreground/[0.05]",
                  "focus:border-accent/30 transition-colors",
                  "disabled:opacity-50"
                )}
              />
              <button
                onClick={hasContact ? sendMessage : submitContact}
                disabled={
                  hasContact
                    ? !input.trim() || isTyping
                    : !contact.trim()
                }
                data-cursor="link"
                className={cn(
                  "w-10 h-10 rounded-full shrink-0 flex items-center justify-center",
                  "bg-accent text-white cursor-pointer",
                  "transition-all duration-200",
                  "disabled:opacity-30 disabled:cursor-default",
                  "hover:bg-accent-light active:scale-95"
                )}
              >
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
