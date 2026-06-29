'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { CheckCircle2, Circle, Lock, Star, Zap, TrendingUp, Target, Award, ArrowRight, Play } from 'lucide-react';
import { TRAINING_TASKS, DIFFICULTY_LABELS, DIFFICULTY_COLORS, type Difficulty } from '@/lib/training-tasks';
import { t } from '@/lib/i18n';

interface LearningPathProps {
  completedTasks?: Array<{ taskId: string; attempts: number; completedAt: number }>;
  userLevel?: number;
  onTaskSelect?: (taskId: string) => void;
}

interface TaskNode {
  id: string;
  title: string;
  difficulty: Difficulty;
  category: string;
  completed: boolean;
  locked: boolean;
  xpReward: number;
  prerequisites: string[];
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'SQL Basics': <Target className="h-4 w-4" />,
  Filtering: <Target className="h-4 w-4" />,
  Sorting: <TrendingUp className="h-4 w-4" />,
  Aggregation: <Award className="h-4 w-4" />,
  Joins: <Zap className="h-4 w-4" />,
  Advanced: <Star className="h-4 w-4" />,
};

const CATEGORY_LOCALE_MAP: Record<string, string> = {
  'SQL Basics': 'learningPath.category.sqlBasics',
  Filtering: 'learningPath.category.filtering',
  Sorting: 'learningPath.category.sorting',
  Aggregation: 'learningPath.category.aggregation',
  Joins: 'learningPath.category.joins',
  Advanced: 'learningPath.category.advanced',
};

const XP_PER_DIFFICULTY: Record<Difficulty, number> = {
  beginner: 10,
  intermediate: 25,
  advanced: 50,
};

