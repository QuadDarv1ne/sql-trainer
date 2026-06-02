/* eslint-disable react-hooks/refs -- callback refs are standard React pattern for dynamic ref assignment */
'use client';

import Link from 'next/link';
import { useTheme } from 'next-themes';
import { t } from '@/lib/i18n';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
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
  Sun,
  LayoutPanelTop,
  History,
  Search,
  Globe as GlobeIcon,
  Check,
  UserPlus,
  ListChecks,
  Code,
  Users,
  Quote,
  Server,
  Zap,
  RefreshCw,
  Globe2,
  TrendingUp,
  Menu,
  X,
} from 'lucide-react';
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import LocaleSelector from '@/components/locale-selector';

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="sm" className="h-8 w-8" aria-label="Toggle theme">
        <Sun className="h-4 w-4" />
      </Button>
    );
  }

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <Button variant="ghost" size="sm" className="h-8 w-8" onClick={toggleTheme} aria-label="Toggle theme">
      {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}

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
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-950/30',
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

const databases = [
  {
    icon: Server,
    nameKey: 'landing.databases.sqlite.name',
    descKey: 'landing.databases.sqlite.desc',
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    borderColor: 'border-blue-200 dark:border-blue-800',
  },
  {
    icon: Database,
    nameKey: 'landing.databases.postgresql.name',
    descKey: 'landing.databases.postgresql.desc',
    color: 'text-indigo-600 dark:text-indigo-400',
    bg: 'bg-indigo-50 dark:bg-indigo-950/30',
    borderColor: 'border-indigo-200 dark:border-indigo-800',
  },
  {
    icon: Zap,
    nameKey: 'landing.databases.clickhouse.name',
    descKey: 'landing.databases.clickhouse.desc',
    color: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-50 dark:bg-orange-950/30',
    borderColor: 'border-orange-200 dark:border-orange-800',
  },
];

const whyItems = [
  {
    icon: RefreshCw,
    titleKey: 'landing.why.interactive.title',
    descKey: 'landing.why.interactive.desc',
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-950/30',
  },
  {
    icon: TrendingUp,
    titleKey: 'landing.why.progressive.title',
    descKey: 'landing.why.progressive.desc',
    color: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-50 dark:bg-purple-950/30',
  },
  {
    icon: Check,
    titleKey: 'landing.why.feedback.title',
    descKey: 'landing.why.feedback.desc',
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
  },
  {
    icon: Globe2,
    titleKey: 'landing.why.community.title',
    descKey: 'landing.why.community.desc',
    color: 'text-cyan-600 dark:text-cyan-400',
    bg: 'bg-cyan-50 dark:bg-cyan-950/30',
  },
];

const howItWorks = [
  {
    icon: UserPlus,
    titleKey: 'landing.howItWorks.step1.title',
    descKey: 'landing.howItWorks.step1.desc',
    step: 1,
  },
  {
    icon: ListChecks,
    titleKey: 'landing.howItWorks.step2.title',
    descKey: 'landing.howItWorks.step2.desc',
    step: 2,
  },
  {
    icon: Code,
    titleKey: 'landing.howItWorks.step3.title',
    descKey: 'landing.howItWorks.step3.desc',
    step: 3,
  },
];

const stats = [
  { value: '1,200+', labelKey: 'landing.stats.users', icon: Users },
  { value: '56', labelKey: 'landing.stats.exercises', icon: BookOpen },
  { value: '30+', labelKey: 'landing.stats.countries', icon: GlobeIcon },
];

const testimonials = [
  {
    nameKey: 'landing.testimonials.student1.name',
    roleKey: 'landing.testimonials.student1.role',
    quoteKey: 'landing.testimonials.student1.quote',
  },
  {
    nameKey: 'landing.testimonials.student2.name',
    roleKey: 'landing.testimonials.student2.role',
    quoteKey: 'landing.testimonials.student2.quote',
  },
  {
    nameKey: 'landing.testimonials.student3.name',
    roleKey: 'landing.testimonials.student3.role',
    quoteKey: 'landing.testimonials.student3.quote',
  },
];

