import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("http://localhost:3001"),
  title: "InstaSafe — Protected payments for social commerce",
  description:
    "InstaSafe helps social-commerce vendors protect buyer payments and release vendor payouts after delivery is confirmed.",
  keywords: [
    "social commerce",
    "payment protection",
    "delivery verification",
    "WhatsApp commerce",
    "Nigeria",
  ],
  openGraph: {
    title: "InstaSafe — Sell with confidence on WhatsApp",
    description:
      "Protected payments and delivery-triggered vendor payouts for social commerce.",
    type: "website",
    locale: "en_NG",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#eff6f1" },
    { media: "(prefers-color-scheme: dark)", color: "#051f1c" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-full antialiased">
        <a
          href="#main-content"
          className="fixed left-4 top-4 z-50 -translate-y-24 rounded-xl bg-blue-spruce-950 px-4 py-3 text-sm font-semibold text-blue-spruce-50 transition-transform focus:translate-y-0"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
