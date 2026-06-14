import type { Metadata, Viewport } from "next";
import { Geist, Pirata_One } from "next/font/google";
import PWAProvider from "@/components/PWAProvider";
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
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "BulgEasy",
  },
  icons: {
    apple: "/icon-192.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#060d1f",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable} ${pirataOne.variable} h-full antialiased`}>
      <body className="h-full bg-[#060d1f]">
        <PWAProvider>{children}</PWAProvider>
      </body>
    </html>
  );
}