const faqItems = [
  { titleKey: 'landing.faq.free.title', contentKey: 'landing.faq.free.answer' },
  { titleKey: 'landing.faq.beginner.title', contentKey: 'landing.faq.beginner.answer' },
  { titleKey: 'landing.faq.database.title', contentKey: 'landing.faq.database.answer' },
  { titleKey: 'landing.faq.certificate.title', contentKey: 'landing.faq.certificate.answer' },
];

/**
 * Consolidated fade-in hook — uses a single IntersectionObserver for multiple sections.
 * Returns an array of { ref, isVisible } objects.
 */
function useFadeInSections(count: number) {
  const elementRefs = useRef<Array<HTMLElement | null>>(new Array(count).fill(null));
  const [visibleSections, setVisibleSections] = useState<Set<number>>(new Set());

  const setRef = useCallback(
    (index: number) => (el: HTMLElement | null) => {
      elementRefs.current[index] = el;
    },
    []
  );

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const index = Number(entry.target.getAttribute('data-section-index'));
          if (entry.isIntersecting && !isNaN(index)) {
            setVisibleSections((prev) => {
              if (prev.has(index)) return prev;
              const next = new Set(prev);
              next.add(index);
              return next;
            });
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.1 }
    );

    for (const ref of elementRefs.current) {
      if (ref) {
        observer.observe(ref);
      }
    }

    return () => observer.disconnect();
  }, []);

  return useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        setRef: setRef(i),
        isVisible: visibleSections.has(i),
      })),
    [count, visibleSections, setRef]
  );
}

const curriculumLevels = [
  {
    level: 'landing.curriculum.beginner.title',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    borderColor: 'border-blue-200 dark:border-blue-800',
    topics: [
      'landing.curriculum.beginner.topics.select',
      'landing.curriculum.beginner.topics.where',
      'landing.curriculum.beginner.topics.orderby',
      'landing.curriculum.beginner.topics.aggregates',
      'landing.curriculum.beginner.topics.groupby',
      'landing.curriculum.beginner.topics.distinct',
    ],
  },
  {
    level: 'landing.curriculum.intermediate.title',
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    borderColor: 'border-amber-200 dark:border-amber-800',
    topics: [
      'landing.curriculum.intermediate.topics.joins',
      'landing.curriculum.intermediate.topics.subqueries',
      'landing.curriculum.intermediate.topics.case',
      'landing.curriculum.intermediate.topics.union',
      'landing.curriculum.intermediate.topics.dates',
      'landing.curriculum.intermediate.topics.transactions',
    ],
  },
  {
    level: 'landing.curriculum.advanced.title',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-950/30',
    borderColor: 'border-red-200 dark:border-red-800',
    topics: [
      'landing.curriculum.advanced.topics.windows',
      'landing.curriculum.advanced.topics.ctes',
      'landing.curriculum.advanced.topics.constraints',
      'landing.curriculum.advanced.topics.explain',
      'landing.curriculum.advanced.topics.triggers',
      'landing.curriculum.advanced.topics.json',
    ],
  },
];

const NAV_LINKS = [
  { href: '#databases', labelKey: 'landing.nav.databases' },
  { href: '#why', labelKey: 'landing.nav.why' },
  { href: '#curriculum', labelKey: 'landing.nav.curriculum' },
  { href: '#faq', labelKey: 'landing.nav.faq' },
];

