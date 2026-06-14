import type { Metadata, Viewport } from "next";
import { Geist, Pirata_One } from "next/font/google";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const pirataOne = Pirata_One({
  weight: "400",
  variable: "--font-pirata-one",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LearnBulgEasy",
  description: "Learn Bulgarian vocabulary with a pirate adventure",
  other: {
    "theme-color": "#060d1f",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable} ${pirataOne.variable} h-full antialiased`}>
      <body className="h-full bg-blue-50">{children}</body>
    </html>
  );
}
