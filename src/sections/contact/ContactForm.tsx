"use client";

import { useState } from "react";

type Status = "idle" | "sending" | "sent" | "error";

export default function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "sending") return;
    setStatus("sending");
    setError(null);

    const formData = new FormData(e.currentTarget);
    const body = {
      name: String(formData.get("name") ?? ""),
      contact: String(formData.get("contact") ?? ""),
      message: String(formData.get("message") ?? ""),
    };

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? "Send failed");
      }
      setStatus("sent");
      e.currentTarget.reset();
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Send failed");
    }
  }

  if (status === "sent") {
    return (
      <div className="rounded-2xl border border-border bg-surface p-8">
        <div className="text-sm font-mono text-accent mb-2">✓ message sent</div>
        <p className="text-foreground">
          Thanks for reaching out. I&apos;ll get back to you soon.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="name" label="Name" placeholder="Ada Lovelace" />
        <Field
          name="contact"
          label="Email or phone"
          placeholder="you@domain.com"
          required
        />
      </div>
      <label className="grid gap-2">
        <span className="text-xs font-mono uppercase tracking-[0.15em] text-muted">
          Message
        </span>
        <textarea
          name="message"
          required
          rows={5}
          placeholder="What's on your mind?"
          className="w-full rounded-xl bg-surface border border-border px-4 py-3 text-foreground placeholder:text-subtle focus:outline-none focus:border-accent transition-colors resize-y"
        />
      </label>
      <div className="flex items-center gap-4 flex-wrap">
        <button
          type="submit"
          disabled={status === "sending"}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {status === "sending" ? "Sending…" : "Send message"}
          <span aria-hidden>→</span>
        </button>
        {status === "error" && (
          <span className="text-sm text-red-500">{error}</span>
        )}
      </div>
    </form>
  );
}

function Field({
  name,
  label,
  placeholder,
  required,
}: {
  name: string;
  label: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-mono uppercase tracking-[0.15em] text-muted">
        {label}
      </span>
      <input
        type="text"
        name={name}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-xl bg-surface border border-border px-4 py-3 text-foreground placeholder:text-subtle focus:outline-none focus:border-accent transition-colors"
      />
    </label>
  );
}
