import type { Metadata } from "next";
import { DM_Sans, DM_Serif_Display } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import "maplibre-gl/dist/maplibre-gl.css";
import "./globals.css";
import { Providers } from "./providers";

const dmSans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const dmSerif = DM_Serif_Display({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: "noted — anonymous thoughts, pinned to the world",
  description:
    "A live map of anonymous confessions, jokes, and thoughts left by real people at their exact GPS location.",
};

const clerkAppearance = {
  baseTheme: dark,
  variables: {
    colorPrimary: "#ffffff",
    colorBackground: "#0a0a0a",
    colorInputBackground: "#111111",
    colorInputText: "#ffffff",
    colorText: "#ffffff",
    colorTextSecondary: "#555555",
    colorNeutral: "#ffffff",
    borderRadius: "10px",
    fontFamily: `var(--font-sans, "DM Sans", system-ui, sans-serif)`,
  },
  elements: {
    card: {
      backgroundColor: "#0a0a0a",
      border: "1px solid #1a1a1a",
      borderRadius: "16px",
      boxShadow: "0 24px 80px rgba(0, 0, 0, .8)",
    },
    headerTitle: {
      fontFamily: `var(--font-serif, "DM Serif Display", serif)`,
      fontSize: "28px",
      fontWeight: "400",
    },
    headerSubtitle: {
      color: "#444",
    },
    formButtonPrimary: {
      backgroundColor: "#fff",
      color: "#000",
      borderRadius: "9999px",
      fontWeight: "600",
      fontSize: "14px",
      "&:hover": {
        backgroundColor: "#e8e8e8",
      },
    },
    formFieldInput: {
      backgroundColor: "#111",
      border: "1px solid #1e1e1e",
      borderRadius: "10px",
      color: "#fff",
      "&:focus": {
        borderColor: "#333",
      },
    },
    footerActionLink: {
      color: "#fff",
      "&:hover": {
        color: "#ccc",
      },
    },
    socialButtonsBlockButton: {
      backgroundColor: "#111",
      border: "1px solid #1e1e1e",
      borderRadius: "10px",
      color: "#fff",
      "&:hover": {
        backgroundColor: "#1a1a1a",
        borderColor: "#333",
      },
    },
    dividerLine: {
      backgroundColor: "#1a1a1a",
    },
    dividerText: {
      color: "#333",
    },
    userButtonAvatarBox: {
      width: "32px",
      height: "32px",
    },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${dmSans.variable} ${dmSerif.variable}`}>
      <body>
        <ClerkProvider appearance={clerkAppearance}>
          <Providers>{children}</Providers>
        </ClerkProvider>
      </body>
    </html>
  );
}
