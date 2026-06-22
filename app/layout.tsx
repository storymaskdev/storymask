import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://storymask.app"),

  title: "StoryMask",
  description:
    "Share your anonymous story. Read confessions, creepy stories, love stories and secrets from people around the world.",

  keywords: [
    "anonymous",
    "stories",
    "confessions",
    "creepy",
    "secrets",
    "love",
    "scary",
    "story",
    "anonymous stories",
    "StoryMask",
  ],

  openGraph: {
    title: "StoryMask",
    description:
      "Share your anonymous story. Read confessions from people around the world.",
    url: "https://storymask.app",
    siteName: "StoryMask",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "StoryMask",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "StoryMask",
    description:
      "Share your anonymous story. Read confessions from people around the world.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-full flex flex-col`}>
        {children}
      </body>
    </html>
  );
}