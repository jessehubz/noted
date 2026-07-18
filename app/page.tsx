"use client";

import Link from "next/link";
import { SignInButton, SignUpButton, Show, UserButton } from "@clerk/nextjs";
import { useEffect, useRef } from "react";

export default function Landing() {
  const revealRefs = useRef<HTMLElement[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.15 }
    );

    revealRefs.current.forEach((el) => { if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, []);

  function addRevealRef(el: HTMLElement | null) {
    if (el && !revealRefs.current.includes(el)) {
      revealRefs.current.push(el);
    }
  }

  return (
    <main className="landing">
      {/* Subtle grid background */}
      <div className="l-grid-bg" aria-hidden="true" />
      {/* Radial glow */}
      <div className="l-radial-glow" aria-hidden="true" />

      {/* NAV */}
      <nav className="l-nav">
        <span className="l-wordmark">noted</span>
        <div className="l-nav-links">
          <Link href="#how" className="l-nav-link">How it works</Link>
          <Link href="#about" className="l-nav-link">About</Link>
          <Show when="signed-out">
            <SignInButton mode="modal" forceRedirectUrl="/api/auth-redirect">
              <button className="l-nav-link" style={{ background: "none", border: "none", cursor: "pointer", font: "inherit" }}>Sign in</button>
            </SignInButton>
          </Show>
          <Show when="signed-in">
            <UserButton />
          </Show>
        </div>
      </nav>

      {/* HERO */}
      <section className="l-hero">
        <p className="l-hero-eyebrow l-hero-animate">anonymous · gps-pinned · real-time</p>
        <h1 className="l-hero-h1 l-hero-animate">
          <span className="l-hero-h1-light">Every place has</span><br />
          <span className="l-hero-h1-light">something</span> <span className="l-hero-h1-accent">unsaid.</span>
        </h1>
        <p className="l-hero-sub l-hero-animate">
          Drop anonymous notes at your exact GPS location. Read confessions, jokes, and thoughts
          left by strangers — pinned to the real places where they happened.
        </p>
        <div className="l-hero-animate l-hero-ctas">
          <Link href="/map" className="l-cta">
            Open the map
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <Show when="signed-out">
            <SignUpButton mode="modal" forceRedirectUrl="/api/auth-redirect">
              <button className="l-cta l-cta--ghost">Create account</button>
            </SignUpButton>
          </Show>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="l-how" id="how" ref={addRevealRef}>
        <p className="l-how-title">How it works</p>
        <div className="l-how-steps">
          <div className="l-how-step">
            <span className="l-how-num">01</span>
            <p className="l-how-label">Open the map</p>
            <p className="l-how-desc">Flies to your location automatically. No setup needed.</p>
          </div>
          <div className="l-how-step">
            <span className="l-how-num">02</span>
            <p className="l-how-label">Write a note</p>
            <p className="l-how-desc">Up to 300 characters. Say what&apos;s on your mind, right where you are.</p>
          </div>
          <div className="l-how-step">
            <span className="l-how-num">03</span>
            <p className="l-how-label">Pin it</p>
            <p className="l-how-desc">Locked to the exact spot forever. No edits, no takebacks.</p>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="l-features" ref={addRevealRef}>
        <div className="l-feat">
          <div className="l-feat-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="currentColor" strokeWidth="1.5" /><circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5" /></svg>
          </div>
          <h2 className="l-feat-title">GPS-locked</h2>
          <p className="l-feat-body">
            Your location is captured the instant you write. Can&apos;t be moved or faked.
          </p>
        </div>
        <div className="l-feat">
          <div className="l-feat-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /><circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" /></svg>
          </div>
          <h2 className="l-feat-title">Anonymous</h2>
          <p className="l-feat-body">
            No username attached. Say what you&apos;re thinking with zero traceability.
          </p>
        </div>
        <div className="l-feat">
          <div className="l-feat-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>
          </div>
          <h2 className="l-feat-title">Real-time</h2>
          <p className="l-feat-body">
            Notes from others appear live on the map as they&apos;re posted around the world.
          </p>
        </div>
      </section>

      {/* ABOUT */}
      <section className="l-about" id="about" ref={addRevealRef}>
        <p className="l-about-heading">Why I built this</p>
        <p className="l-about-text">
          I&apos;ve always believed that places carry stories — the unspoken thoughts on late-night walks,
          confessions whispered in parks, feelings left behind in coffee shops. Most of those moments
          vanish without a trace.
        </p>
        <p className="l-about-text">
          noted gives those thoughts a permanent home. A canvas for the unspoken, where your words
          live exactly where you left them — for anyone passing by to discover.
        </p>
        <p className="l-about-name">Jesse David Francisco</p>
        <p className="l-about-role">Full-stack engineer · Building products that connect people to places</p>
        <div className="l-about-links">
          <a href="mailto:jessedavidfrancisco@gmail.com" className="l-about-link">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><rect x="1" y="3" width="12" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2" /><path d="M1 4l6 4 6-4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
            Email
          </a>
          <a href="https://github.com/jessehubz" target="_blank" rel="noopener noreferrer" className="l-about-link">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M7 1C3.7 1 1 3.7 1 7c0 2.65 1.72 4.9 4.1 5.7.3.05.41-.13.41-.28v-1.02c-1.67.36-2.02-.8-2.02-.8-.27-.7-.67-.88-.67-.88-.55-.37.04-.36.04-.36.6.04.92.62.92.62.54.92 1.41.65 1.76.5.05-.39.21-.65.38-.8-1.33-.15-2.73-.67-2.73-2.97 0-.65.24-1.19.62-1.61-.06-.15-.27-.76.06-1.58 0 0 .5-.16 1.65.61A5.7 5.7 0 017 3.96c.51 0 1.02.07 1.5.2 1.14-.77 1.64-.61 1.64-.61.33.82.12 1.43.06 1.58.39.42.62.96.62 1.61 0 2.31-1.41 2.82-2.75 2.97.22.19.41.56.41 1.13v1.67c0 .16.11.34.42.28A5.99 5.99 0 0013 7c0-3.3-2.7-6-6-6z" fill="currentColor" /></svg>
            GitHub
          </a>
          <a href="https://linkedin.com/in/jessedavidfrancisco" target="_blank" rel="noopener noreferrer" className="l-about-link">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><rect x="1" y="1" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.2" /><path d="M4.5 6v3.5M4.5 4.5v.01M6.5 9.5V7.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
            LinkedIn
          </a>
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section className="l-bottom" ref={addRevealRef}>
        <p className="l-bottom-label">Thoughts are already waiting near you.</p>
        <Link href="/map" className="l-cta">Open the map</Link>
      </section>

      {/* FOOTER */}
      <footer className="l-footer">
        <div className="l-footer-top">
          <div className="l-footer-col">
            <span className="l-footer-brand">noted</span>
            <p className="l-footer-tagline">Anonymous thoughts, pinned to the world.</p>
          </div>
          <div className="l-footer-col">
            <span className="l-footer-col-title">Product</span>
            <Link href="/map" className="l-footer-link">Open Map</Link>
            <Link href="#how" className="l-footer-link">How it works</Link>
          </div>
          <div className="l-footer-col">
            <span className="l-footer-col-title">Legal</span>
            <Link href="/terms" className="l-footer-link">Terms of Service</Link>
            <Link href="/privacy" className="l-footer-link">Privacy Policy</Link>
          </div>
          <div className="l-footer-col">
            <span className="l-footer-col-title">Connect</span>
            <a href="https://github.com/jessehubz/noted" target="_blank" rel="noopener noreferrer" className="l-footer-link">GitHub</a>
            <a href="mailto:jessedavidfrancisco@gmail.com" className="l-footer-link">Contact</a>
          </div>
        </div>
        <div className="l-footer-bottom">
          <span className="l-footer-copy">&copy; 2026 Jesse David Francisco. All rights reserved.</span>
        </div>
      </footer>
    </main>
  );
}
