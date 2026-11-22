"use client";

import { MessageCircle, Send } from "lucide-react";
import { useState, type FormEvent } from "react";
import { copy, occasionLabels } from "@/copy/es-AR";
import { detectOccasion } from "@/lib/recommendation";
import type { Occasion } from "@/types/wardrobe";
import { StatusBadge } from "../StatusBadge";

export function OccasionChat({ onDetected }: { onDetected: (o: Occasion) => void }) {
  const [text, setText] = useState("");
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const match = detectOccasion(text);
    if (match) {
      onDetected(match.occasion);
      setFeedback({ ok: true, message: copy.studio.chat.detected(occasionLabels[match.occasion].toLowerCase(), match.keyword) });
    } else {
      setFeedback({ ok: false, message: copy.studio.chat.notDetected });
    }
  };

  return (
    <section className="rounded-3xl bg-surface p-4 ring-1 ring-line" aria-labelledby="chat-label">
      <div className="mb-3 flex items-center justify-between gap-2">
        <label id="chat-label" htmlFor="chat-input" className="flex items-center gap-2 text-sm font-medium">
          <MessageCircle className="size-4" /> {copy.studio.chat.label}
        </label>
        <StatusBadge status="simulated" />
      </div>
      <form onSubmit={submit} className="flex gap-2">
        <input
          id="chat-input"
          className="field"
          placeholder={copy.studio.chat.placeholder}
          value={text}
          onChange={(e) => setText(e.target.value)}
          autoComplete="off"
          enterKeyHint="send"
        />
        <button className="btn btn-primary px-4" aria-label={copy.studio.chat.send} disabled={!text.trim()}>
          <Send className="size-4" />
        </button>
      </form>
      {feedback && (
        <p className={`mt-2 text-sm ${feedback.ok ? "text-status-working" : "text-muted"}`} aria-live="polite">
          {feedback.message}
        </p>
      )}
      <p className="mt-3 flex items-start gap-2 text-xs text-muted">
        <StatusBadge status="comingSoon" />
        <span className="pt-0.5">{copy.studio.chat.notice}</span>
      </p>
    </section>
  );
}
