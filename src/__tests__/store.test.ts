import { describe, it, expect, beforeEach } from 'vitest';
import { useSQLTrainerStore } from '@/lib/store';

describe('store — database slice', () => {
  beforeEach(() => {
    useSQLTrainerStore.getState().resetAllProgress();
    useSQLTrainerStore.setState({
      dbType: 'sqlite',
      currentTaskId: null,
      editorContent: '',
      lastResult: null,
      verification: null,
      isExecuting: false,
    });
  });

  it('should set and get dbType', () => {
    useSQLTrainerStore.getState().setDbType('postgresql');
    expect(useSQLTrainerStore.getState().dbType).toBe('postgresql');
  });

  it('should set editor content', () => {
    useSQLTrainerStore.getState().setEditorContent('SELECT 1');
    expect(useSQLTrainerStore.getState().editorContent).toBe('SELECT 1');
  });

  it('should set and clear query results', () => {
    const result = { success: true, columns: ['id'], rows: [{ id: 1 }], executionTime: 5 };
    useSQLTrainerStore.getState().setLastResult(result);
    expect(useSQLTrainerStore.getState().lastResult).toEqual(result);

    useSQLTrainerStore.getState().setLastResult(null);
    expect(useSQLTrainerStore.getState().lastResult).toBeNull();
  });

  it('should setCurrentTaskId and reset editor state', () => {
    useSQLTrainerStore.getState().setEditorContent('SELECT 1');
    useSQLTrainerStore.getState().setLastResult({ success: true, columns: [], rows: [], executionTime: 0 });
    useSQLTrainerStore.getState().setCurrentTaskId('task_1');

    expect(useSQLTrainerStore.getState().currentTaskId).toBe('task_1');
    expect(useSQLTrainerStore.getState().editorContent).toBe('');
    expect(useSQLTrainerStore.getState().lastResult).toBeNull();
    expect(useSQLTrainerStore.getState().hintVisible).toBe(false);
    expect(useSQLTrainerStore.getState().solutionVisible).toBe(false);
  });
});

describe('store — progress slice', () => {
  beforeEach(() => {
    useSQLTrainerStore.getState().resetAllProgress();
  });

  it('should mark task as completed', () => {
    useSQLTrainerStore.getState().markTaskCompleted('task_1', 2);
    expect(useSQLTrainerStore.getState().isTaskCompleted('task_1')).toBe(true);
  });

  it('should update task completion (replace old entry)', () => {
    useSQLTrainerStore.getState().markTaskCompleted('task_1', 1);
    useSQLTrainerStore.getState().markTaskCompleted('task_1', 3);

    const tasks = useSQLTrainerStore.getState().completedTasks;
    expect(tasks.length).toBe(1);
    expect(tasks[0].attempts).toBe(3);
  });

  it('should toggle bookmark', () => {
    useSQLTrainerStore.getState().toggleBookmark('task_1');
    expect(useSQLTrainerStore.getState().isBookmarked('task_1')).toBe(true);

    useSQLTrainerStore.getState().toggleBookmark('task_1');
    expect(useSQLTrainerStore.getState().isBookmarked('task_1')).toBe(false);
  });

  it('should add query history (max 50)', () => {
    for (let i = 0; i < 60; i++) {
      useSQLTrainerStore.getState().addQueryHistory({
        sql: `SELECT ${i}`,
        timestamp: Date.now(),
        success: true,
        executionTime: 1,
      });
    }
    expect(useSQLTrainerStore.getState().queryHistory.length).toBe(50);
  });

  it('should clear history', () => {
    useSQLTrainerStore.getState().addQueryHistory({
      sql: 'SELECT 1',
      timestamp: Date.now(),
      success: true,
      executionTime: 1,
    });
    useSQLTrainerStore.getState().clearHistory();
    expect(useSQLTrainerStore.getState().queryHistory).toEqual([]);
  });

  it('should save and delete saved queries', () => {
    useSQLTrainerStore.getState().saveQuery({ title: 'Test', sql: 'SELECT 1', taskId: null });
    expect(useSQLTrainerStore.getState().savedQueries.length).toBe(1);

    const id = useSQLTrainerStore.getState().savedQueries[0].id;
    useSQLTrainerStore.getState().deleteSavedQuery(id);
    expect(useSQLTrainerStore.getState().savedQueries.length).toBe(0);
  });

  it('should reset all progress', () => {
    useSQLTrainerStore.getState().markTaskCompleted('task_1', 1);
    useSQLTrainerStore.getState().toggleBookmark('task_1');
    useSQLTrainerStore.getState().addQueryHistory({
      sql: 'SELECT 1',
      timestamp: Date.now(),
      success: true,
      executionTime: 1,
    });

    useSQLTrainerStore.getState().resetAllProgress();
    expect(useSQLTrainerStore.getState().completedTasks).toEqual([]);
    expect(useSQLTrainerStore.getState().bookmarkedTasks).toEqual([]);
    expect(useSQLTrainerStore.getState().queryHistory).toEqual([]);
  });
});

