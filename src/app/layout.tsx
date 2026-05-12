import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "next-themes";

export const metadata: Metadata = {
  title: "SQL Тренажёр — Интерактивное обучение SQL",
  description:
    "Интерактивный тренажёр по SQL с поддержкой SQLite и PostgreSQL. Выполнение запросов, тренировочные задания, справочник SQL.",
  keywords: ["SQL", "тренажёр", "SQLite", "PostgreSQL", "обучение", "базы данных"],
  authors: [{ name: "SQL Тренажёр" }],
  icons: {
    icon: "/logo.svg",
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
      <body className="font-sans antialiased bg-background text-foreground">
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
