import type { Metadata } from "next";
import { Fraunces, Public_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  axes: ["opsz", "SOFT", "WONK"],
});

const publicSans = Public_Sans({
  variable: "--font-body",
  subsets: ["latin"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const SITE_URL = "https://groundwork-blush-eta.vercel.app";
const TITLE = "GroundWork — Design & Quoting for Landscapers";
const DESCRIPTION =
  "Turn a property walkthrough into a designed layout and an accurate, investment-framed quote in minutes. Built for landscaping and hardscaping contractors.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: "%s — GroundWork",
  },
  description: DESCRIPTION,
  keywords: [
    "landscaping software",
    "hardscaping quoting software",
    "landscape design tool",
    "contractor quoting software",
    "patio design tool",
    "landscape estimating software",
  ],
  authors: [{ name: "GroundWork" }],
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "GroundWork",
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${publicSans.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
