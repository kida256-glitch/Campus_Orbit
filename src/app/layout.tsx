import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";

import { APP_DESCRIPTION, APP_NAME, APP_TAGLINE } from "@/lib/constants";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: `${APP_NAME} — ${APP_TAGLINE}`,
    template: `%s · ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  applicationName: APP_NAME,
  keywords: [
    "campus events",
    "student opportunities",
    "student portfolio",
    "university",
    "college",
    "campus technology",
    "student career portfolio",
  ],
  openGraph: {
    title: `${APP_NAME} — ${APP_TAGLINE}`,
    description: APP_DESCRIPTION,
    siteName: APP_NAME,
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a1020",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        {/* Preconnect to Supabase so the first API call has a warm TCP connection */}
        <link rel="preconnect" href="https://nhorfibqbbumrjwjxiwb.supabase.co" />
        <link rel="dns-prefetch" href="https://nhorfibqbbumrjwjxiwb.supabase.co" />
      </head>
      <body>
        {/* Keyboard users can jump straight past the navigation. */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-navy-900 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
        >
          Skip to main content
        </a>
        <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
        <Toaster />
      </body>
    </html>
  );
}
