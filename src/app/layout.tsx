import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "next-themes";
import ServiceWorkerRegister from "@/components/service-worker-register";
import PwaInstallPrompt from "@/components/pwa-install-prompt";
import { ThemeTimeSync } from "@/components/theme-time-sync";
import { CsrfTokenMeta } from "./csrf-token-meta";
import { HtmlLangSync } from "./html-lang-sync";
import { getLocaleFromCookies, tWithLocale } from "@/lib/i18n";
import "@/lib/server-env"; // Validate environment variables at startup

export const viewport: Viewport = {
  themeColor: "#10b981",
  width: "device-width",
  initialScale: 1,
};

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const locale = getLocaleFromCookies(cookieStore.toString());

  return {
    title: tWithLocale(locale, 'metadata.title'),
    description: tWithLocale(locale, 'metadata.description'),
    keywords: tWithLocale(locale, 'metadata.keywords').split(', '),
    authors: [{ name: "SQL Trainer" }],
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
      title: tWithLocale(locale, 'metadata.og.title'),
      description: tWithLocale(locale, 'metadata.og.description'),
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: tWithLocale(locale, 'metadata.twitter.title'),
      description: tWithLocale(locale, 'metadata.twitter.description'),
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className="font-sans antialiased bg-background text-foreground">
        <HtmlLangSync />
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <CsrfTokenMeta />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
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
