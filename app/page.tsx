"use client";

import Link from "next/link";
import { SignInButton, SignUpButton, Show, UserButton } from "@clerk/nextjs";
import { useEffect, useState } from "react";

export default function Landing() {
  const [navScrolled, setNavScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setNavScrolled(window.scrollY > 30);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Reveal on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    document.querySelectorAll(".rv").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <main className="dp">
      {/* NAV */}
      <nav className={`dp-nav${navScrolled ? " scrolled" : ""}`}>
        <div className="dp-nav-in">
          <Link href="/" className="dp-logo">noted</Link>
          <div className="dp-nav-links">
            <Link href="#map" className="dp-nav-link">The map</Link>
            <Link href="#how" className="dp-nav-link">How it works</Link>
            <Link href="#share" className="dp-nav-link">Share a note</Link>
            <span className="dp-nav-sep" />
            <Show when="signed-out">
              <SignInButton mode="modal" forceRedirectUrl="/auth-redirect">
                <button className="dp-nav-link" style={{ background: "none", border: "none", cursor: "pointer", font: "inherit" }}>Sign in</button>
              </SignInButton>
            </Show>
            <Show when="signed-in">
              <UserButton />
            </Show>
            <Link href="/map" className="dp-btn dp-btn--nav">Open the map</Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <header className="dp-hero">
        <div className="dp-hero-grid" aria-hidden="true" />

        <h1 className="dp-hero-h1 rv d1">Every place has something <em>unsaid.</em></h1>
        <p className="dp-hero-sub rv d2">
          Leave anonymous notes at the exact spot where they happened — and find the ones strangers left behind for you.
        </p>
        <div className="dp-hero-ctas rv d3">
          <Link href="/map" className="dp-btn">
            Open the map
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>
          <Link href="#how" className="dp-btn dp-btn--ghost">How it works</Link>
        </div>
        <div className="dp-scroll-hint" aria-hidden="true">scroll</div>
      </header>

      {/* MAP SECTION */}
      <section id="map" className="dp-section">
        <div className="dp-wrap">
          <div className="dp-sec-head rv">
            <span className="dp-sec-num">THE MAP</span>
            <h2>A quieter kind of <em>map.</em></h2>
            <p>Notes appear exactly where they were left. Zoom out and they gather into clusters — every circle is a place where someone had something to say.</p>
          </div>

          <div className="dp-map-stage rv d1">
            {/* Streets SVG background */}
            <div className="dp-map-streets" aria-hidden="true">
              <svg viewBox="0 0 1200 600" preserveAspectRatio="xMidYMid slice">
                <g stroke="#171715" strokeWidth="1" fill="none">
                  <path d="M-20 140 L500 200 L1220 160" />
                  <path d="M-20 340 L420 380 L900 330 L1220 370" />
                  <path d="M-20 500 L620 540 L1220 480" />
                  <path d="M180 -20 L220 620" />
                  <path d="M430 -20 L390 620" />
                  <path d="M640 -20 L690 620" strokeWidth="2.4" stroke="#1f1f1d" />
                  <path d="M900 -20 L860 620" />
                  <path d="M1090 -20 L1130 620" />
                </g>
              </svg>
            </div>

            {/* Chrome */}
            <div className="dp-map-chrome" aria-hidden="true">
              <span className="dp-logo" style={{ fontSize: 21 }}>noted</span>
              <div className="dp-map-search-pill">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" />
                </svg>
                Search a place…
              </div>
            </div>

            {/* Pins */}
            <div className="dp-pin-layer">
              <div className="dp-pin fresh" style={{ left: "44%", top: "46%" }}><span className="dp-pin-halo" /><span className="dp-pin-head" /><span className="dp-pin-tail" /></div>
              <div className="dp-pin" style={{ left: "58%", top: "34%" }}><span className="dp-pin-head" /><span className="dp-pin-tail" /></div>
              <div className="dp-pin" style={{ left: "30%", top: "62%" }}><span className="dp-pin-head" /><span className="dp-pin-tail" /></div>
              <div className="dp-pin" style={{ left: "70%", top: "60%" }}><span className="dp-pin-head" /><span className="dp-pin-tail" /></div>
              <div className="dp-pin" style={{ left: "52%", top: "74%" }}><span className="dp-pin-head" /><span className="dp-pin-tail" /></div>
            </div>

            {/* Hint */}
            <div className="dp-map-hint">tap a pin</div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="dp-section" style={{ paddingTop: 0 }}>
        <div className="dp-wrap">
          <div className="dp-sec-head rv">
            <span className="dp-sec-num">HOW IT WORKS</span>
            <h2>Say it. Pin it. <em>Leave it.</em></h2>
          </div>

          <div className="dp-steps rv d1">
            <div className="dp-step">
              <span className="dp-step-k">01</span>
              <h3>Write the unsaid</h3>
              <p>A confession, a joke, a goodbye, a thank-you. Up to 300 characters. No account, no name — unless you want one.</p>
            </div>
            <div className="dp-step">
              <span className="dp-step-k">02</span>
              <h3>Pin it where it happened</h3>
              <p>Your note locks to the spot you&apos;re standing on — or blur it within 200&nbsp;m if the place says too much.</p>
            </div>
            <div className="dp-step">
              <span className="dp-step-k">03</span>
              <h3>Let strangers find it</h3>
              <p>Anyone passing through can read it, echo it, or reply. Some notes fade in a day. Some stay forever.</p>
            </div>
          </div>

          {/* Composer mockup */}
          <div className="dp-composer-wrap">
            <div className="dp-composer rv" aria-hidden="true">
              <div className="dp-cm-top">
                <span className="dp-cm-loc"><i className="dp-cm-dot" />You are here</span>
                <span className="dp-cm-count">300</span>
              </div>
              <div className="dp-cm-area">Say what you couldn&apos;t.<span className="dp-caret" /></div>
              <div className="dp-cm-row"><span>anonymous</span><span>stays forever</span></div>
              <button className="dp-btn dp-cm-btn">Pin it here</button>
            </div>
            <div className="dp-composer-copy rv d1">
              <h3>Built for the things you <em>can&apos;t say out loud.</em></h3>
              <p>noted isn&apos;t a feed. There are no followers, no likes to chase, no profile to perform. Just a place, a moment, and the words you left behind.</p>
              <ul>
                <li><span><b>Anonymous by default.</b> Sign a note only if you choose to.</span></li>
                <li><span><b>Location-honest.</b> Notes can only be dropped where you&apos;re standing.</span></li>
                <li><span><b>Ephemeral or forever.</b> You decide how long it lives.</span></li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* SHARE / STORY SECTION */}
      <section id="share" className="dp-share-sec">
        <div className="dp-wrap">
          <div className="dp-share-grid">
            <div className="dp-share-copy">
              <div className="dp-sec-head rv">
                <span className="dp-sec-num">SHARE A NOTE</span>
                <h2>Some notes deserve to <em>travel.</em></h2>
                <p>Every note exports as a clean, story-sized card — just the words and the mark they left. Made to be posted, and wondered about.</p>
              </div>
            </div>

            {/* Story card preview */}
            <div className="rv d2">
              <div className="dp-story-card">
                <div className="dp-story-grid-bg" aria-hidden="true" />
                <div className="dp-sc-eyebrow">A note left behind</div>
                <div className="dp-sc-body">
                  <div className="dp-sc-openq">&ldquo;</div>
                  <div className="dp-sc-text">I never told you, but the day we met at this corner was the day everything got better.</div>
                  <div className="dp-sc-author">— anonymous</div>
                </div>
                <div className="dp-sc-bottom">
                  <div className="dp-sc-rule" />
                  <div className="dp-sc-wordmark">noted</div>
                  <div className="dp-sc-tag">Every place has something unsaid</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CLOSING CTA */}
      <div className="dp-closing">
        <span className="dp-eyebrow rv">Your turn</span>
        <h2 className="rv d1">Every place has something unsaid.<br /><em>Now it has somewhere to go.</em></h2>
        <Link href="/map" className="dp-btn rv d2">
          Leave your first note
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </Link>
      </div>

      {/* FOOTER */}
      <footer className="dp-footer">
        <span className="dp-logo">noted</span>
        <div className="dp-footer-links">
          <Link href="#how">How it works</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/privacy">Privacy</Link>
          <a href="https://github.com/jessehubz/noted" target="_blank" rel="noopener noreferrer">GitHub</a>
        </div>
        <span className="dp-footer-tag">Every place has something unsaid</span>
      </footer>
    </main>
  );
}