export default function LearningPath({ completedTasks = [], userLevel = 1, onTaskSelect }: LearningPathProps) {
  const completedIds = useMemo(() => new Set(completedTasks.map((t) => t.taskId)), [completedTasks]);

  // Build task dependency graph
  const taskNodes: TaskNode[] = useMemo(() => {
    return TRAINING_TASKS.map((task, index) => {
      // Simple prerequisite: previous task in same difficulty must be completed
      const prerequisites: string[] = [];
      if (index > 0) {
        const prevTask = TRAINING_TASKS[index - 1];
        if (prevTask.difficulty === task.difficulty) {
          prerequisites.push(prevTask.id);
        }
      }

      const locked = prerequisites.some((prereqId) => !completedIds.has(prereqId));

      return {
        id: task.id,
        title: task.title,
        difficulty: task.difficulty,
        category: task.category || 'General',
        completed: completedIds.has(task.id),
        locked: index > 0 && locked,
        xpReward: XP_PER_DIFFICULTY[task.difficulty],
        prerequisites,
      };
    });
  }, [completedIds]);

  // Group tasks by difficulty and category
  const groupedTasks = useMemo(() => {
    const groups: Record<Difficulty, Record<string, TaskNode[]>> = {
      beginner: {},
      intermediate: {},
      advanced: {},
    };

    taskNodes.forEach((task) => {
      const diff = task.difficulty;
      const cat = task.category || 'Other';
      if (!groups[diff][cat]) {
        groups[diff][cat] = [];
      }
      groups[diff][cat].push(task);
    });

    return groups;
  }, [taskNodes]);

  const totalTasks = taskNodes.length;
  const completedCount = taskNodes.filter((t) => t.completed).length;
  const overallProgress = totalTasks > 0 ? (completedCount / totalTasks) * 100 : 0;

  const totalXP = taskNodes.filter((t) => t.completed).reduce((sum, t) => sum + t.xpReward, 0);

  const handleTaskClick = (task: TaskNode) => {
    if (!task.locked && onTaskSelect) {
      onTaskSelect(task.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-600" />
            {t('learning.path.title', { default: 'Your learning path' })}
          </CardTitle>
          <CardDescription>
            {t('learning.path.subtitle', { default: 'Progressive SQL learning from basics to advanced' })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Progress value={overallProgress} className="h-3" />
              <p className="text-sm text-muted-foreground">
                {completedCount} / {totalTasks} {t('learning.path.tasks', { default: 'tasks completed' })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-500" />
              <div>
                <p className="text-lg font-bold">{totalXP} XP</p>
                <p className="text-xs text-muted-foreground">{t('learning.path.earned', { default: 'Earned' })}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-lg font-bold">
                  {t('learning.path.levelLabel', { default: 'Level' })} {userLevel}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t('learning.path.level', { default: 'Current level' })}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Learning Path by Difficulty */}
      <Accordion type="single" collapsible defaultValue="beginner" className="w-full">
        {(['beginner', 'intermediate', 'advanced'] as Difficulty[]).map((difficulty) => {
          const categories = groupedTasks[difficulty];
          const diffTotal = Object.values(categories).flat().length;
          const diffCompleted = Object.values(categories)
            .flat()
            .filter((t) => t.completed).length;
          const diffProgress = diffTotal > 0 ? (diffCompleted / diffTotal) * 100 : 0;

          return (
            <AccordionItem key={difficulty} value={difficulty}>
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3 w-full">
                  <Badge className={`${DIFFICULTY_COLORS[difficulty]} text-sm px-3 py-1`}>
                    {DIFFICULTY_LABELS[difficulty]}
                  </Badge>
                  <div className="flex-1" />
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {diffCompleted} / {diffTotal} {t('learning.path.completed', { default: 'completed' })}
                    <Progress value={diffProgress} className="w-24 h-2" />
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-2">
                  {Object.entries(categories).map(([category, tasks]) => (
                    <Card key={category} className="overflow-hidden">
                      <CardHeader className="pb-3 bg-muted/30">
                        <div className="flex items-center gap-2">
                          {CATEGORY_ICONS[category] || <Target className="h-4 w-4" />}
                          <CardTitle className="text-base">{t(CATEGORY_LOCALE_MAP[category] || category)}</CardTitle>
                          <Badge variant="outline" className="ml-auto">
                            {tasks.filter((t) => t.completed).length} / {tasks.length}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          {tasks.map((task, idx) => (
                            <div
                              key={task.id}
                              className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                                task.completed
                                  ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900'
                                  : task.locked
                                    ? 'bg-muted/30 border-muted opacity-60 cursor-not-allowed'
                                    : 'bg-background border-border hover:border-emerald-300 dark:hover:border-emerald-700'
                              }`}
                              onClick={() => handleTaskClick(task)}
                              role="button"
                              tabIndex={task.locked ? -1 : 0}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !task.locked) {
                                  handleTaskClick(task);
                                }
                              }}
                            >
                              {/* Status Icon */}
                              <div className="shrink-0">
                                {task.completed ? (
                                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                                ) : task.locked ? (
                                  <Lock className="h-5 w-5 text-muted-foreground" />
                                ) : (
                                  <Circle className="h-5 w-5 text-muted-foreground" />
                                )}
                              </div>

                              {/* Task Info */}
                              <div className="flex-1 min-w-0">
                                <p
                                  className={`font-medium truncate ${task.completed ? 'text-emerald-700 dark:text-emerald-400' : ''}`}
                                >
                                  {idx + 1}. {task.title}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                  <Badge variant="outline" className="text-xs">
                                    {task.xpReward} XP
                                  </Badge>
                                  {task.prerequisites.length > 0 && !task.completed && (
                                    <span>
                                      {t('learning.path.requires', { default: 'Required:' })}{' '}
                                      {task.prerequisites.length}{' '}
                                      {t('learning.path.prerequisites', { default: 'prerequisite tasks' })}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Action Button */}
                              {!task.locked && !task.completed && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="shrink-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (onTaskSelect) onTaskSelect(task.id);
                                  }}
                                >
                                  <Play className="h-4 w-4 mr-1" />
                                  {t('learning.path.start', { default: 'Start' })}
                                </Button>
                              )}

                              {task.completed && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="shrink-0 text-emerald-600"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (onTaskSelect) onTaskSelect(task.id);
                                  }}
                                >
                                  <ArrowRight className="h-4 w-4" />
                                  {t('learning.path.repeat', { default: 'Review' })}
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            <div>
              <p className="text-2xl font-bold">{completedCount}</p>
              <p className="text-xs text-muted-foreground">{t('learning.path.done', { default: 'Completed' })}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Circle className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">
                {totalTasks - completedCount - taskNodes.filter((t) => t.locked).length}
              </p>
              <p className="text-xs text-muted-foreground">{t('learning.path.available', { default: 'Available' })}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Lock className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-2xl font-bold">{taskNodes.filter((t) => t.locked).length}</p>
              <p className="text-xs text-muted-foreground">{t('learning.path.locked', { default: 'Locked' })}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Award className="h-8 w-8 text-amber-500" />
            <div>
              <p className="text-2xl font-bold">{Math.round((completedCount / totalTasks) * 100)}%</p>
              <p className="text-xs text-muted-foreground">{t('learning.path.progress', { default: 'Progress' })}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
