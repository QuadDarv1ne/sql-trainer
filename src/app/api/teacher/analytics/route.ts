import { withTeacherAuth } from '@/lib/api-auth';
import { NextResponse } from 'next/server';
import { getTaskAnalytics, getErrorPatternAnalysis } from '@/lib/db-users';

export const GET = withTeacherAuth(async () => {
  const taskStats = getTaskAnalytics();
  const errorPatterns = getErrorPatternAnalysis();

  const completionByLevel = {
    beginner: taskStats.filter(t => t.difficulty === 'beginner').reduce((s, t) => s + t.completions, 0),
    intermediate: taskStats.filter(t => t.difficulty === 'intermediate').reduce((s, t) => s + t.completions, 0),
    advanced: taskStats.filter(t => t.difficulty === 'advanced').reduce((s, t) => s + t.completions, 0),
  };

  const difficultyStats = ['beginner', 'intermediate', 'advanced'].map(level => {
    const levelTasks = taskStats.filter(t => t.difficulty === level);
    return {
      difficulty: level,
      completed: levelTasks.reduce((s, t) => s + t.completions, 0),
      total: levelTasks.length,
      avgAttempts: levelTasks.length > 0
        ? Math.round((levelTasks.reduce((s, t) => s + t.avg_attempts, 0) / levelTasks.length) * 10) / 10
        : 0,
      firstAttemptRate: levelTasks.length > 0
        ? Math.round((levelTasks.reduce((s, t) => s + t.first_attempt_rate, 0) / levelTasks.length) * 10) / 10
        : 0,
    };
  });

  const topTasks = [...taskStats]
    .sort((a, b) => b.completions - a.completions || a.avg_attempts - b.avg_attempts)
    .slice(0, 10)
    .map(t => ({ task_id: t.task_id, completions: t.completions, avg_attempts: t.avg_attempts }));

  const strugglingTasks = errorPatterns
    .sort((a, b) => b.avg_attempts - a.avg_attempts)
    .slice(0, 10)
    .map(p => ({ task_id: p.task_id, avg_attempts: p.avg_attempts, failure_rate: p.failure_rate }));

  return NextResponse.json({
    analytics: {
      difficultyStats,
      completionByLevel,
      topTasks,
      strugglingTasks,
    },
  });
});
