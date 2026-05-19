import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "next-themes";
import ServiceWorkerRegister from "@/components/service-worker-register";
import PwaInstallPrompt from "@/components/pwa-install-prompt";
import { ThemeTimeSync } from "@/components/theme-time-sync";

export const viewport: Viewport = {
  themeColor: "#10b981",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "SQL Тренажёр — Интерактивное обучение SQL",
  description:
    "Интерактивный тренажёр по SQL с поддержкой SQLite и PostgreSQL. Выполнение запросов, тренировочные задания, справочник SQL.",
  keywords: ["SQL", "тренажёр", "SQLite", "PostgreSQL", "обучение", "базы данных"],
  authors: [{ name: "SQL Тренажёр" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SQL Trainer",
  },
  icons: {
    icon: "/logo.svg",
    apple: [
      { url: "/icons/icon-192.png", sizes: "192x192" },
      { url: "/icons/icon-512.png", sizes: "512x512" },
    ],
  },
  openGraph: {
    title: "SQL Тренажёр",
    description: "Интерактивное обучение SQL — SQLite и PostgreSQL",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SQL Тренажёр",
    description: "Интерактивное обучение SQL — SQLite и PostgreSQL",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className="font-sans antialiased bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
          <ThemeTimeSync />
          <ServiceWorkerRegister />
          <PwaInstallPrompt />
        </ThemeProvider>
      </body>
    </html>
  );
}
