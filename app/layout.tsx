import type { Metadata } from "next";
import { Geist, Geist_Mono, Lexend, Comfortaa } from "next/font/google";
import "@/app/styles/globals.css";
import Navbar from "@/app/components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const lexend = Lexend({
  variable: "--font-lexend",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const comfortaa = Comfortaa({
  variable: "--font-comfortaa",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "NewMe - AI-Powered Style Preview",
  description: "Discover the new you with AI-powered style transformations. Experiment with new hairstyles and colors using your Google Photos. Fun, easy, and completely safe.",
  icons: {
    // default browser favicon
    icon: "/favicon.ico",
    // legacy shortcut icon
    shortcut: "/favicon.ico",
    // apple touch icon for iOS / pinned homescreen
    apple: "/apple-touch-icon.png",
    // additional icons (Android / PWAs)
    other: [
      { rel: "icon", url: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
      { rel: "icon", url: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${lexend.variable} ${comfortaa.variable} antialiased`}
      >
        <Navbar />
        {children}
      </body>
    </html>
  );
}
