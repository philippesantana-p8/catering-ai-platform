import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "../components/ThemeProvider";
import { ThemeScript } from "../components/ThemeScript";
import { ThemeToggle } from "../components/ThemeToggle";
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
  title: "Catering AI Platform · CDL",
  description: "Cotações e catering BBQ at Home",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      data-theme="dark"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <ThemeScript />
      </head>
      <body className="flex min-h-full flex-col bg-cdl-bg text-cdl-fg">
        <ThemeProvider>
          <div className="no-print pointer-events-none fixed top-4 right-4 z-50 sm:top-6 sm:right-6">
            <div className="pointer-events-auto">
              <ThemeToggle />
            </div>
          </div>
          <div className="relative min-h-full pt-14">{children}</div>
        </ThemeProvider>
      </body>
    </html>
  );
}
