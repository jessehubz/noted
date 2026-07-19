"use client";

import { useCallback, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

const APP_URL = "notedmap.vercel.app";

interface StoryShareProps {
  open: boolean;
  initialText: string;
  author?: string;
  onClose: () => void;
}

/**
 * Story-style sharing. Generates a 1080×1920 story card from the note text
 * (not editable). Includes the app link so people know where to find noted.
 */
export function StoryShare({ open, initialText, author, onClose }: StoryShareProps) {
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const text = initialText;
  const previewFontSize = text.length > 110 ? 18 : text.length > 70 ? 21 : 24;

  function showToast(msg: string) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2600);
  }

  const renderCanvas = useCallback(async () => {
    const cv = canvasRef.current;
    if (!cv) return null;
    const ctx = cv.getContext("2d");
    if (!ctx) return null;

    await document.fonts.ready;

    const W = 1080;
    const H = 1920;
    const INK = "#F5F3EE";
    const DIM = "#A3A19A";
    const GHOST = "#5C5A55";

    // Background
    ctx.fillStyle = "#050505";
    ctx.fillRect(0, 0, W, H);

    // Faint grid
    ctx.save();
    const grad = ctx.createRadialGradient(W / 2, H * 0.44, 100, W / 2, H * 0.44, H * 0.6);
    grad.addColorStop(0, "rgba(245,243,238,.085)");
    grad.addColorStop(1, "rgba(245,243,238,0)");
    ctx.strokeStyle = grad;
    ctx.lineWidth = 1.5;
    for (let x = 70; x < W; x += 148) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 70; y < H; y += 148) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
    ctx.restore();

    ctx.textAlign = "center";

    // Eyebrow
    ctx.fillStyle = DIM;
    ctx.font = '26px "Inter", system-ui, sans-serif';
    ctx.fillText("A  N O T E  L E F T  B E H I N D", W / 2, 190);

    // Note text
    const noteText = text.trim() || "…";
    let size = noteText.length > 110 ? 74 : noteText.length > 70 ? 84 : 96;
    ctx.font = `${size}px "Playfair Display", serif`;
    let lines = wrapLines(ctx, noteText, W - 240);
    while (lines.length > 8 && size > 56) {
      size -= 6;
      ctx.font = `${size}px "Playfair Display", serif`;
      lines = wrapLines(ctx, noteText, W - 240);
    }
    const lh = size * 1.42;
    const blockH = lines.length * lh;
    const y0 = H * 0.47 - blockH / 2 + lh * 0.6;

    // Opening quote
    ctx.fillStyle = GHOST;
    ctx.font = '180px "Playfair Display", serif';
    ctx.fillText("\u201C", W / 2, y0 - lh * 0.8);

    // Text lines
    ctx.fillStyle = INK;
    ctx.font = `${size}px "Playfair Display", serif`;
    lines.forEach((ln, i) => ctx.fillText(ln, W / 2, y0 + i * lh));

    // Author
    ctx.fillStyle = DIM;
    ctx.font = '27px "Inter", system-ui, sans-serif';
    ctx.fillText(`\u2014  ${(author || "anonymous").toUpperCase()}`, W / 2, y0 + blockH + 50);

    // Bottom brand block
    ctx.strokeStyle = "rgba(245,243,238,.22)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(W / 2 - 50, H - 360);
    ctx.lineTo(W / 2 + 50, H - 360);
    ctx.stroke();

    ctx.fillStyle = INK;
    ctx.font = '110px "Playfair Display", serif';
    ctx.fillText("noted", W / 2, H - 240);

    // App link
    ctx.fillStyle = DIM;
    ctx.font = '30px "Inter", system-ui, sans-serif';
    ctx.fillText(APP_URL, W / 2, H - 160);

    // Tagline
    ctx.fillStyle = GHOST;
    ctx.font = '22px "Inter", system-ui, sans-serif';
    ctx.fillText("E V E R Y  P L A C E  H A S  S O M E T H I N G  U N S A I D", W / 2, H - 110);

    return cv;
  }, [text, author]);

  async function handleDownload() {
    const cv = await renderCanvas();
    if (!cv) return;
    cv.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "noted-story.png";
      a.click();
      URL.revokeObjectURL(a.href);
      showToast("Saved — post it anywhere.");
    }, "image/png");
  }

  async function handleShare() {
    const cv = await renderCanvas();
    if (!cv) return;
    cv.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], "noted-story.png", { type: "image/png" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: "noted", text: `A note left behind — ${APP_URL}` });
        } catch {
          // User cancelled
        }
      } else {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "noted-story.png";
        a.click();
        URL.revokeObjectURL(a.href);
        showToast("Sharing not supported — saved instead.");
      }
    }, "image/png");
  }

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="story-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          className="story-modal"
          initial={{ y: 24, opacity: 0, scale: 0.97 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 24, opacity: 0, scale: 0.97 }}
          transition={{ type: "spring", damping: 28, stiffness: 320 }}
        >
          <button className="story-close" onClick={onClose} aria-label="Close">✕</button>

          <div className="story-layout-simple">
            {/* Preview card */}
            <div className="story-card">
              <div className="story-card-grid" aria-hidden="true" />
              <div className="story-card-eyebrow">A note left behind</div>
              <div className="story-card-body">
                <div className="story-card-openq">&ldquo;</div>
                <div className="story-card-text" style={{ fontSize: previewFontSize }}>
                  {text || "…"}
                </div>
                <div className="story-card-author">&mdash; {author || "anonymous"}</div>
              </div>
              <div className="story-card-bottom">
                <div className="story-card-rule" />
                <div className="story-card-wordmark">noted</div>
                <div className="story-card-link">{APP_URL}</div>
                <div className="story-card-tag">Every place has something unsaid</div>
              </div>
            </div>

            {/* Actions */}
            <div className="story-actions-simple">
              <button className="story-btn-primary" onClick={handleDownload}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M12 3v13M7 11l5 5 5-5M5 21h14" />
                </svg>
                Download
              </button>
              <button className="story-btn-ghost" onClick={handleShare}>Share</button>
            </div>
            <span className="story-size-hint">1080 × 1920 · fits Instagram &amp; TikTok stories</span>
          </div>
        </motion.div>

        {toastMsg && <div className="story-toast">{toastMsg}</div>}
        <canvas ref={canvasRef} width={1080} height={1920} style={{ display: "none" }} />
      </motion.div>
    </AnimatePresence>
  );
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? line + " " + w : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}