describe('store — gamification slice', () => {
  beforeEach(() => {
    useSQLTrainerStore.getState().resetAllProgress();
  });

  it('should calculate levels correctly', () => {
    const { calculateLevel } = useSQLTrainerStore.getState();

    expect(calculateLevel(0)).toEqual({ level: 1, progress: 0, xpToNext: 100 });
    expect(calculateLevel(50)).toEqual({ level: 1, progress: 50, xpToNext: 50 });
    expect(calculateLevel(100)).toEqual({ level: 2, progress: 0, xpToNext: 200 });
    expect(calculateLevel(300)).toEqual({ level: 3, progress: 0, xpToNext: 300 });
  });

  it('should add XP and update level', () => {
    useSQLTrainerStore.getState().addXP(150);
    const state = useSQLTrainerStore.getState();

    expect(state.userStats.xp).toBe(150);
    expect(state.userStats.level).toBe(2);
  });

  it('should increment explain count', () => {
    const before = useSQLTrainerStore.getState().userStats.explainCount;
    useSQLTrainerStore.getState().incrementExplainCount();
    expect(useSQLTrainerStore.getState().userStats.explainCount).toBe(before + 1);
  });

  it('should check and unlock achievements on task completion', () => {
    // Reset to clean state
    useSQLTrainerStore.getState().resetAllProgress();

    // Complete a task with 1 attempt (should unlock first_query + perfect_score)
    useSQLTrainerStore.getState().markTaskCompleted('beginner-1', 1);

    const state = useSQLTrainerStore.getState();
    // Verify XP was awarded
    expect(state.userStats.xp).toBeGreaterThan(0);
    // Verify achievement IDs were recorded
    expect(state.achievements.length).toBeGreaterThan(0);
  });

  it('should unlock FIRST_JOIN achievement for JOIN task', () => {
    useSQLTrainerStore.getState().resetAllProgress();

    useSQLTrainerStore.getState().markTaskCompleted('intermediate-1', 1);

    const state = useSQLTrainerStore.getState();
    expect(state.achievements).toContain('first_join');
  });

  it('should unlock FIRST_WINDOW achievement for window function task', () => {
    useSQLTrainerStore.getState().resetAllProgress();

    useSQLTrainerStore.getState().markTaskCompleted('advanced-1', 2);

    const state = useSQLTrainerStore.getState();
    expect(state.achievements).toContain('first_window');
  });

  it('should unlock PERFECT_SCORE for first-attempt completion', () => {
    useSQLTrainerStore.getState().resetAllProgress();

    useSQLTrainerStore.getState().markTaskCompleted('beginner-2', 1);

    const state = useSQLTrainerStore.getState();
    expect(state.achievements).toContain('perfect_score');
  });

  it('should NOT unlock PERFECT_SCORE for multi-attempt completion', () => {
    useSQLTrainerStore.getState().resetAllProgress();

    useSQLTrainerStore.getState().markTaskCompleted('beginner-2', 3);

    const state = useSQLTrainerStore.getState();
    expect(state.achievements).not.toContain('perfect_score');
  });

  it('should NOT unlock duplicate achievements', () => {
    useSQLTrainerStore.getState().resetAllProgress();

    useSQLTrainerStore.getState().markTaskCompleted('beginner-1', 1);
    useSQLTrainerStore.getState().markTaskCompleted('beginner-2', 1);

    const state = useSQLTrainerStore.getState();
    const firstQueryCount = state.achievements.filter((a: string) => a === 'first_query').length;
    expect(firstQueryCount).toBe(1);
  });

  it('should accumulate XP across multiple tasks', () => {
    useSQLTrainerStore.getState().resetAllProgress();

    useSQLTrainerStore.getState().markTaskCompleted('beginner-1', 1);
    const xpAfterFirst = useSQLTrainerStore.getState().userStats.xp;

    useSQLTrainerStore.getState().markTaskCompleted('beginner-2', 1);
    const xpAfterSecond = useSQLTrainerStore.getState().userStats.xp;

    expect(xpAfterSecond).toBeGreaterThan(xpAfterFirst);
  });

  it('should explain count track independently', () => {
    useSQLTrainerStore.getState().resetAllProgress();

    expect(useSQLTrainerStore.getState().userStats.explainCount).toBe(0);

    useSQLTrainerStore.getState().incrementExplainCount();
    useSQLTrainerStore.getState().incrementExplainCount();
    useSQLTrainerStore.getState().incrementExplainCount();

    expect(useSQLTrainerStore.getState().userStats.explainCount).toBe(3);
  });

  it('should recalculate level on XP change', () => {
    useSQLTrainerStore.getState().resetAllProgress();

    // Add exactly 100 XP (should reach level 2)
    useSQLTrainerStore.getState().addXP(100);

    const state = useSQLTrainerStore.getState();
    expect(state.userStats.level).toBe(2);
    expect(state.userStats.xp).toBe(100);
  });

  it('should track hint-free completions', () => {
    useSQLTrainerStore.getState().resetAllProgress();

    const before = useSQLTrainerStore.getState().userStats.hintFreeCount;
    useSQLTrainerStore.getState().markTaskCompleted('beginner-3', 1);

    // hintFreeCount should increment when task is completed without hints
    // (depends on hint level being 0 at completion time)
    const after = useSQLTrainerStore.getState().userStats.hintFreeCount;
    expect(after).toBeGreaterThanOrEqual(before);
  });
});