function scrollToSection(href: string) {
  const id = href.replace('#', '');
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

export default function LandingPage() {
  const fadeSections = useFadeInSections(10);
  // hero=0, stats=1, modules=2, databases=3, why=4, howItWorks=5, curriculum=6, tasks=7, testimonials=8, faq=9
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const currentYear = useMemo(() => new Date().getFullYear(), []);

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-background via-background to-muted/30">
      {/* Decorative background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-blue-500/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-blue-500/5 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-blue-500/[0.02] blur-3xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="flex items-center justify-between px-4 py-3 sm:px-6 lg:px-12">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-sm">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">
              SQL <span className="text-blue-600">Trainer</span>
            </span>
          </div>

          {/* Nav links — desktop */}
          <nav className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <button
                key={link.href}
                onClick={() => scrollToSection(link.href)}
                className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted/50"
              >
                {t(link.labelKey)}
              </button>
            ))}
          </nav>

          {/* Desktop actions */}
          <div className="hidden lg:flex items-center gap-2">
            <LocaleSelector />
            <ThemeToggle />
            <Link href="/login">
              <Button variant="ghost" size="sm" className="gap-1.5">
                <LogIn className="h-4 w-4" />
                {t('landing.hero.login')}
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                {t('landing.hero.startTraining')}
              </Button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="flex lg:hidden items-center gap-2">
            <LocaleSelector />
            <ThemeToggle />
            <Button
              variant="ghost"
              size="sm"
              className="h-9 w-9 p-0"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-border/50 bg-background/95 backdrop-blur-xl px-4 py-4 sm:px-6">
            <nav className="flex flex-col gap-1 mb-4">
              {NAV_LINKS.map((link) => (
                <button
                  key={link.href}
                  onClick={() => {
                    scrollToSection(link.href);
                    setMobileMenuOpen(false);
                  }}
                  className="px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted/50 text-left"
                >
                  {t(link.labelKey)}
                </button>
              ))}
            </nav>
            <div className="flex gap-2 pt-3 border-t border-border/50">
              <Link href="/login" className="flex-1">
                <Button variant="outline" size="sm" className="w-full gap-1.5">
                  <LogIn className="h-4 w-4" />
                  {t('landing.hero.login')}
                </Button>
              </Link>
              <Link href="/register" className="flex-1">
                <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700">
                  {t('landing.hero.startTraining')}
                </Button>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero */}
      <section
        ref={fadeSections[0].setRef}
        data-section-index="0"
        className={`relative z-10 flex flex-col items-center justify-center px-6 py-20 sm:py-28 text-center transition-all duration-700 ${
          fadeSections[0].isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 rounded-full bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 text-sm font-medium border border-blue-200 dark:border-blue-800">
          <Sparkles className="h-4 w-4" />
          {t('landing.hero.subtitle')}
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 bg-gradient-to-r from-foreground via-foreground to-muted-foreground bg-clip-text text-transparent">
          {t('landing.hero.title')}
        </h1>
        <p className="max-w-2xl text-lg sm:text-xl text-muted-foreground mb-10 leading-relaxed">
          {t('landing.hero.description')}
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-16">
          <Link href="/register">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 h-12 px-8 text-base shadow-lg shadow-blue-600/25">
              <GraduationCap className="h-5 w-5 mr-2" />
              {t('landing.hero.startTraining')}
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" size="lg" className="h-12 px-8 text-base">
              <LogIn className="h-5 w-5 mr-2" />
              {t('landing.hero.login')}
            </Button>
          </Link>
        </div>

        {/* SQL Code Example */}
        <div className="w-full max-w-2xl rounded-2xl overflow-hidden border border-border/50 bg-card shadow-2xl shadow-muted/20">
          <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/50">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-red-500/80" />
                <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
                <div className="h-3 w-3 rounded-full bg-green-500/80" />
              </div>
              <span className="text-xs text-muted-foreground ml-2 font-mono">query.sql</span>
            </div>
            <Badge variant="secondary" className="text-xs">SQLite</Badge>
          </div>
          <pre className="p-5 text-sm font-mono text-left leading-relaxed">
            <code>
              <span className="text-muted-foreground">{t('landing.hero.codeComment')}</span>
              {'\n'}
              <span className="text-purple-600 dark:text-purple-400 font-semibold">SELECT</span>{' '}
              <span className="text-foreground">name, department, salary</span>
              {'\n'}
              <span className="text-purple-600 dark:text-purple-400 font-semibold">FROM</span>{' '}
              <span className="text-foreground">employees</span>
              {'\n'}
              <span className="text-purple-600 dark:text-purple-400 font-semibold">WHERE</span>{' '}
              <span className="text-foreground">salary &gt; </span>
              <span className="text-amber-600 dark:text-amber-400">50000</span>
              {'\n'}
              <span className="text-purple-600 dark:text-purple-400 font-semibold">ORDER BY</span>{' '}
              <span className="text-foreground">salary</span>{' '}
              <span className="text-purple-600 dark:text-purple-400 font-semibold">DESC</span>
              {'\n'}
              <span className="text-purple-600 dark:text-purple-400 font-semibold">LIMIT</span>{' '}
              <span className="text-amber-600 dark:text-amber-400">5</span>;
            </code>
          </pre>
        </div>
      </section>

      {/* Stats */}
      <section
        ref={fadeSections[1].setRef}
        data-section-index="1"
        className={`relative z-10 px-6 sm:px-8 lg:px-12 pb-12 transition-all duration-700 ${
          fadeSections[1].isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-4 sm:gap-6">
          {stats.map((stat) => (
            <Card key={stat.labelKey} className="bg-card/50 border-border/50">
              <CardContent className="p-4 sm:p-6 text-center">
                <div className="flex justify-center mb-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-950/50">
                    <stat.icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground mt-1">{t(stat.labelKey)}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Modules */}
      <section
        ref={fadeSections[2].setRef}
        data-section-index="2"
        className={`relative z-10 px-6 sm:px-8 lg:px-12 pb-16 transition-all duration-700 ${
          fadeSections[2].isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-2">{t('landing.modules.title')}</h2>
          <p className="text-center text-muted-foreground mb-8 max-w-2xl mx-auto">{t('landing.modules.subtitle')}</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {modules.map((mod) => (
              <Card key={mod.titleKey} className="group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-border/50">
                <CardContent className="p-6 flex items-start gap-4">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${mod.bg} group-hover:scale-110 transition-transform duration-300`}>
                    <mod.icon className={`h-6 w-6 ${mod.color}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1.5">{t(mod.titleKey)}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{t(mod.descKey)}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Databases */}
      <section
        id="databases"
        ref={fadeSections[3].setRef}
        data-section-index="3"
        className={`relative z-10 px-6 sm:px-8 lg:px-12 pb-20 transition-all duration-700 ${
          fadeSections[3].isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-2">{t('landing.databases.title')}</h2>
          <p className="text-center text-muted-foreground mb-10 max-w-2xl mx-auto">{t('landing.databases.subtitle')}</p>
          <div className="grid gap-6 md:grid-cols-3">
            {databases.map((db) => (
              <Card key={db.nameKey} className={`group border-2 ${db.borderColor} hover:shadow-xl hover:-translate-y-2 transition-all duration-300`}>
                <CardContent className="p-8 flex flex-col items-center text-center">
                  <div className={`flex h-16 w-16 items-center justify-center rounded-2xl ${db.bg} mb-5 group-hover:scale-110 transition-transform duration-300`}>
                    <db.icon className={`h-8 w-8 ${db.color}`} />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{t(db.nameKey)}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{t(db.descKey)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why SQL Trainer */}
      <section
        id="why"
        ref={fadeSections[4].setRef}
        data-section-index="4"
        className={`relative z-10 px-6 sm:px-8 lg:px-12 pb-20 transition-all duration-700 ${
          fadeSections[4].isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-2">{t('landing.why.title')}</h2>
          <p className="text-center text-muted-foreground mb-10 max-w-2xl mx-auto">{t('landing.why.subtitle')}</p>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {whyItems.map((item) => (
              <Card key={item.titleKey} className="group hover:shadow-lg transition-all duration-300 border-border/50">
                <CardContent className="p-5 flex flex-col items-start text-center sm:text-left h-full">
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${item.bg} mb-3 group-hover:scale-110 transition-transform duration-300`}>
                    <item.icon className={`h-5 w-5 ${item.color}`} />
                  </div>
                  <h3 className="font-semibold mb-2">{t(item.titleKey)}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{t(item.descKey)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section
        ref={fadeSections[5].setRef}
        data-section-index="5"
        className={`relative z-10 px-6 sm:px-8 lg:px-12 pb-20 transition-all duration-700 ${
          fadeSections[5].isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-2">{t('landing.howItWorks.title')}</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">{t('landing.howItWorks.subtitle')}</p>
          <div className="grid gap-8 sm:grid-cols-3">
            {howItWorks.map((step, idx) => (
              <div key={step.step} className="relative flex flex-col items-center text-center">
                {/* Connector line between steps */}
                {idx < howItWorks.length - 1 && (
                  <div className="hidden sm:block absolute top-7 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-blue-500 to-transparent dark:from-blue-400" />
                )}
                <div className="relative mb-5">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 shadow-lg">
                    <step.icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-background border-2 border-blue-600 text-xs font-bold text-blue-600 dark:text-blue-400 dark:border-blue-400">
                    {step.step}
                  </div>
                </div>
                <h3 className="font-semibold mb-2 text-lg">{t(step.titleKey)}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{t(step.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Curriculum */}
      <section
        id="curriculum"
        ref={fadeSections[6].setRef}
        data-section-index="6"
        className={`relative z-10 px-6 sm:px-8 lg:px-12 pb-20 transition-all duration-700 ${
          fadeSections[6].isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-2">{t('landing.curriculum.title')}</h2>
          <p className="text-center text-muted-foreground mb-10 max-w-2xl mx-auto">{t('landing.curriculum.subtitle')}</p>
          <div className="grid gap-6 md:grid-cols-3">
            {curriculumLevels.map((lvl) => (
              <Card key={lvl.level} className={`group border-2 ${lvl.borderColor} hover:shadow-xl hover:-translate-y-1 transition-all duration-300`}>
                <CardContent className="p-6">
                  <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold mb-5 ${lvl.bgColor} ${lvl.color}`}>
                    {t(lvl.level)}
                  </div>
                  <ul className="space-y-3">
                    {lvl.topics.map((topic) => (
                      <li key={topic} className="flex items-start gap-3 text-sm">
                        <span className="mt-1.5 h-2 w-2 rounded-full bg-blue-500 shrink-0 group-hover:scale-125 transition-transform" />
                        <span className="text-muted-foreground">{t(topic)}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Task categories preview */}
      <section
        ref={fadeSections[7].setRef}
        data-section-index="7"
        className={`relative z-10 px-6 sm:px-8 lg:px-12 pb-16 transition-all duration-700 ${
          fadeSections[7].isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <h3 className="font-semibold">{t('landing.modules.tasks.title')}</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="text-xs">{t('landing.taskCategories.company')}</Badge>
                <Badge variant="secondary" className="text-xs">{t('landing.taskCategories.store')}</Badge>
                <Badge variant="secondary" className="text-xs">{t('landing.taskCategories.analytics')}</Badge>
                <Badge variant="secondary" className="text-xs">{t('landing.taskCategories.exams')}</Badge>
                <span className="text-xs text-muted-foreground self-center ml-2">
                  {t('landing.taskCategories.taskCount')}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-400 text-xs">
                  {t('landing.difficultyLevels.beginner')}
                </Badge>
                <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400 text-xs">
                  {t('landing.difficultyLevels.intermediate')}
                </Badge>
                <Badge className="bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-400 text-xs">
                  {t('landing.difficultyLevels.advanced')}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Testimonials */}
      <section
        ref={fadeSections[8].setRef}
        data-section-index="8"
        className={`relative z-10 px-6 sm:px-8 lg:px-12 pb-20 transition-all duration-700 ${
          fadeSections[8].isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-2">{t('landing.testimonials.title')}</h2>
          <p className="text-center text-muted-foreground mb-10 max-w-2xl mx-auto">{t('landing.testimonials.subtitle')}</p>
          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-border/50">
                <CardContent className="p-6 flex flex-col h-full">
                  <Quote className="h-8 w-8 text-blue-200 dark:text-blue-800 mb-4" />
                  <p className="text-sm text-muted-foreground flex-1 mb-5 italic leading-relaxed">
                    {t(testimonial.quoteKey)}
                  </p>
                  <div className="flex items-center gap-3 pt-4 border-t border-border/50">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-white text-sm font-semibold">
                      {t(testimonial.nameKey).charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{t(testimonial.nameKey)}</div>
                      <div className="text-xs text-muted-foreground">{t(testimonial.roleKey)}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      {(() => {
        const faqSection = fadeSections[9];
        return (
        <section
          id="faq"
          ref={faqSection.setRef}
          data-section-index="9"
          className={`relative z-10 px-6 sm:px-8 lg:px-12 pb-16 transition-all duration-700 ${
            faqSection.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-2">{t('landing.faq.title')}</h2>
          <p className="text-center text-muted-foreground mb-8 max-w-2xl mx-auto">{t('landing.faq.subtitle')}</p>
          <Accordion type="single" collapsible className="w-full">
            {faqItems.map((item, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left font-semibold">
                  {t(item.titleKey)}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {t(item.contentKey)}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
        );
      })()}

      {/* Features strip */}
      <section className="relative z-10 px-6 sm:px-8 lg:px-12 pb-16">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-4 sm:gap-6">
          {features.map((f) => (
            <div key={f.labelKey} className="flex items-center gap-2 text-sm text-muted-foreground">
              <f.icon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span>{t(f.labelKey)}</span>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Footer */}
      <section className="relative z-10 px-6 sm:px-8 lg:px-12 pb-20 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-3xl bg-gradient-to-br from-blue-600 to-blue-800 dark:from-blue-700 dark:to-blue-950 p-10 sm:p-14 shadow-2xl">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-white">{t('landing.cta.title')}</h2>
            <p className="text-blue-100 dark:text-blue-200 mb-8 max-w-xl mx-auto">{t('landing.cta.subtitle')}</p>
            <Link href="/register">
              <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50 h-12 px-10 text-base font-semibold shadow-lg">
                <GraduationCap className="h-5 w-5 mr-2" />
                {t('landing.cta.button')}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/50 bg-card">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 py-12">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-700">
                  <GraduationCap className="h-4 w-4 text-white" />
                </div>
                <span className="text-base font-bold">
                  SQL <span className="text-blue-600">Trainer</span>
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {t('landing.hero.subtitle')}
              </p>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                </Button>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">{t('landing.footer.features')}</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li>
                  <Link href="/register" className="hover:text-foreground transition-colors">
                    {t('landing.modules.tasks.title')}
                  </Link>
                </li>
                <li>
                  <Link href="/register" className="hover:text-foreground transition-colors">
                    {t('landing.modules.editor.title')}
                  </Link>
                </li>
                <li>
                  <Link href="/register" className="hover:text-foreground transition-colors">
                    {t('landing.modules.progress.title')}
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">{t('landing.footer.about')}</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li>
                  <Link href="#" className="hover:text-foreground transition-colors">
                    {t('landing.footer.documentation')}
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground transition-colors">
                    {t('landing.footer.sourceCode')}
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground transition-colors">
                    {t('landing.footer.community')}
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">{t('landing.footer.terms')}</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li>
                  <Link href="#" className="hover:text-foreground transition-colors">
                    {t('landing.footer.privacy')}
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground transition-colors">
                    {t('landing.footer.terms')}
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-10 pt-8 border-t border-border/50 text-center text-sm text-muted-foreground">
            © {currentYear} SQL Trainer. {t('landing.footer.copyright')}
          </div>
        </div>
      </footer>
    </div>
  );
}
