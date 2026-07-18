import Link from "next/link";

export default function Landing() {
  return (
    <main className="landing">
      {/* NAV */}
      <nav className="l-nav">
        <span className="l-wordmark">noted</span>
        <div className="l-nav-links">
          <Link href="#how" className="l-nav-link">How it works</Link>
          <Link href="#about" className="l-nav-link">About</Link>
          <Link href="/auth" className="l-nav-link">Sign in</Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="l-hero">
        <div className="l-hero-grid" aria-hidden="true">
          {Array.from({ length: 7 }).map((_, i) => <span key={i} />)}
        </div>
        <p className="l-hero-eyebrow">anonymous · gps-pinned · real-time</p>
        <h1 className="l-hero-h1">
          Every place has<br />something unsaid.
        </h1>
        <p className="l-hero-sub">
          Drop anonymous notes at your exact GPS location. Read confessions, jokes, and thoughts
          left by strangers — pinned to the real places where they happened.
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
          <Link href="/map" className="l-cta">
            Open the map
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <Link href="/auth" className="l-cta l-cta--ghost">Create account</Link>
        </div>
      </section>

      {/* MOCKUP */}
      <section className="l-mockup">
        <div className="l-mockup-inner">
          <div className="l-mockup-dots" aria-hidden="true">
            {Array.from({ length: 30 }).map((_, i) => <div key={i} className="l-mockup-dot" />)}
          </div>
          <span className="l-mockup-label">live map</span>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="l-how" id="how">
        <p className="l-how-title">How it works</p>
        <div className="l-how-steps">
          <div className="l-how-step">
            <span className="l-how-num">1</span>
            <p className="l-how-label">Open the map</p>
            <p className="l-how-desc">Flies to your location automatically.</p>
          </div>
          <div className="l-how-step">
            <span className="l-how-num">2</span>
            <p className="l-how-label">Write a note</p>
            <p className="l-how-desc">Up to 300 characters. Attach a song if you want.</p>
          </div>
          <div className="l-how-step">
            <span className="l-how-num">3</span>
            <p className="l-how-label">Pin it</p>
            <p className="l-how-desc">Locked to the exact spot. No edits, no takebacks.</p>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="l-features">
        <div className="l-feat">
          <span className="l-feat-num">01</span>
          <h2 className="l-feat-title">GPS-locked</h2>
          <p className="l-feat-body">
            Your location is captured the instant you write. Can&apos;t be moved or faked.
          </p>
        </div>
        <div className="l-feat">
          <span className="l-feat-num">02</span>
          <h2 className="l-feat-title">Anonymous</h2>
          <p className="l-feat-body">
            No username attached. Say what you&apos;re thinking with zero traceability.
          </p>
        </div>
        <div className="l-feat">
          <span className="l-feat-num">03</span>
          <h2 className="l-feat-title">Real-time</h2>
          <p className="l-feat-body">
            Notes from others appear live on the map. Watch the world confess in real-time.
          </p>
        </div>
      </section>

      {/* ABOUT */}
      <section className="l-about" id="about">
        <p className="l-about-heading">About</p>
        <p className="l-about-text">
          Full-stack engineer building products that connect people.
          noted was made to give anonymous thoughts a real place in the world.
        </p>
        <p className="l-about-name">David Francisco</p>
        <div className="l-about-links">
          <a href="mailto:davidfrancisco@example.com" className="l-about-link">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><rect x="1" y="3" width="12" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2" /><path d="M1 4l6 4 6-4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
            Email
          </a>
          <a href="https://github.com/davidfrancisco" target="_blank" rel="noopener noreferrer" className="l-about-link">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M7 1C3.7 1 1 3.7 1 7c0 2.65 1.72 4.9 4.1 5.7.3.05.41-.13.41-.28v-1.02c-1.67.36-2.02-.8-2.02-.8-.27-.7-.67-.88-.67-.88-.55-.37.04-.36.04-.36.6.04.92.62.92.62.54.92 1.41.65 1.76.5.05-.39.21-.65.38-.8-1.33-.15-2.73-.67-2.73-2.97 0-.65.24-1.19.62-1.61-.06-.15-.27-.76.06-1.58 0 0 .5-.16 1.65.61A5.7 5.7 0 017 3.96c.51 0 1.02.07 1.5.2 1.14-.77 1.64-.61 1.64-.61.33.82.12 1.43.06 1.58.39.42.62.96.62 1.61 0 2.31-1.41 2.82-2.75 2.97.22.19.41.56.41 1.13v1.67c0 .16.11.34.42.28A5.99 5.99 0 0013 7c0-3.3-2.7-6-6-6z" fill="currentColor" /></svg>
            GitHub
          </a>
          <a href="https://linkedin.com/in/davidfrancisco" target="_blank" rel="noopener noreferrer" className="l-about-link">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><rect x="1" y="1" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.2" /><path d="M4.5 6v3.5M4.5 4.5v.01M6.5 9.5V7.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
            LinkedIn
          </a>
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section className="l-bottom">
        <p className="l-bottom-label">Thoughts are already waiting near you.</p>
        <Link href="/map" className="l-cta">Open the map</Link>
      </section>

      {/* FOOTER */}
      <footer className="l-footer">
        <span className="l-footer-brand">noted</span>
        <div className="l-footer-links">
          <Link href="/map" className="l-footer-link">Map</Link>
          <Link href="/auth" className="l-footer-link">Sign in</Link>
          <a href="https://github.com/davidfrancisco" target="_blank" rel="noopener noreferrer" className="l-footer-link">GitHub</a>
        </div>
        <span className="l-footer-copy">&copy; 2026 David Francisco</span>
      </footer>
    </main>
  );
}
