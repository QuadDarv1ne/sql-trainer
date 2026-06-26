'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { useSQLTrainerStore } from '@/lib/store';
import { getTaskById, TRAINING_TASKS } from '@/lib/training-tasks';
import { type DatabaseInfo } from '@/lib/sql-engine';
import { t } from '@/lib/i18n';
import { getNextHintLevel, generateProgressiveHints, calculateHintPenalty } from '@/lib/progressive-hints';
import { logger } from '@/lib/logger';
import { useQueryExecutor } from '@/hooks/use-query-executor';
import { TimerDisplay } from '@/components/timer-display';
import ResultsTable from '@/components/results-table';
import ActionBar from '@/components/action-bar';
import ExplainPanel from '@/components/explain-panel';
import EmptyResults from '@/components/empty-results';
import { formatSQL } from '@/components/sql-editor';
import Sidebar from '@/components/sidebar';
import TaskPanel from '@/components/task-panel';
import DbSelector from '@/components/db-selector';
import SchemaViewer from '@/components/schema-viewer';
import ShortcutsHelp from '@/components/shortcuts-help';
import LocaleSelector from '@/components/locale-selector';
import UserMenu from '@/components/auth/user-menu';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { PanelLeftClose, PanelLeftOpen, Table as TableIcon, Loader2, Menu } from 'lucide-react';

