'use client';

import { useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { useSQLTrainerStore } from '@/lib/store';
import type { QueryResult, VerificationResult } from '@/lib/store';
import { plural } from '@/lib/utils';
import { t } from '@/lib/i18n';
import { logger } from '@/lib/logger';

interface UseQueryExecutorOptions {
  editorContent: string;
  isExecuting: boolean;
  dbType: string;
  currentTaskId: string | null;
  setIsExecuting: (v: boolean) => void;
  setLastResult: (result: QueryResult | null) => void;
  setVerification: (result: VerificationResult | null) => void;
  setExplainPlan: (v: string | null) => void;
  setExplainSuggestions: (v: string[]) => void;
}

export function useQueryExecutor({
  editorContent,
  isExecuting,
  dbType,
  currentTaskId,
  setIsExecuting,
  setLastResult,
  setVerification,
  setExplainPlan,
  setExplainSuggestions,
}: UseQueryExecutorOptions) {
  const { data: session } = useSession();
  const attemptCountRef = useRef(0);
  const progressSyncRef = useRef<AbortController | null>(null);
  const practiceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (practiceTimerRef.current) {
        clearTimeout(practiceTimerRef.current);
        practiceTimerRef.current = null;
      }
      progressSyncRef.current?.abort();
    };
  }, []);

  const {
    addQueryHistory,
    isTaskCompleted,
    markTaskCompleted,
    updateStreak,
    practiceMode,
    nextPracticeTask,
    incrementExplainCount,
  } = useSQLTrainerStore();

  const handleVerifiedTask = useCallback(
    (verifyData: { verified: boolean; message?: string }) => {
      if (verifyData.verified && currentTaskId && !isTaskCompleted(currentTaskId)) {
        markTaskCompleted(currentTaskId, attemptCountRef.current);
        updateStreak();
        toast.success(t('task.completed'), {
          description: `${attemptCountRef.current} ${plural(attemptCountRef.current, t('task.attempts'), t('task.attemptsFew'), t('task.attemptsMany'))} • +${useSQLTrainerStore.getState().userStats.xp} XP`,
          duration: 4000,
        });

        if (practiceMode.active) {
          practiceTimerRef.current = setTimeout(() => {
            practiceTimerRef.current = null;
            nextPracticeTask();
          }, 1500);
        }

        if (session?.user && currentTaskId) {
          progressSyncRef.current?.abort();
          progressSyncRef.current = new AbortController();
          const taskId = currentTaskId;
          const attempts = attemptCountRef.current;
          fetch('/api/user/progress', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ taskId, attempts }),
            signal: progressSyncRef.current.signal,
          })
            .then((res) => {
              if (!res.ok) throw new Error(`HTTP ${res.status}`);
              return fetch('/api/user/achievements?check=true', { signal: progressSyncRef.current?.signal });
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
      } else if (!verifyData.verified) {
        toast.error(t('task.notVerified'), {
          description: verifyData.message || t('task.notVerifiedDetail'),
        });
      }
    },
    [currentTaskId, isTaskCompleted, markTaskCompleted, updateStreak, session, practiceMode.active, nextPracticeTask],
  );

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

      if (currentTaskId && data.success) {
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

          handleVerifiedTask(verifyData);
        } catch (e) {
          logger.error('Task verification failed', e);
          toast.error(t('task.verificationError', { default: 'Failed to verify query result' }));
        }
      }
    } catch (e) {
      logger.error('Query execution failed', e);
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
    setVerification,
    handleVerifiedTask,
  ]);

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
    } catch (e) {
      logger.error('EXPLAIN request failed', e);
      setExplainPlan(t('results.error'));
      setExplainSuggestions([]);
    } finally {
      setIsExecuting(false);
    }
  }, [
    editorContent,
    isExecuting,
    dbType,
    currentTaskId,
    setIsExecuting,
    incrementExplainCount,
    setExplainPlan,
    setExplainSuggestions,
  ]);

  const executeVerify = useCallback(async () => {
    if (!editorContent.trim() || isExecuting || !currentTaskId) return;

    setIsExecuting(true);

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

      handleVerifiedTask(verifyData);
    } catch (e) {
      logger.error('Verify request failed', e);
      toast.error(t('task.verifyError'));
    } finally {
      setIsExecuting(false);
    }
  }, [editorContent, isExecuting, currentTaskId, dbType, setIsExecuting, setVerification, handleVerifiedTask]);

  return {
    executeQuery,
    executeExplain,
    executeVerify,
    attemptCountRef,
    progressSyncRef,
    practiceTimerRef,
  };
}