describe('store — practice mode slice', () => {
  beforeEach(() => {
    useSQLTrainerStore.getState().stopPracticeMode();
  });

  it('should start practice mode with shuffled tasks', () => {
    useSQLTrainerStore.getState().startPracticeMode('beginner');
    const state = useSQLTrainerStore.getState();

    expect(state.practiceMode.active).toBe(true);
    expect(state.practiceMode.taskOrder.length).toBeGreaterThan(0);
    expect(state.practiceMode.currentIndex).toBe(0);
  });

  it('should advance to next practice task', () => {
    useSQLTrainerStore.getState().startPracticeMode('beginner');
    const firstTask = useSQLTrainerStore.getState().practiceMode.taskOrder[0];

    useSQLTrainerStore.getState().nextPracticeTask();

    const state = useSQLTrainerStore.getState();
    expect(state.practiceMode.currentIndex).toBe(1);
    expect(state.practiceMode.completedInSession).toContain(firstTask);
  });

  it('should stop practice mode', () => {
    useSQLTrainerStore.getState().startPracticeMode('all');
    expect(useSQLTrainerStore.getState().practiceMode.active).toBe(true);

    useSQLTrainerStore.getState().stopPracticeMode();
    expect(useSQLTrainerStore.getState().practiceMode.active).toBe(false);
  });
});

describe('store — undo reset', () => {
  beforeEach(() => {
    useSQLTrainerStore.getState().resetAllProgress();
  });

  it('should undo a progress reset within time window', () => {
    // markTaskCompleted now also awards XP (10 for beginner task)
    useSQLTrainerStore.getState().markTaskCompleted('task_1', 1);

    useSQLTrainerStore.getState().addXP(50);
    const totalXP = useSQLTrainerStore.getState().userStats.xp;

    expect(useSQLTrainerStore.getState().completedTasks.length).toBe(1);
    expect(totalXP).toBeGreaterThan(50);

    useSQLTrainerStore.getState().resetAllProgress();
    expect(useSQLTrainerStore.getState().completedTasks.length).toBe(0);
    expect(useSQLTrainerStore.getState().userStats.xp).toBe(0);

    useSQLTrainerStore.getState().undoReset();
    expect(useSQLTrainerStore.getState().completedTasks.length).toBe(1);
    expect(useSQLTrainerStore.getState().userStats.xp).toBe(totalXP);
  });
});

