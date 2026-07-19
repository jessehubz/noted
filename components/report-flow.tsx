"use client";

import { useState } from "react";
import { reportNote, type ReportReason } from "@/lib/actions-report";

const REASONS: { value: ReportReason; label: string }[] = [
  { value: "spam", label: "Spam" },
  { value: "harassment", label: "Harassment" },
  { value: "hate_speech", label: "Hate speech" },
  { value: "violence", label: "Violence or threats" },
  { value: "personal_info", label: "Personal information" },
  { value: "inappropriate", label: "Inappropriate content" },
  { value: "other", label: "Other" },
];

interface ReportFlowProps {
  noteId: string;
  onDone: () => void;
}

export function ReportFlow({ noteId, onDone }: ReportFlowProps) {
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!reason) return;
    setSending(true);
    setError(null);
    const result = await reportNote(noteId, reason, details || undefined);
    setSending(false);
    if (result.success) {
      setDone(true);
      setTimeout(onDone, 1500);
    } else {
      setError(result.error ?? "Something went wrong.");
    }
  }

  if (done) {
    return (
      <div className="report-flow">
        <p className="report-done">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" style={{ display: "inline", verticalAlign: "-2px", marginRight: 6 }}>
            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Report submitted. We&apos;ll review it shortly.
        </p>
      </div>
    );
  }

  return (
    <div className="report-flow">
      <p className="report-title">Why are you reporting this note?</p>

      <div className="report-reasons">
        {REASONS.map((r) => (
          <button
            key={r.value}
            className={`report-reason-btn ${reason === r.value ? "active" : ""}`}
            onClick={() => setReason(r.value)}
          >
            {r.label}
          </button>
        ))}
      </div>

      {reason && (
        <>
          <input
            className="report-details"
            placeholder="Additional details (optional)"
            value={details}
            onChange={(e) => setDetails(e.target.value.slice(0, 200))}
            maxLength={200}
          />

          {error && <p className="report-error">{error}</p>}

          <div className="report-btns">
            <button
              className="report-submit"
              onClick={handleSubmit}
              disabled={sending}
            >
              {sending ? "Submitting…" : "Submit report"}
            </button>
            <button className="report-cancel" onClick={onDone}>Cancel</button>
          </div>
        </>
      )}
    </div>
  );
}
