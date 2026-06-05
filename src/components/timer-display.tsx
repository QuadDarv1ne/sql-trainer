'use client';

import { useEffect, useCallback } from 'react';
import { useSQLTrainerStore } from '@/lib/store';
import { Clock, Play, Pause, Square, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export function TimerDisplay() {
  const { timer, startTimer, pauseTimer, resumeTimer, stopTimer, tickTimer } = useSQLTrainerStore();

  // Tick timer every second
  useEffect(() => {
    if (!timer.isActive || timer.isPaused) return;

    const interval = setInterval(() => {
      tickTimer();
    }, 1000);

    return () => clearInterval(interval);
  }, [timer.isActive, timer.isPaused, tickTimer]);

  // Auto-stop when time runs out
  useEffect(() => {
    if (timer.isActive && timer.timeRemaining === 0) {
      stopTimer();
      // Could trigger a modal or notification here
    }
  }, [timer.timeRemaining, timer.isActive, stopTimer]);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const getWarningColor = () => {
    if (!timer.isActive || timer.isPaused) return '';
    const remainingPercent = (timer.timeRemaining / timer.totalDuration) * 100;
    if (remainingPercent <= 10) return 'text-red-600 dark:text-red-400';
    if (remainingPercent <= 25) return 'text-amber-600 dark:text-amber-400';
    return 'text-foreground';
  };

  const getProgressBarColor = () => {
    if (!timer.isActive || timer.isPaused) return 'bg-muted-foreground/20';
    const remainingPercent = (timer.timeRemaining / timer.totalDuration) * 100;
    if (remainingPercent <= 10) return 'bg-red-500';
    if (remainingPercent <= 25) return 'bg-amber-500';
    return 'bg-blue-500';
  };

  if (!timer.isActive) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 border border-border">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Таймер не активен</span>
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => startTimer()}>
          <Play className="h-3 w-3" />
          Старт
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-card border border-border shadow-sm">
      {/* Timer display */}
      <div className="flex items-center gap-2">
        <div className={`flex items-center gap-1.5 font-mono text-sm font-semibold ${getWarningColor()}`}>
          {timer.isPaused ? (
            <Pause className="h-4 w-4" />
          ) : timer.timeRemaining <= 10 ? (
            <AlertTriangle className="h-4 w-4 animate-pulse" />
          ) : (
            <Clock className="h-4 w-4" />
          )}
          <span>{formatTime(timer.timeRemaining)}</span>
        </div>

        {/* Progress bar */}
        <div className="w-24 h-1.5 rounded-full bg-muted-foreground/20 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${getProgressBarColor()}`}
            style={{ width: `${(timer.timeRemaining / timer.totalDuration) * 100}%` }}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-1">
        {timer.isPaused ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 hover:text-emerald-600"
                onClick={resumeTimer}
              >
                <Play className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Продолжить</TooltipContent>
          </Tooltip>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 hover:bg-amber-50 dark:hover:bg-amber-950/20 hover:text-amber-600"
                onClick={pauseTimer}
              >
                <Pause className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Пауза</TooltipContent>
          </Tooltip>
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600"
              onClick={stopTimer}
            >
              <Square className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Остановить</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}

export function TimerSettings() {
  const { timerSettings, setTimerSettings } = useSQLTrainerStore();

  const presets = [
    { label: '15 мин', minutes: 15 },
    { label: '30 мин', minutes: 30 },
    { label: '45 мин', minutes: 45 },
    { label: '60 мин', minutes: 60 },
  ];

  return (
    <div className="p-4 space-y-4">
      <div>
        <h3 className="text-sm font-semibold mb-2">Длительность сессии</h3>
        <div className="flex flex-wrap gap-2">
          {presets.map((preset) => (
            <button
              key={preset.minutes}
              onClick={() => setTimerSettings({ defaultDuration: preset.minutes * 60 })}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                timerSettings.defaultDuration === preset.minutes * 60
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                  : 'bg-muted hover:bg-muted/80 text-foreground'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-2">Предупреждение (минут)</h3>
        <input
          type="number"
          min="1"
          max="30"
          value={Math.floor(timerSettings.warningThreshold / 60)}
          onChange={(e) => {
            const minutes = Math.max(1, Math.min(30, parseInt(e.target.value) || 1));
            setTimerSettings({ warningThreshold: minutes * 60 });
          }}
          className="w-20 px-3 py-2 rounded-lg border border-border bg-background text-sm"
        />
      </div>
    </div>
  );
}
