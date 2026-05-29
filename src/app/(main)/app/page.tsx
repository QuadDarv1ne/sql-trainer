'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { useSQLTrainerStore } from '@/lib/store';
import { getTaskById, TRAINING_TASKS } from '@/lib/training-tasks';
import { type DatabaseInfo } from '@/lib/sql-engine';
import { plural } from '@/lib/utils';
import { t } from '@/lib/i18n';
import { getNextHintLevel, generateProgressiveHints, calculateHintPenalty } from '@/lib/progressive-hints';
import { logger } from '@/lib/logger';
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
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Sun,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Table as TableIcon,
  Loader2,
  Menu,
} from 'lucide-react';

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
    addQueryHistory,
    isTaskCompleted,
    markTaskCompleted,
    completedTasks,
    updateStreak,
    practiceMode,
    nextPracticeTask,
    unlockedAchievements,
    userStats,
    incrementExplainCount,
    onboardingCompleted,
    setOnboardingCompleted,
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

  const { theme, setTheme } = useTheme();
  const { data: session } = useSession();
  const [schemaInfo, setSchemaInfo] = useState<DatabaseInfo | null>(null);
  const attemptCountRef = useRef(0);
  const practiceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [mounted, setMounted] = useState(false);
  const progressSyncRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setMounted(true);
    return () => {
      if (practiceTimerRef.current) {
        clearTimeout(practiceTimerRef.current);
      }
      progressSyncRef.current?.abort();
    };
  }, []);
  const [explainPlan, setExplainPlan] = useState<string | null>(null);
  const [explainSuggestions, setExplainSuggestions] = useState<string[]>([]);
  const [showOnboarding, setShowOnboarding] = useState(!onboardingCompleted);
  const [referenceTab, setReferenceTab] = useState<'reference' | 'glossary'>('reference');

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
    return () => { controller.abort(); };
  }, [session?.user]);

  // Get current task
  const currentTask = useMemo(
    () => (currentTaskId ? getTaskById(currentTaskId) : null),
    [currentTaskId]
  );

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
    return () => { cancelled = true; };
  }, [currentTask, dbType]);

  // Execute query
  const executeQuery = useCallback(async () => {
    if (!editorContent.trim() || isExecuting) return;

    setIsExecuting(true);
    attemptCountRef.current += 1;
    setVerification(null);

    try {
      const response = await fetch('/api/sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: editorContent, dbType, taskId: currentTaskId }),
      });

      const data = await response.json();

      setLastResult({
        success: data.success,
        columns: data.columns || [],
        rows: data.rows || [],
        error: data.error,
        executionTime: data.executionTime || 0,
        message: data.message,
      });

      addQueryHistory({
        sql: editorContent,
        timestamp: Date.now(),
        success: data.success,
        executionTime: data.executionTime || 0,
        rowCount: data.rows?.length,
      });

      // Verify task if there's a current task and query succeeded with results
      if (currentTaskId && data.success && data.rows && data.rows.length > 0) {
        try {
          const verifyResponse = await fetch('/api/sql/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sql: editorContent, taskId: currentTaskId, dbType }),
          });

          const verifyData = await verifyResponse.json();
          setVerification({
            verified: verifyData.verified,
            userRowCount: verifyData.userRowCount,
            expectedRowCount: verifyData.expectedRowCount,
            message: verifyData.message,
          });

          // Mark task as completed only when verified
          if (verifyData.verified && !isTaskCompleted(currentTaskId)) {
            markTaskCompleted(currentTaskId, attemptCountRef.current);
            updateStreak();
            toast.success(t('task.completed'), {
              description: `${attemptCountRef.current} ${plural(attemptCountRef.current, t('task.attempts'), t('task.attemptsFew'), t('task.attemptsMany'))}`,
            });

            // Auto-advance in practice mode
            if (practiceMode.active) {
              practiceTimerRef.current = setTimeout(() => {
                practiceTimerRef.current = null;
                nextPracticeTask();
              }, 1500);
            }

            // Sync progress to server for authenticated users
            if (session?.user) {
              progressSyncRef.current?.abort();
              progressSyncRef.current = new AbortController();
              fetch('/api/user/progress', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  taskId: currentTaskId,
                  attempts: attemptCountRef.current,
                }),
                signal: progressSyncRef.current.signal,
              })
                .then((res) => {
                  if (!res.ok) throw new Error(`HTTP ${res.status}`);
                  // Check for new achievements after progress sync
                  const signal = progressSyncRef.current;
                  return fetch('/api/user/achievements?check=true', { signal: signal ? signal.signal : undefined });
                })
                .then((res) => {
                  if (!res.ok) throw new Error(`HTTP ${res.status}`);
                  return res.json();
                })
                .then((data) => {
                  if (data.success && data.newAchievements?.length > 0) {
                    data.newAchievements.forEach((achievement: { id: string; title: string }) => {
                      toast.success(t('achievement.toast.title'), {
                        description: t('achievement.toast.description', { title: achievement.title }),
                        duration: 5000,
                      });
                    });
                  }
                })
                .catch((e) => {
                  if (e.name !== 'AbortError') {
                    logger.error('Failed to check achievements', e);
                  }
                });
            }
          }
        } catch (e) {
          // Verification failed — still show results but notify user
          logger.error('Task verification failed', e);
          toast.error(t('task.verificationError', { default: 'Не удалось проверить результат запроса' }));
        }
      }
    } catch {
      setLastResult({
        success: false,
        columns: [],
        rows: [],
        error: t('results.error'),
        executionTime: 0,
      });
    } finally {
      setIsExecuting(false);
    }
  }, [
    editorContent,
    isExecuting,
    dbType,
    currentTaskId,
    setIsExecuting,
    setLastResult,
    addQueryHistory,
    isTaskCompleted,
    markTaskCompleted,
    updateStreak,
    setVerification,
    session,
    practiceMode.active,
    nextPracticeTask,
  ]);

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
          const hints = generateProgressiveHints(currentTask.id, currentTask.hint, currentTask.taskText, currentTask.sampleSolution);
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
  ]);

  // Clear editor
  const clearEditor = () => {
    setEditorContent('');
    setLastResult(null);
    setVerification(null);
    setExplainPlan(null);
    setExplainSuggestions([]);
  };

  // Explain query
  const executeExplain = useCallback(async () => {
    if (!editorContent.trim() || isExecuting || !currentTaskId) return;

    setIsExecuting(true);
    setExplainPlan(null);

    try {
      const response = await fetch('/api/sql/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: editorContent, dbType, taskId: currentTaskId }),
      });

      const data = await response.json();

      if (data.success && data.plan) {
        setExplainPlan(data.plan);
        setExplainSuggestions(data.suggestions || []);
        incrementExplainCount();
      } else {
        setExplainPlan(`${t('results.error')}: ${data.error}`);
        setExplainSuggestions([]);
      }
    } catch {
      setExplainPlan(t('results.error'));
      setExplainSuggestions([]);
    } finally {
      setIsExecuting(false);
    }
  }, [editorContent, isExecuting, dbType, currentTaskId, setIsExecuting, incrementExplainCount]);

  // Reset DB (re-init task)
  const resetDb = () => {
    if (currentTask) {
      fetch('/api/sql/init-training', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: currentTask.id, dbType }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.schema) {
            setSchemaInfo(data.schema);
          }
        })
        .catch((e) => logger.error('Failed to reset training schema', e));
    }
    setEditorContent('');
    setLastResult(null);
    setVerification(null);
  };

  // Compute next task info
  const nextTaskInfo = useMemo(() => {
    if (!currentTask)
      return { hasNext: false, label: '', isLastTask: false, allCompleted: false };

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

  const goToRelatedTask = useCallback((taskIndex: number) => {
    if (relatedTasks[taskIndex]) {
      setCurrentTaskId(relatedTasks[taskIndex].id);
    }
  }, [relatedTasks, setCurrentTaskId]);

  const handleRestoreQuery = useCallback(
    (sql: string) => {
      setEditorContent(sql);
    },
    [setEditorContent]
  );

  const handlePreviewTable = useCallback(
    (tableName: string) => {
      setEditorContent(`SELECT * FROM ${tableName} LIMIT 100;`);
    },
    [setEditorContent]
  );

  const handleInsertTemplate = useCallback(
    (sql: string) => {
      setEditorContent(sql);
    },
    [setEditorContent]
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
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
        <div className="flex items-center gap-4">
          {/* Mobile menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden h-9 w-9">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0">
              <SheetHeader className="border-b border-border px-5 py-4">
                <SheetTitle className="text-base">{t('header.tasks')}</SheetTitle>
              </SheetHeader>
              <Sidebar />
            </SheetContent>
          </Sheet>

          {/* Desktop sidebar toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:flex h-9 w-9"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? (
              <PanelLeftClose className="h-5 w-5" />
            ) : (
              <PanelLeftOpen className="h-5 w-5" />
            )}
          </Button>

          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 shadow-sm">
              <TableIcon className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-base font-semibold tracking-tight hidden sm:block">
              SQL <span className="text-emerald-600">Trainer</span>
            </h1>
          </div>

          {/* Level badge */}
          <div className="hidden sm:flex items-center gap-2.5 rounded-lg bg-muted/50 px-3 py-1.5 border border-border/50">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white shadow-sm">
              {userStats.level}
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-xs font-medium text-muted-foreground">Ур. {userStats.level}</span>
              <div className="h-1.5 w-20 rounded-full bg-muted-foreground/20 overflow-hidden mt-0.5">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${userStats.levelProgress}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Locale Selector - hidden on very small screens */}
          <div className="hidden sm:block">
            <LocaleSelector />
          </div>

          {/* DB Selector */}
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
                className="h-9 w-9"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              >
                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              {theme === 'dark' ? t('header.theme.light') : t('header.theme.dark')}
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
            sidebarOpen ? 'w-64' : 'w-0 overflow-hidden'
          } bg-muted/10`}
        >
          <div className="w-64">
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
            <ResizablePanel defaultSize={45} minSize={20}>
              <div className="h-full">
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
                  schema={schemaInfo ? {
                    tables: schemaInfo.tables.map(t => ({
                      name: t.name,
                      columns: t.columns.map(c => ({ name: c.name, type: c.type })),
                    })),
                  } : null}
                />
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={55} minSize={20}>
              <div className="h-full overflow-hidden">
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
                  />
                ) : (
                  <EmptyResults />
                )}
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>

        {/* Right panel: Task info + Schema + Reference */}
        <aside className="hidden lg:flex w-80 shrink-0 flex-col border-l border-border/50 bg-muted/10">
          <ResizablePanelGroup direction="vertical">
            <ResizablePanel defaultSize={45} minSize={20}>
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
                          const hints = generateProgressiveHints(currentTask.id, currentTask.hint, currentTask.taskText, currentTask.sampleSolution);
                          setTotalHintPenalty(calculateHintPenalty(hints, nextLevel));
                        }
                      }}
                      solutionVisible={solutionVisible}
                      onShowSolution={() => setSolutionVisible(!solutionVisible)}
                      onUseSolution={(sql) => setEditorContent(sql)}
                      onNextTask={goToNextTask}
                      onNextRelated={(index) => goToRelatedTask(index)}
                      nextTaskLabel={nextTaskInfo.label}
                      isLastTask={nextTaskInfo.isLastTask}
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
            <ResizablePanel defaultSize={30} minSize={15}>
              <div className="p-3">
                <SchemaViewer schema={schemaInfo} onPreviewTable={handlePreviewTable} />
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={25} minSize={15}>
              <div className="flex h-full flex-col">
                {/* Tab switcher */}
                <div className="flex border-b border-border/50">
                  <button
                    onClick={() => setReferenceTab('reference')}
                    className={`flex-1 px-3 py-1.5 text-[11px] font-medium transition-colors ${
                      referenceTab === 'reference'
                        ? 'bg-muted text-foreground border-b-2 border-emerald-500'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {t('sqlRef.title')}
                  </button>
                  <button
                    onClick={() => setReferenceTab('glossary')}
                    className={`flex-1 px-3 py-1.5 text-[11px] font-medium transition-colors ${
                      referenceTab === 'glossary'
                        ? 'bg-muted text-foreground border-b-2 border-emerald-500'
                        : 'text-muted-foreground hover:text-foreground'
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
