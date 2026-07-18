import Link from "next/link";

export default function TermsPage() {
  return (
    <main style={{ minHeight: "100vh", background: "#000", color: "#fff", padding: "48px 24px" }}>
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <Link href="/" style={{ color: "#666", fontSize: 13, marginBottom: 32, display: "block" }}>← Back to home</Link>
        <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 32, fontWeight: 400, marginBottom: 24 }}>Terms of Service</h1>

        <div style={{ color: "#999", fontSize: 14, lineHeight: 1.8, display: "flex", flexDirection: "column", gap: 20 }}>
          <p>Last updated: July 2026</p>

          <p>By using noted, you agree to the following terms:</p>

          <h2 style={{ color: "#fff", fontSize: 16, fontWeight: 600, margin: "8px 0 0" }}>Use of Service</h2>
          <p>noted is a platform for sharing anonymous, location-pinned text notes. You may use it for personal expression within the bounds of applicable law.</p>

          <h2 style={{ color: "#fff", fontSize: 16, fontWeight: 600, margin: "8px 0 0" }}>Content Guidelines</h2>
          <p>You must not post content that is illegal, threatening, harassing, defamatory, or that violates the rights of others. We reserve the right to remove content that violates these guidelines without notice.</p>

          <h2 style={{ color: "#fff", fontSize: 16, fontWeight: 600, margin: "8px 0 0" }}>Anonymity</h2>
          <p>While notes are displayed without identifying information, we may store technical metadata (such as IP hashes) for spam prevention and safety purposes.</p>

          <h2 style={{ color: "#fff", fontSize: 16, fontWeight: 600, margin: "8px 0 0" }}>No Warranty</h2>
          <p>noted is provided &ldquo;as is&rdquo; without warranty of any kind. We do not guarantee uptime, data persistence, or availability.</p>

          <h2 style={{ color: "#fff", fontSize: 16, fontWeight: 600, margin: "8px 0 0" }}>Changes</h2>
          <p>We may update these terms at any time. Continued use of the service constitutes acceptance of updated terms.</p>
        </div>
      </div>
    </main>
  );
}
