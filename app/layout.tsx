import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { BettingDataProvider } from "@/components/BettingDataContext";
import GoogleAnalytics from "@/components/GoogleAnalytics";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EuroRoulette Tracker - Professional Edition",
  description: "Professional-grade roulette analytics platform. Track 47 betting groups with real-time statistical insights, betting assistant, and session management.",
  keywords: "roulette tracker, roulette analytics, roulette statistics, betting assistant, roulette strategy",
  authors: [{ name: "EuroRoulette Tracker" }],
  creator: "EuroRoulette Tracker",
  publisher: "EuroRoulette Tracker",
  metadataBase: new URL('https://euroroulette-tracker.com'),
  openGraph: {
    title: "EuroRoulette Tracker - Professional Edition",
    description: "Track 47 betting groups with real-time statistical insights",
    url: 'https://euroroulette-tracker.com',
    siteName: 'EuroRoulette Tracker',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "EuroRoulette Tracker - Professional Edition",
    description: "Track 47 betting groups with real-time statistical insights",
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
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <GoogleAnalytics />
        {/* ✅ WRAP children with BettingDataProvider */}
        <BettingDataProvider>
          {children}
        </BettingDataProvider>
      </body>
    </html>
  );
}