import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SQL Тренажёр — Интерактивное обучение SQL",
  description: "Интерактивный тренажёр по SQL с поддержкой SQLite и PostgreSQL. Выполнение запросов, тренировочные задания, справочник SQL.",
  keywords: ["SQL", "тренажёр", "SQLite", "PostgreSQL", "обучение", "базы данных"],
  authors: [{ name: "SQL Тренажёр" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
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
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
