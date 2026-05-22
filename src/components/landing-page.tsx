'use client';

import Link from 'next/link';
import { t } from '@/lib/i18n';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  BookOpen,
  Target,
  Award,
  Sparkles,
  Trophy,
  GraduationCap,
  LogIn,
  Database,
  Moon,
  LayoutPanelTop,
  History,
  Search,
} from 'lucide-react';

const modules = [
  {
    icon: Table,
    titleKey: 'landing.modules.editor.title',
    descKey: 'landing.modules.editor.desc',
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-950/30',
  },
  {
    icon: BookOpen,
    titleKey: 'landing.modules.tasks.title',
    descKey: 'landing.modules.tasks.desc',
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
  },
  {
    icon: Target,
    titleKey: 'landing.modules.progress.title',
    descKey: 'landing.modules.progress.desc',
    color: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-50 dark:bg-purple-950/30',
  },
  {
    icon: Award,
    titleKey: 'landing.modules.achievements.title',
    descKey: 'landing.modules.achievements.desc',
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
  },
  {
    icon: Sparkles,
    titleKey: 'landing.modules.practice.title',
    descKey: 'landing.modules.practice.desc',
    color: 'text-pink-600 dark:text-pink-400',
    bg: 'bg-pink-50 dark:bg-pink-950/30',
  },
  {
    icon: Trophy,
    titleKey: 'landing.modules.leaderboard.title',
    descKey: 'landing.modules.leaderboard.desc',
    color: 'text-yellow-600 dark:text-yellow-400',
    bg: 'bg-yellow-50 dark:bg-yellow-950/30',
  },
];

const features = [
  { icon: Database, labelKey: 'landing.features.multiDb' },
  { icon: Moon, labelKey: 'landing.features.darkMode' },
  { icon: LayoutPanelTop, labelKey: 'landing.features.schema' },
  { icon: History, labelKey: 'landing.features.history' },
  { icon: Search, labelKey: 'landing.features.explain' },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-background via-background to-muted/30">
      {/* Decorative background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-emerald-500/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-emerald-500/5 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-emerald-500/[0.02] blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 sm:px-8 lg:px-12">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-sm">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight">
            SQL <span className="text-emerald-600">Trainer</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/login">
            <Button variant="ghost" size="sm" className="gap-1.5">
              <LogIn className="h-4 w-4" />
              {t('landing.hero.login')}
            </Button>
          </Link>
          <Link href="/register">
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
              {t('landing.hero.startTraining')}
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 flex flex-col items-center justify-center px-6 py-16 sm:py-24 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-lg mb-6">
          <GraduationCap className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
          {t('landing.hero.title')}
        </h1>
        <p className="max-w-2xl text-lg sm:text-xl text-muted-foreground mb-8">
          {t('landing.hero.subtitle')}
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <Link href="/register">
            <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 h-11 px-6 text-base">
              <GraduationCap className="h-5 w-5 mr-2" />
              {t('landing.hero.startTraining')}
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" size="lg" className="h-11 px-6 text-base">
              <LogIn className="h-5 w-5 mr-2" />
              {t('landing.hero.login')}
            </Button>
          </Link>
        </div>
      </section>

      {/* Modules */}
      <section className="relative z-10 px-6 sm:px-8 lg:px-12 pb-16">
        <div className="max-w-6xl mx-auto grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((mod) => (
            <Card key={mod.titleKey} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5 flex items-start gap-4">
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${mod.bg}`}>
                  <mod.icon className={`h-5 w-5 ${mod.color}`} />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{t(mod.titleKey)}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{t(mod.descKey)}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Task categories preview */}
      <section className="relative z-10 px-6 sm:px-8 lg:px-12 pb-16">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <BookOpen className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-semibold">{t('landing.modules.tasks.title')}</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="text-xs">Компания</Badge>
                <Badge variant="secondary" className="text-xs">Магазин</Badge>
                <Badge variant="secondary" className="text-xs">Аналитика</Badge>
                <Badge variant="secondary" className="text-xs">Экзамены</Badge>
                <span className="text-xs text-muted-foreground self-center ml-2">
                  56 заданий
                </span>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400 text-xs">
                  Начальный
                </Badge>
                <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400 text-xs">
                  Средний
                </Badge>
                <Badge className="bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-400 text-xs">
                  Продвинутый
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features strip */}
      <section className="relative z-10 px-6 sm:px-8 lg:px-12 pb-16">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-4 sm:gap-6">
          {features.map((f) => (
            <div key={f.labelKey} className="flex items-center gap-2 text-sm text-muted-foreground">
              <f.icon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>{t(f.labelKey)}</span>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Footer */}
      <section className="relative z-10 px-6 sm:px-8 lg:px-12 pb-16 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">{t('landing.cta.title')}</h2>
          <Link href="/register">
            <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 h-11 px-8 text-base">
              <GraduationCap className="h-5 w-5 mr-2" />
              {t('landing.cta.button')}
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
