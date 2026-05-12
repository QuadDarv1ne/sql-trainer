'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import { useSQLTrainerStore } from '@/lib/store';
import { getTaskById, TRAINING_TASKS } from '@/lib/training-tasks';
import { type DatabaseInfo } from '@/lib/sql-engine';
import { formatSQL } from '@/components/sql-editor';

import ResultsTable from '@/components/results-table';
import Sidebar from '@/components/sidebar';
import TaskPanel from '@/components/task-panel';
import DbSelector from '@/components/db-selector';
import SchemaViewer from '@/components/schema-viewer';
import SavedQueries from '@/components/saved-queries';
import QueryHistoryPanel from '@/components/query-history';
import MobileTaskSheet from '@/components/mobile-task-sheet';
import ERDiagram from '@/components/er-diagram';
import ShortcutsDialog from '@/components/shortcuts-dialog';
import WelcomePanel from '@/components/welcome-panel';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Play,
  RotateCcw,
  Trash2,
  Sun,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Table as TableIcon,
  ChevronRight,
  Loader2,
  Menu,
  Wand2,
  Download,
  Upload,
  Binary,
} from 'lucide-react';

// Dynamic import for SQL Editor (no SSR)
const SQLEditor = dynamic(() => import('@/components/sql-editor'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-white dark:bg-[#282c34] rounded-md">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  ),
});

// Dynamic import for SQL Reference
const SQLReference = dynamic(() => import('@/components/sql-reference'), {
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
    sidebarOpen,
    setSidebarOpen,
    hintVisible,
    setHintVisible,
    isExecuting,
    setIsExecuting,
    addQueryHistory,
    isTaskCompleted,
    markTaskCompleted,
    verification,
    setVerification,
    solutionVisible,
    setSolutionVisible,
    completedTasks,
  } = useSQLTrainerStore();

  const { theme: _theme, setTheme, resolvedTheme } = useTheme();
  const [schemaInfo, setSchemaInfo] = useState<DatabaseInfo | null>(null);
  const [attemptCount, setAttemptCount] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Get current task
  const currentTask = useMemo(
    () => (currentTaskId ? getTaskById(currentTaskId) : null),
    [currentTaskId]
  );

  // Check if all tasks are completed
  const allCompleted = TRAINING_TASKS.length > 0 && completedTasks.length >= TRAINING_TASKS.length;

  // Find next task
  const currentTaskIndex = currentTaskId ? TRAINING_TASKS.findIndex((t) => t.id === currentTaskId) : -1;
  const nextTask = currentTaskIndex >= 0 && currentTaskIndex < TRAINING_TASKS.length - 1
    ? TRAINING_TASKS[currentTaskIndex + 1]
    : null;
  const isLastTask = currentTaskIndex === TRAINING_TASKS.length - 1;

  // Load schema when task changes
  useEffect(() => {
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
        .catch(() => {});
      setShowWelcome(false);
    } else {
      setSchemaInfo(null);
      if (!currentTaskId) {
        setShowWelcome(true);
      }
    }
    setAttemptCount(0);
    setVerification(null);
  }, [currentTask, dbType, currentTaskId]);

  // Execute query
  const executeQuery = useCallback(async () => {
    if (!editorContent.trim() || isExecuting) return;

    setIsExecuting(true);
    setAttemptCount((prev) => prev + 1);
    setVerification(null);

    try {
      const response = await fetch('/api/sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sql: editorContent,
          dbType,
          taskId: currentTaskId,
        }),
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

      // Verify task if we got successful results with rows
      if (
        currentTaskId &&
        data.success &&
        data.rows &&
        data.rows.length > 0
      ) {
        try {
          const verifyResponse = await fetch('/api/sql/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sql: editorContent,
              taskId: currentTaskId,
              dbType,
              userRowCount: data.rows.length,
            }),
          });

          const verifyData = await verifyResponse.json();

          if (verifyData.success) {
            setVerification({
              verified: verifyData.verified,
              userRowCount: verifyData.userRowCount,
              expectedRowCount: verifyData.expectedRowCount,
              message: verifyData.message,
            });

            // Mark task completed if verified
            if (verifyData.verified && !isTaskCompleted(currentTaskId)) {
              markTaskCompleted(currentTaskId, attemptCount + 1);
              toast.success('Задание выполнено! 🎉', {
                description: currentTask?.title,
              });
            } else if (!verifyData.verified) {
              toast.info('Пока не совсем верно', {
                description: verifyData.message,
                duration: 4000,
              });
            }
          }
        } catch {
          // Verification failed silently - non-critical
        }
      }

      // DDL success toast
      if (data.success && data.columns.length === 0 && data.rows.length === 0) {
        toast.success('Запрос выполнен', {
          description: data.message || 'Операция выполнена успешно',
        });
      }
    } catch {
      setLastResult({
        success: false,
        columns: [],
        rows: [],
        error: 'Ошибка сети. Попробуйте снова.',
        executionTime: 0,
      });
    } finally {
      setIsExecuting(false);
    }
  }, [editorContent, isExecuting, dbType, currentTaskId, setIsExecuting, setLastResult, addQueryHistory, isTaskCompleted, markTaskCompleted, attemptCount, setVerification, currentTask]);

  // Execute EXPLAIN QUERY PLAN
  const executeExplain = useCallback(async () => {
    if (!editorContent.trim() || isExecuting) return;

    setIsExecuting(true);
    setVerification(null);

    try {
      const response = await fetch('/api/sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sql: editorContent,
          dbType,
          taskId: currentTaskId,
          explain: true,
        }),
      });

      const data = await response.json();

      setLastResult({
        success: data.success,
        columns: data.columns || [],
        rows: data.rows || [],
        error: data.error,
        executionTime: data.executionTime || 0,
        message: data.isExplain ? 'План выполнения запроса (EXPLAIN QUERY PLAN)' : data.message,
      });
    } catch {
      setLastResult({
        success: false,
        columns: [],
        rows: [],
        error: 'Ошибка сети. Попробуйте снова.',
        executionTime: 0,
      });
    } finally {
      setIsExecuting(false);
    }
  }, [editorContent, isExecuting, dbType, currentTaskId, setIsExecuting, setLastResult]);

  // Handle format SQL
  const handleFormatSQL = useCallback((sql?: string) => {
    const formatted = formatSQL(sql || editorContent);
    setEditorContent(formatted);
    toast.success('SQL отформатирован');
  }, [editorContent, setEditorContent]);

  // Insert text from schema viewer
  const handleInsertText = useCallback((text: string) => {
    setEditorContent((prev) => {
      // Simple append with space if needed
      if (prev.trim().length > 0) {
        return prev + (prev.endsWith(' ') || prev.endsWith('\n') ? '' : ' ') + text;
      }
      return text;
    });
  }, [setEditorContent]);

  // Use solution
  const handleUseSolution = useCallback((sql: string) => {
    setEditorContent(sql);
    setSolutionVisible(true);
  }, [setEditorContent, setSolutionVisible]);

  // Next task
  const handleNextTask = useCallback(() => {
    if (nextTask) {
      setCurrentTaskId(nextTask.id);
    }
  }, [nextTask, setCurrentTaskId]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Enter - Run query
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        executeQuery();
      }
      // Ctrl+L - Clear editor
      if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
        e.preventDefault();
        setEditorContent('');
        setLastResult(null);
        setVerification(null);
      }
      // Ctrl+Shift+H - Show hint
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'H') {
        e.preventDefault();
        setHintVisible(true);
      }
      // Ctrl+Shift+S - Toggle solution
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        setSolutionVisible(!solutionVisible);
      }
      // Ctrl+Shift+F - Format SQL (handled in editor but also here as backup)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'F') {
        e.preventDefault();
        handleFormatSQL();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [executeQuery, setEditorContent, setLastResult, setVerification, setHintVisible, setSolutionVisible, solutionVisible, handleFormatSQL]);

  // Clear editor
  const clearEditor = () => {
    setEditorContent('');
    setLastResult(null);
    setVerification(null);
  };

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
        .catch(() => {});
    }
    setEditorContent('');
    setLastResult(null);
    setVerification(null);
    toast.info('База данных сброшена');
  };

  // Export progress
  const handleExportProgress = () => {
    const data = {
      completedTasks,
      savedQueries: useSQLTrainerStore.getState().savedQueries,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sql-trainer-progress-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Прогресс экспортирован');
  };

  // Import progress
  const handleImportProgress = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string);
          if (data.completedTasks && Array.isArray(data.completedTasks)) {
            data.completedTasks.forEach((t: { taskId: string; completedAt: number; attempts: number }) => {
              if (!isTaskCompleted(t.taskId)) {
                useSQLTrainerStore.getState().markTaskCompleted(t.taskId, t.attempts);
              }
            });
          }
          toast.success('Прогресс импортирован');
        } catch {
          toast.error('Ошибка при чтении файла');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  // Editor theme
  const editorTheme = resolvedTheme === 'light' ? 'light' : 'dark';

  if (!mounted) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  // Welcome mode - no task selected
  if (showWelcome && !currentTaskId) {
    return (
      <div className="flex h-screen flex-col overflow-hidden bg-background">
        {/* Header */}
        <header className="flex h-12 shrink-0 items-center justify-between border-b border-border px-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="hidden md:flex h-8 w-8"
              onClick={() => {
                setSidebarOpen(!sidebarOpen);
                setShowWelcome(false);
              }}
            >
              {sidebarOpen ? (
                <PanelLeftClose className="h-4 w-4" />
              ) : (
                <PanelLeftOpen className="h-4 w-4" />
              )}
            </Button>
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-600">
                <TableIcon className="h-4 w-4 text-white" />
              </div>
              <h1 className="text-sm font-bold tracking-tight hidden sm:block">
                SQL <span className="text-emerald-600">Тренажёр</span>
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DbSelector dbType={dbType} onChange={setDbType} />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                >
                  {resolvedTheme === 'dark' ? (
                    <Sun className="h-4 w-4" />
                  ) : (
                    <Moon className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {resolvedTheme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
              </TooltipContent>
            </Tooltip>
          </div>
        </header>

        <WelcomePanel />
      </div>
    );
  }

  // Use currentTask below
  void currentTask;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      {/* Header */}
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-border px-3">
        <div className="flex items-center gap-3">
          {/* Mobile menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden h-8 w-8">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SheetHeader className="border-b border-border px-4 py-3">
                <SheetTitle className="text-sm">Задания</SheetTitle>
              </SheetHeader>
              <Sidebar />
            </SheetContent>
          </Sheet>

          {/* Desktop sidebar toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:flex h-8 w-8"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? (
              <PanelLeftClose className="h-4 w-4" />
            ) : (
              <PanelLeftOpen className="h-4 w-4" />
            )}
          </Button>

          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-600">
              <TableIcon className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-sm font-bold tracking-tight hidden sm:block">
              SQL <span className="text-emerald-600">Тренажёр</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* DB Selector */}
          <DbSelector dbType={dbType} onChange={setDbType} />

          {/* Export/Import */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hidden sm:flex"
                onClick={handleExportProgress}
              >
                <Download className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Экспорт прогресса</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hidden sm:flex"
                onClick={handleImportProgress}
              >
                <Upload className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Импорт прогресса</TooltipContent>
          </Tooltip>

          {/* Theme toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              >
                {resolvedTheme === 'dark' ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {resolvedTheme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
            </TooltipContent>
          </Tooltip>
          <ShortcutsDialog />
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <aside
          className={`hidden md:flex shrink-0 border-r border-border transition-all duration-200 ${
            sidebarOpen ? 'w-64' : 'w-0 overflow-hidden'
          }`}
        >
          <div className="w-64">
            <Sidebar />
          </div>
        </aside>

        {/* Center: Editor + Results */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Action bar */}
          <div className="flex items-center gap-1.5 border-b border-border px-3 py-1.5">
            <Button
              size="sm"
              className="h-7 bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 gap-1.5 text-xs px-3"
              onClick={executeQuery}
              disabled={isExecuting || !editorContent.trim()}
            >
              {isExecuting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Play className="h-3.5 w-3.5" />
              )}
              <span className="hidden sm:inline">Выполнить</span>
              <kbd className="ml-1 hidden sm:inline-flex h-5 items-center rounded border border-current/20 bg-current/10 px-1.5 text-[10px] font-mono">
                Ctrl+↵
              </kbd>
            </Button>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => handleFormatSQL()}
                  disabled={!editorContent.trim()}
                >
                  <Wand2 className="mr-1 h-3 w-3" />
                  <span className="hidden sm:inline">Формат</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Ctrl+Shift+F</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={executeExplain}
                  disabled={isExecuting || !editorContent.trim()}
                >
                  <Binary className="mr-1 h-3 w-3" />
                  <span className="hidden sm:inline">План</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>EXPLAIN QUERY PLAN — план выполнения</TooltipContent>
            </Tooltip>

            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={clearEditor}>
              <Trash2 className="mr-1 h-3 w-3" />
              <span className="hidden sm:inline">Очистить</span>
            </Button>

            {currentTask && (
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={resetDb}>
                <RotateCcw className="mr-1 h-3 w-3" />
                <span className="hidden sm:inline">Сбросить БД</span>
              </Button>
            )}

            <SavedQueries onLoadQuery={(sql) => setEditorContent(sql)} />
            <QueryHistoryPanel onLoadQuery={(sql) => setEditorContent(sql)} />

            {/* Mobile task sheet */}
            <MobileTaskSheet
              task={currentTask}
              isCompleted={currentTaskId ? isTaskCompleted(currentTaskId) : false}
              hintVisible={hintVisible}
              onShowHint={() => setHintVisible(true)}
              solutionVisible={solutionVisible}
              onShowSolution={() => setSolutionVisible(!solutionVisible)}
              onUseSolution={handleUseSolution}
              onNextTask={handleNextTask}
              nextTaskLabel={nextTask ? nextTask.title : undefined}
              isLastTask={isLastTask}
              allCompleted={allCompleted}
            />

            <div className="ml-auto flex items-center gap-1.5">
              {currentTask && (
                <Badge variant="outline" className="text-xs px-2">
                  <ChevronRight className="mr-0.5 h-3 w-3" />
                  {currentTask.title}
                </Badge>
              )}
            </div>
          </div>

          {/* Editor + Results panels */}
          <ResizablePanelGroup direction="vertical" className="flex-1">
            <ResizablePanel defaultSize={45} minSize={20}>
              <div className={editorTheme === 'dark' ? 'h-full bg-[#282c34]' : 'h-full bg-white'}>
                <SQLEditor
                  value={editorContent}
                  onChange={setEditorContent}
                  onRun={executeQuery}
                  height="100%"
                  theme={editorTheme}
                  onFormatSQL={(sql) => handleFormatSQL(sql)}
                  placeholder={
                    currentTask
                      ? `Напишите SQL запрос для: ${currentTask.title}...`
                      : 'Напишите SQL запрос... (Ctrl+Enter для выполнения)'
                  }
                />
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={55} minSize={20}>
              <div className="h-full overflow-hidden">
                {lastResult ? (
                  <ResultsTable
                    success={lastResult.success}
                    columns={lastResult.columns}
                    rows={lastResult.rows}
                    error={lastResult.error}
                    executionTime={lastResult.executionTime}
                    message={lastResult.message}
                    verification={verification}
                  />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
                    <div className="rounded-full bg-muted p-4">
                      <TableIcon className="h-8 w-8 text-muted-foreground/40" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Результаты запроса
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground/70">
                        Нажмите «Выполнить» или Ctrl+Enter для запуска
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>

        {/* Right panel: Task info + Schema + Reference */}
        <aside className="hidden lg:flex w-72 shrink-0 flex-col border-l border-border">
          <ResizablePanelGroup direction="vertical">
            <ResizablePanel defaultSize={40} minSize={15}>
              <ScrollArea className="h-full">
                <TaskPanel
                  task={currentTask}
                  isCompleted={currentTaskId ? isTaskCompleted(currentTaskId) : false}
                  hintVisible={hintVisible}
                  onShowHint={() => setHintVisible(true)}
                  solutionVisible={solutionVisible}
                  onShowSolution={() => setSolutionVisible(!solutionVisible)}
                  onUseSolution={handleUseSolution}
                  onNextTask={handleNextTask}
                  nextTaskLabel={nextTask ? nextTask.title : undefined}
                  isLastTask={isLastTask}
                  allCompleted={allCompleted}
                />
              </ScrollArea>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={35} minSize={15}>
              <Tabs defaultValue="schema" className="flex h-full flex-col">
                <TabsList className="w-full rounded-none border-b border-border bg-transparent h-8 p-0">
                  <TabsTrigger value="schema" className="flex-1 rounded-none text-xs h-8 data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-emerald-500 data-[state=active]:bg-transparent">
                    Схема
                  </TabsTrigger>
                  <TabsTrigger value="er" className="flex-1 rounded-none text-xs h-8 data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-emerald-500 data-[state=active]:bg-transparent">
                    ER-диаграмма
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="schema" className="flex-1 mt-0 overflow-hidden">
                  <SchemaViewer schema={schemaInfo} onInsertText={handleInsertText} />
                </TabsContent>
                <TabsContent value="er" className="flex-1 mt-0 overflow-auto p-3">
                  <ERDiagram schema={schemaInfo} />
                </TabsContent>
              </Tabs>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={25} minSize={10}>
              <SQLReference />
            </ResizablePanel>
          </ResizablePanelGroup>
        </aside>
      </div>
    </div>
  );
}