// Dynamic import for SQL Editor (no SSR)
const SQLEditor = dynamic(() => import('@/components/sql-editor'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-[#282c34] rounded-md">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  ),
});

type SQLEditorRef = import('@/components/sql-editor').SQLEditorRef;

// Dynamic import for SQL Reference
const SQLReference = dynamic(() => import('@/components/sql-reference'), {
  ssr: false,
});

// Dynamic import for SQL Glossary
const SQLGlossary = dynamic(() => import('@/components/sql-glossary'), {
  ssr: false,
});

// Dynamic import for Welcome Panel
const WelcomePanel = dynamic(() => import('@/components/welcome-panel'), {
  ssr: false,
});

// Dynamic import for Onboarding Tour
const OnboardingTour = dynamic(() => import('@/components/onboarding-tour'), {
  ssr: false,
});

export default function HomePage() {
  const {
    dbType,
    setDbType,
    currentTaskId,
    setCurrentTaskId,
    editorContent,
    setEditorContent,
    lastResult,
    setLastResult,
    verification,
    setVerification,
    sidebarOpen,
    setSidebarOpen,
    hintLevel,
    setHintLevel,
    totalHintPenalty,
    setTotalHintPenalty,
    solutionVisible,
    setSolutionVisible,
    isExecuting,
    setIsExecuting,
    isTaskCompleted,
    completedTasks,
    practiceMode,
    unlockedAchievements,
    userStats,
    onboardingCompleted,
    setOnboardingCompleted,
    toggleBookmark,
  } = useSQLTrainerStore();

  const editorRef = useRef<SQLEditorRef>(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Show toast notifications for newly unlocked achievements
  const shownAchievementIdsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    for (const achievement of unlockedAchievements) {
      if (achievement.unlockedAt && !shownAchievementIdsRef.current.has(achievement.id)) {
        toast.success(t('achievement.toast.title'), {
          description: t('achievement.toast.description', { title: achievement.title }),
          duration: 5000,
        });
        shownAchievementIdsRef.current.add(achievement.id);
      }
    }
  }, [unlockedAchievements]);

  const { theme } = useTheme();
  const { data: session } = useSession();
  const [schemaInfo, setSchemaInfo] = useState<DatabaseInfo | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  const [explainPlan, setExplainPlan] = useState<string | null>(null);
  const [explainSuggestions, setExplainSuggestions] = useState<string[]>([]);
  const [showOnboarding, setShowOnboarding] = useState(!onboardingCompleted);
  const [referenceTab, setReferenceTab] = useState<'reference' | 'glossary'>('reference');

  const { executeQuery, executeExplain, executeVerify, attemptCountRef } = useQueryExecutor({
    editorContent,
    isExecuting,
    dbType,
    currentTaskId,
    setIsExecuting,
    setLastResult,
    setVerification,
    setExplainPlan,
    setExplainSuggestions,
  });

  // Load server progress on mount for authenticated users
  useEffect(() => {
    if (!session?.user) return;
    const controller = new AbortController();
    fetch('/api/user/progress', { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (data.success && data.progress?.length > 0) {
          const { markTaskCompleted, isTaskCompleted } = useSQLTrainerStore.getState();
          data.progress.forEach((p: { taskId: string; attempts: number; completedAt: number }) => {
            if (!isTaskCompleted(p.taskId)) {
              markTaskCompleted(p.taskId, p.attempts);
            }
          });
        }
      })
      .catch((e) => {
        if (e.name !== 'AbortError') {
          logger.error('Failed to sync server progress', e);
        }
      });
    return () => {
      controller.abort();
    };
  }, [session?.user]);

  const confirmAction = useCallback((message: string): Promise<boolean> => {
    return Promise.resolve(window.confirm(message));
  }, []);

  // Get current task
  const currentTask = useMemo(() => (currentTaskId ? getTaskById(currentTaskId) : null), [currentTaskId]);

  // Load schema when task changes
  useEffect(() => {
    if (!currentTask) {
      return;
    }

    let cancelled = false;

    const loadSchema = async () => {
      attemptCountRef.current = 0;
      setSchemaInfo(null);

      try {
        const res = await fetch('/api/sql/init-training', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ taskId: currentTask.id, dbType }),
        });
        const data = await res.json();
        if (!cancelled && data.success && data.schema) {
          setSchemaInfo(data.schema);
        }
      } catch (e) {
        logger.error('Failed to initialize training schema', e);
      }
    };

    loadSchema();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- attemptCountRef is a mutable ref, not reactive
  }, [currentTask, dbType]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        executeQuery();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
        e.preventDefault();
        setEditorContent('');
        setLastResult(null);
        setVerification(null);
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'H') {
        e.preventDefault();
        const nextLevel = getNextHintLevel(hintLevel);
        if (nextLevel !== null && currentTask) {
          setHintLevel(nextLevel);
          const hints = generateProgressiveHints(
            currentTask.id,
            currentTask.hint,
            currentTask.taskText,
            currentTask.progressiveHints,
          );
          setTotalHintPenalty(calculateHintPenalty(hints, nextLevel));
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        setSolutionVisible(!solutionVisible);
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'F') {
        e.preventDefault();
        setEditorContent(formatSQL(editorContent));
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        setSidebarOpen(!sidebarOpen);
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'B') {
        e.preventDefault();
        if (currentTaskId) toggleBookmark(currentTaskId);
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'E') {
        e.preventDefault();
        executeQuery();
        if (currentTaskId) executeVerify?.();
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'X') {
        e.preventDefault();
        const { clearHistory } = useSQLTrainerStore.getState();
        if (window.confirm(t('action.clearHistoryConfirm', { default: 'Clear query history?' }))) {
          clearHistory();
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        const cycle: Array<'light' | 'dark' | 'system'> = ['light', 'dark', 'system'];
        const idx = cycle.indexOf((theme as 'light' | 'dark' | 'system') || 'system');
        const next = cycle[(idx + 1) % cycle.length];
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('next-theme', next);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    executeQuery,
    hintLevel,
    solutionVisible,
    setHintLevel,
    setSolutionVisible,
    setEditorContent,
    setLastResult,
    setVerification,
    setTotalHintPenalty,
    editorContent,
    currentTask,
    sidebarOpen,
    setSidebarOpen,
    theme,
    toggleBookmark,
    currentTaskId,
    executeVerify,
  ]);

  // Clear editor
  const clearEditor = () => {
    setEditorContent('');
    setLastResult(null);
    setVerification(null);
    setExplainPlan(null);
    setExplainSuggestions([]);
  };

  // Reset DB (re-init task)
  const resetDb = async () => {
    const confirmed = await confirmAction(
      t('app.resetDbConfirm', {
        default: 'Are you sure you want to reset the database? All unsaved changes will be lost.',
      }),
    );
    if (!confirmed) return;

    setIsExecuting(true);
    try {
      if (currentTask) {
        const res = await fetch('/api/sql/init-training', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ taskId: currentTask.id, dbType }),
        });
        const data = await res.json();
        if (data.success && data.schema) {
          setSchemaInfo(data.schema);
        }
      }
      setEditorContent('');
      setLastResult(null);
      setVerification(null);
      setExplainPlan(null);
      setExplainSuggestions([]);
      toast.success(t('results.ddlSuccess'));
    } catch (e) {
      logger.error('Failed to reset training schema', e);
      toast.error(t('results.queryError'));
    } finally {
      setIsExecuting(false);
    }
  };

  // Compute next task info
  const nextTaskInfo = useMemo(() => {
    if (!currentTask) return { hasNext: false, label: '', isLastTask: false, allCompleted: false };

    const currentIndex = TRAINING_TASKS.findIndex((t) => t.id === currentTask.id);
    const allDone = completedTasks.length === TRAINING_TASKS.length;

    if (currentIndex < TRAINING_TASKS.length - 1) {
      const nextTask = TRAINING_TASKS[currentIndex + 1];
      const currentDiff = currentTask.difficulty;
      const nextDiff = nextTask.difficulty;

      let label = t('task.next.label', { title: nextTask.title });

      if (currentDiff !== nextDiff) {
        label = t('task.next.level', { title: nextTask.title });
      }

      return { hasNext: true, label, isLastTask: false, allCompleted: false };
    }

    return { hasNext: false, label: '', isLastTask: true, allCompleted: allDone };
  }, [currentTask, completedTasks]);

  // Find related tasks (same topic or similar title keywords)
  const relatedTasks = useMemo(() => {
    if (!currentTask) return [];

    // Extract keywords from current task title
    const currentTitle = currentTask.title.toLowerCase();
    const currentDesc = currentTask.description.toLowerCase();

    // Find tasks with similar topics
    const related = TRAINING_TASKS.filter((t) => {
      if (t.id === currentTask.id) return false;

      // Check for shared keywords in title/description
      const titleWords = new Set([...currentTitle.split(/\s+/), ...currentDesc.split(/\s+/)]);
      const otherTitle = t.title.toLowerCase();
      const otherDesc = t.description.toLowerCase();

      // Check if any word from current task appears in other task
      for (const word of titleWords) {
        if (word.length > 3 && (otherTitle.includes(word) || otherDesc.includes(word))) {
          return true;
        }
      }
      return false;
    });

    // Return up to 3 related tasks, prioritizing same difficulty
    const sameDifficulty = related.filter((t) => t.difficulty === currentTask.difficulty);
    const otherDifficulty = related.filter((t) => t.difficulty !== currentTask.difficulty);

    return [...sameDifficulty, ...otherDifficulty].slice(0, 3);
  }, [currentTask]);

  const goToNextTask = useCallback(() => {
    if (!currentTask) return;
    const currentIndex = TRAINING_TASKS.findIndex((t) => t.id === currentTask.id);
    if (currentIndex < TRAINING_TASKS.length - 1) {
      setCurrentTaskId(TRAINING_TASKS[currentIndex + 1].id);
    }
  }, [currentTask, setCurrentTaskId]);

  const goToRelatedTask = useCallback(
    (taskIndex: number) => {
      if (relatedTasks[taskIndex]) {
        setCurrentTaskId(relatedTasks[taskIndex].id);
      }
    },
    [relatedTasks, setCurrentTaskId],
  );

  const handleRestoreQuery = useCallback(
    (sql: string) => {
      setEditorContent(sql);
    },
    [setEditorContent],
  );

  const handlePreviewTable = useCallback(
    (tableName: string) => {
      setEditorContent(`SELECT * FROM ${tableName} LIMIT 100;`);
    },
    [setEditorContent],
  );

  const handleInsertTemplate = useCallback(
    (sql: string) => {
      setEditorContent(sql);
    },
    [setEditorContent],
  );

  const handleStartTraining = useCallback(() => {
    const firstIncomplete = TRAINING_TASKS.find((t) => !isTaskCompleted(t.id));
    if (firstIncomplete) {
      setCurrentTaskId(firstIncomplete.id);
    }
  }, [isTaskCompleted, setCurrentTaskId]);

  const handleFreeMode = useCallback(() => {
    setCurrentTaskId(null);
  }, [setCurrentTaskId]);

  const handleOnboardingComplete = useCallback(() => {
    setShowOnboarding(false);
    setOnboardingCompleted(true);
  }, [setOnboardingCompleted]);

  if (!mounted) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <header className="flex h-14 sm:h-16 shrink-0 items-center justify-between border-b border-border/60 bg-background/80 backdrop-blur-md shadow-sm px-3 sm:px-4 lg:px-6">
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Mobile menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden h-9 w-9 rounded-lg" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[340px] p-0">
              <SheetHeader className="border-b border-border px-4 sm:px-5 py-3 sm:py-4 bg-gradient-to-r from-muted/50 to-muted/30">
                <SheetTitle className="text-base font-semibold">{t('header.tasks')}</SheetTitle>
              </SheetHeader>
              <Sidebar />
            </SheetContent>
          </Sheet>

          {/* Desktop sidebar toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:flex h-9 sm:h-10 w-9 sm:w-10 rounded-lg hover:bg-muted/70 transition-all"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {sidebarOpen ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />}
          </Button>

          {/* Logo */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-lg shadow-blue-500/25">
              <TableIcon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <h1 className="text-base sm:text-lg font-bold tracking-tight hidden sm:block bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              SQL{' '}
              <span className="bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent">Trainer</span>
            </h1>
          </div>

          {/* Level badge - hidden on very small screens */}
          <div className="hidden xs:flex sm:flex items-center gap-2 sm:gap-3 rounded-xl bg-gradient-to-r from-muted/80 to-muted/50 px-2 sm:px-4 py-1.5 sm:py-2 border border-border/50 shadow-sm">
            <div className="flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-[10px] sm:text-xs font-bold text-white shadow-lg shadow-blue-500/25">
              {userStats.level}
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-[10px] sm:text-xs font-semibold text-foreground">
                {t('app.level', { default: 'Lvl' })}. {userStats.level}
              </span>
              <div className="h-1 sm:h-1.5 w-16 sm:w-24 rounded-full bg-muted-foreground/20 overflow-hidden mt-0.5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
                  style={{ width: `${userStats.levelProgress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Timer display - visible in practice mode */}
          <div className="hidden lg:block">
            <TimerDisplay />
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3">
          {/* Locale Selector - hidden on mobile */}
          <div className="hidden sm:block">
            <LocaleSelector />
          </div>

          {/* DB Selector - compact on mobile */}
          <DbSelector dbType={dbType} onChange={setDbType} />

          {/* Shortcuts help - hidden on mobile */}
          <div className="hidden sm:block">
            <ShortcutsHelp />
          </div>

          {/* Theme toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg hover:bg-muted/70 transition-all"
              >
                <ThemeToggle />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              {mounted && theme === 'dark'
                ? t('header.theme.system')
                : mounted && theme === 'system'
                  ? t('header.theme.light')
                  : t('header.theme.dark')}
            </TooltipContent>
          </Tooltip>

          {/* User menu */}
          <UserMenu />
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <aside
          className={`hidden md:flex shrink-0 border-r border-border/50 transition-all duration-300 ease-in-out ${
            sidebarOpen ? 'w-[280px]' : 'w-0 overflow-hidden'
          } bg-gradient-to-r from-muted/40 to-muted/20`}
        >
          <div className="w-[280px]">
            <Sidebar />
          </div>
        </aside>

        {/* Center: Editor + Results */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Action bar */}
          <ActionBar
            isExecuting={isExecuting}
            executeQuery={executeQuery}
            executeExplain={executeExplain}
            executeVerify={executeVerify}
            clearEditor={clearEditor}
            resetDb={resetDb}
            onRestoreQuery={handleRestoreQuery}
            onLoadQuery={handleRestoreQuery}
            onInsertTemplate={handleInsertTemplate}
            onUndo={() => editorRef.current?.undo()}
            onRedo={() => editorRef.current?.redo()}
            canUndo={canUndo}
            canRedo={canRedo}
            currentTaskId={currentTaskId}
            practiceMode={practiceMode}
          />

          {/* Editor + Results panels */}
          <ResizablePanelGroup direction="vertical" className="flex-1">
            <ResizablePanel defaultSize={55} minSize={35}>
              <div className="h-full p-3">
                <SQLEditor
                  ref={editorRef}
                  value={editorContent}
                  onChange={setEditorContent}
                  onRun={executeQuery}
                  onFormatSQL={() => setEditorContent(formatSQL(editorContent))}
                  onHistoryChange={(canUndo, canRedo) => {
                    setCanUndo(canUndo);
                    setCanRedo(canRedo);
                  }}
                  height="100%"
                  placeholder={
                    currentTask
                      ? t('editor.placeholder.task', { title: currentTask.title })
                      : t('editor.placeholder.free')
                  }
                  schema={
                    schemaInfo
                      ? {
                          tables: schemaInfo.tables.map((t) => ({
                            name: t.name,
                            columns: t.columns.map((c) => ({ name: c.name, type: c.type })),
                          })),
                        }
                      : null
                  }
                />
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={45} minSize={30}>
              <div className="h-full overflow-hidden p-3">
                {explainPlan ? (
                  <ExplainPanel
                    plan={explainPlan}
                    suggestions={explainSuggestions}
                    onClose={() => setExplainPlan(null)}
                  />
                ) : lastResult ? (
                  <ResultsTable
                    success={lastResult.success}
                    columns={lastResult.columns}
                    rows={lastResult.rows}
                    error={lastResult.error}
                    executionTime={lastResult.executionTime}
                    message={lastResult.message}
                    verification={verification || undefined}
                    suggestion={lastResult.suggestion}
                    isExecuting={isExecuting}
                  />
                ) : (
                  <EmptyResults />
                )}
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>

        {/* Right panel: Task info + Schema + Reference */}
        <aside className="hidden lg:flex w-[280px] shrink-0 flex-col border-l border-border/50 bg-gradient-to-l from-muted/40 to-muted/20">
          <ResizablePanelGroup direction="vertical">
            <ResizablePanel defaultSize={50} minSize={30}>
              <ScrollArea className="h-full">
                <div className="p-3">
                  {currentTask ? (
                    <TaskPanel
                      task={currentTask}
                      isCompleted={currentTaskId ? isTaskCompleted(currentTaskId) : false}
                      hintLevel={hintLevel}
                      totalHintPenalty={totalHintPenalty}
                      onRevealNextHint={() => {
                        const nextLevel = getNextHintLevel(hintLevel);
                        if (nextLevel !== null && currentTask) {
                          setHintLevel(nextLevel);
                          const hints = generateProgressiveHints(
                            currentTask.id,
                            currentTask.hint,
                            currentTask.taskText,
                            currentTask.progressiveHints,
                          );
                          setTotalHintPenalty(calculateHintPenalty(hints, nextLevel));
                        }
                      }}
                      solutionVisible={solutionVisible}
                      onShowSolution={() => setSolutionVisible(!solutionVisible)}
                      onUseSolution={(sql) => setEditorContent(sql)}
                      onNextTask={goToNextTask}
                      onNextRelated={(index) => goToRelatedTask(index)}
                      nextTaskLabel={nextTaskInfo.label}
                      allCompleted={nextTaskInfo.allCompleted}
                      relatedTasks={relatedTasks}
                    />
                  ) : (
                    <WelcomePanel
                      onStartTraining={handleStartTraining}
                      onFreeMode={handleFreeMode}
                      onStartTour={() => setShowOnboarding(true)}
                    />
                  )}
                </div>
              </ScrollArea>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={30} minSize={20}>
              <div className="p-3">
                <SchemaViewer schema={schemaInfo} onPreviewTable={handlePreviewTable} />
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={20} minSize={15}>
              <div className="flex h-full flex-col">
                {/* Tab switcher */}
                <div className="flex border-b border-border/50 bg-muted/30">
                  <button
                    onClick={() => setReferenceTab('reference')}
                    className={`flex-1 px-3 py-2 text-xs font-semibold transition-all ${
                      referenceTab === 'reference'
                        ? 'bg-gradient-to-b from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 text-blue-700 dark:text-blue-400 border-b-2 border-blue-500'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }`}
                  >
                    {t('sqlRef.title')}
                  </button>
                  <button
                    onClick={() => setReferenceTab('glossary')}
                    className={`flex-1 px-3 py-2 text-xs font-semibold transition-all ${
                      referenceTab === 'glossary'
                        ? 'bg-gradient-to-b from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 text-blue-700 dark:text-blue-400 border-b-2 border-blue-500'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }`}
                  >
                    {t('glossary.title')}
                  </button>
                </div>
                <div className="flex-1 overflow-hidden">
                  {referenceTab === 'reference' ? (
                    <SQLReference onInsertExample={(sql) => setEditorContent(sql)} />
                  ) : (
                    <SQLGlossary />
                  )}
                </div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </aside>
      </div>

      {/* Onboarding Tour */}
      {showOnboarding && <OnboardingTour onComplete={handleOnboardingComplete} />}
    </div>
  );
}
