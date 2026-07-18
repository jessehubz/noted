import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main style={{ minHeight: "100vh", background: "#000", color: "#fff", padding: "48px 24px" }}>
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <Link href="/" style={{ color: "#666", fontSize: 13, marginBottom: 32, display: "block" }}>← Back to home</Link>
        <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 32, fontWeight: 400, marginBottom: 24 }}>Privacy Policy</h1>

        <div style={{ color: "#999", fontSize: 14, lineHeight: 1.8, display: "flex", flexDirection: "column", gap: 20 }}>
          <p>Last updated: July 2026</p>

          <h2 style={{ color: "#fff", fontSize: 16, fontWeight: 600, margin: "8px 0 0" }}>What We Collect</h2>
          <p>When you post a note, we store the text content and GPS coordinates you provide. We also store a hashed version of your IP address for rate limiting and spam prevention — we do not store your raw IP address.</p>

          <h2 style={{ color: "#fff", fontSize: 16, fontWeight: 600, margin: "8px 0 0" }}>Account Data</h2>
          <p>If you create an account (to comment or message), authentication is handled by Clerk. We store your Clerk user ID to associate comments and messages. We do not have access to your password.</p>

          <h2 style={{ color: "#fff", fontSize: 16, fontWeight: 600, margin: "8px 0 0" }}>Location Data</h2>
          <p>Your GPS coordinates are only captured when you actively choose to post a note. We never track your location in the background. You can also choose to fuzz your location (~200m offset) when posting.</p>

          <h2 style={{ color: "#fff", fontSize: 16, fontWeight: 600, margin: "8px 0 0" }}>Cookies</h2>
          <p>We use essential cookies for authentication sessions. No advertising or tracking cookies are used.</p>

          <h2 style={{ color: "#fff", fontSize: 16, fontWeight: 600, margin: "8px 0 0" }}>Data Sharing</h2>
          <p>We do not sell, rent, or share your personal information with third parties. Notes are publicly visible by design.</p>

          <h2 style={{ color: "#fff", fontSize: 16, fontWeight: 600, margin: "8px 0 0" }}>Contact</h2>
          <p>For privacy-related inquiries, reach out to davidfrancisco@example.com.</p>
        </div>
      </div>
    </main>
  );
}