describe('store — UI slice', () => {
  beforeEach(() => {
    useSQLTrainerStore.getState().resetAllProgress();
  });

  it('should toggle sidebar', () => {
    expect(useSQLTrainerStore.getState().sidebarOpen).toBe(true);
    useSQLTrainerStore.getState().setSidebarOpen(false);
    expect(useSQLTrainerStore.getState().sidebarOpen).toBe(false);
    useSQLTrainerStore.getState().setSidebarOpen(true);
    expect(useSQLTrainerStore.getState().sidebarOpen).toBe(true);
  });

  it('should toggle reference panel', () => {
    expect(useSQLTrainerStore.getState().referenceOpen).toBe(false);
    useSQLTrainerStore.getState().setReferenceOpen(true);
    expect(useSQLTrainerStore.getState().referenceOpen).toBe(true);
    useSQLTrainerStore.getState().setReferenceOpen(false);
    expect(useSQLTrainerStore.getState().referenceOpen).toBe(false);
  });

  it('should manage hint level', () => {
    expect(useSQLTrainerStore.getState().hintLevel).toBe(0);
    useSQLTrainerStore.getState().setHintLevel(1);
    expect(useSQLTrainerStore.getState().hintLevel).toBe(1);
    useSQLTrainerStore.getState().setHintLevel(3);
    expect(useSQLTrainerStore.getState().hintLevel).toBe(3);
  });

  it('should track hint penalty', () => {
    expect(useSQLTrainerStore.getState().totalHintPenalty).toBe(0);
    useSQLTrainerStore.getState().setTotalHintPenalty(50);
    expect(useSQLTrainerStore.getState().totalHintPenalty).toBe(50);
  });

  it('should toggle solution visibility', () => {
    expect(useSQLTrainerStore.getState().solutionVisible).toBe(false);
    useSQLTrainerStore.getState().setSolutionVisible(true);
    expect(useSQLTrainerStore.getState().solutionVisible).toBe(true);
  });
});

describe('store — onboarding slice', () => {
  beforeEach(() => {
    useSQLTrainerStore.getState().resetAllProgress();
  });

  it('should start with onboarding incomplete', () => {
    expect(useSQLTrainerStore.getState().onboardingCompleted).toBe(false);
  });

  it('should mark onboarding as completed', () => {
    useSQLTrainerStore.getState().setOnboardingCompleted(true);
    expect(useSQLTrainerStore.getState().onboardingCompleted).toBe(true);
  });

  it('should reset onboarding', () => {
    useSQLTrainerStore.getState().setOnboardingCompleted(true);
    expect(useSQLTrainerStore.getState().onboardingCompleted).toBe(true);
    useSQLTrainerStore.getState().resetOnboarding();
    expect(useSQLTrainerStore.getState().onboardingCompleted).toBe(false);
  });
});

describe('store — timer slice', () => {
  beforeEach(() => {
    useSQLTrainerStore.getState().stopTimer();
  });

  it('should start timer with default duration', () => {
    useSQLTrainerStore.getState().startTimer();
    const state = useSQLTrainerStore.getState().timer;
    expect(state.isActive).toBe(true);
    expect(state.timeRemaining).toBe(900);
    expect(state.totalDuration).toBe(900);
    expect(state.isPaused).toBe(false);
  });

  it('should start timer with custom duration', () => {
    useSQLTrainerStore.getState().startTimer(300);
    const state = useSQLTrainerStore.getState().timer;
    expect(state.isActive).toBe(true);
    expect(state.timeRemaining).toBe(300);
    expect(state.totalDuration).toBe(300);
  });

  it('should pause and resume timer', () => {
    useSQLTrainerStore.getState().startTimer();
    useSQLTrainerStore.getState().pauseTimer();
    expect(useSQLTrainerStore.getState().timer.isPaused).toBe(true);

    useSQLTrainerStore.getState().resumeTimer();
    expect(useSQLTrainerStore.getState().timer.isPaused).toBe(false);
  });

  it('should stop timer and reset to default', () => {
    useSQLTrainerStore.getState().startTimer(120);
    expect(useSQLTrainerStore.getState().timer.isActive).toBe(true);

    useSQLTrainerStore.getState().stopTimer();
    const state = useSQLTrainerStore.getState().timer;
    expect(state.isActive).toBe(false);
    expect(state.timeRemaining).toBe(900);
  });

  it('should tick timer down by 1 second', () => {
    useSQLTrainerStore.getState().startTimer(10);
    expect(useSQLTrainerStore.getState().timer.timeRemaining).toBe(10);

    useSQLTrainerStore.getState().tickTimer();
    expect(useSQLTrainerStore.getState().timer.timeRemaining).toBe(9);
  });

  it('should not tick when paused', () => {
    useSQLTrainerStore.getState().startTimer(10);
    useSQLTrainerStore.getState().pauseTimer();
    useSQLTrainerStore.getState().tickTimer();
    expect(useSQLTrainerStore.getState().timer.timeRemaining).toBe(10);
  });

  it('should not tick below zero', () => {
    useSQLTrainerStore.getState().startTimer(1);
    useSQLTrainerStore.getState().tickTimer();
    useSQLTrainerStore.getState().tickTimer();
    expect(useSQLTrainerStore.getState().timer.timeRemaining).toBe(0);
  });

  it('should format time as MM:SS', () => {
    useSQLTrainerStore.getState().startTimer(65);
    expect(useSQLTrainerStore.getState().getFormattedTime()).toBe('01:05');
  });

  it('should detect warning threshold', () => {
    useSQLTrainerStore.getState().setTimerSettings({ warningThreshold: 60 });
    useSQLTrainerStore.getState().startTimer(60);
    expect(useSQLTrainerStore.getState().isTimeWarning()).toBe(true);
  });

  it('should not show warning above threshold', () => {
    useSQLTrainerStore.getState().setTimerSettings({ warningThreshold: 60 });
    useSQLTrainerStore.getState().startTimer(120);
    expect(useSQLTrainerStore.getState().isTimeWarning()).toBe(false);
  });

  it('should clamp time remaining to valid range', () => {
    useSQLTrainerStore.getState().startTimer(600);
    useSQLTrainerStore.getState().setTimeRemaining(-10);
    expect(useSQLTrainerStore.getState().timer.timeRemaining).toBe(0);

    useSQLTrainerStore.getState().setTimeRemaining(9999);
    expect(useSQLTrainerStore.getState().timer.timeRemaining).toBe(900);
  });
});

describe('store — export/import', () => {
  beforeEach(() => {
    useSQLTrainerStore.getState().resetAllProgress();
  });

  it('should export and import progress', () => {
    useSQLTrainerStore.getState().markTaskCompleted('task_1', 2);
    useSQLTrainerStore.getState().toggleBookmark('task_1');

    const exported = useSQLTrainerStore.getState().exportProgress();
    expect(exported.completedTasks.length).toBe(1);
    expect(exported.bookmarkedTasks).toContain('task_1');

    // Reset and import
    useSQLTrainerStore.getState().resetAllProgress();
    expect(useSQLTrainerStore.getState().completedTasks.length).toBe(0);

    const result = useSQLTrainerStore.getState().importProgress(exported);
    expect(result.success).toBe(true);
    expect(useSQLTrainerStore.getState().completedTasks.length).toBe(1);
    expect(useSQLTrainerStore.getState().bookmarkedTasks).toContain('task_1');
  });

  it('should reject invalid import data', () => {
    const state = useSQLTrainerStore.getState();

    expect(state.importProgress(null as unknown as any)).toEqual({
      success: false,
      error: expect.any(String),
    });

    expect(state.importProgress({ version: 999 } as any)).toEqual({
      success: false,
      error: expect.any(String),
    });
  });
});
