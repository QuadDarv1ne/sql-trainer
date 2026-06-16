'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  Flame,
  Award,
  BookOpen,
  AlertTriangle,
  Lightbulb,
  Clock,
} from 'lucide-react';
import { t } from '@/lib/i18n';
import EmptyState from './empty-state';

interface AcademicSummary {
  user_id: string;
  name: string;
  email: string;
  role: string;
  created_at: number;
  last_active: number | null;
  tasks_completed: number;
  total_tasks: number;
  completion_rate: number;
  avg_attempts: number;
  total_attempts: number;
  streak_current: number;
  streak_longest: number;
  achievements: Array<{ title: string; earned_at: number }>;
  skill_breakdown: Array<{
    category: string;
    label: string;
    completed: number;
    total: number;
    rate: number;
    avg_attempts: number;
  }>;
  recent_activity: Array<{ task_id: string; task_title: string; completed_at: number; attempts: number }>;
  performance_trend: 'improving' | 'stable' | 'declining';
  at_risk_flags: string[];
  recommendations: string[];
}

const flagLabels: Record<string, string> = {
  low_completion: t('analytics.atRisk.lowCompletion'),
  inactive: t('analytics.atRisk.noActivity'),
  high_attempts: t('analytics.atRisk.highAttempts'),
  declining_trend: t('analytics.atRisk.declining'),
};

const recommendationLabels: Record<string, string> = {
  increase_practice: t('academicProfile.recommendations.increasePractice'),
  review_fundamentals: t('academicProfile.recommendations.reviewFundamentals'),
  build_streak: t('academicProfile.recommendations.buildStreak'),
  re_engage: t('academicProfile.recommendations.reEngage'),
};

interface StudentAcademicProfileProps {
  studentId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function StudentAcademicProfile({ studentId, open, onOpenChange }: StudentAcademicProfileProps) {
  const [data, setData] = useState<AcademicSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open || !studentId) return;
    setLoading(true);
    setError('');
    setData(null);
    fetch(`/api/admin/analytics/student/${studentId}/academic-summary`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Failed to fetch student academic profile'))))
      .then((d) => setData(d.academicSummary))
      .catch(() => setError(t('analytics.error')))
      .finally(() => setLoading(false));
  }, [studentId, open]);

  if (!studentId) return null;

  const TrendIcon =
    data?.performance_trend === 'improving'
      ? TrendingUp
      : data?.performance_trend === 'declining'
        ? TrendingDown
        : Minus;
  const trendColor =
    data?.performance_trend === 'improving'
      ? 'text-emerald-600 dark:text-emerald-400'
      : data?.performance_trend === 'declining'
        ? 'text-red-600 dark:text-red-400'
        : 'text-gray-400 dark:text-gray-300';

  const getSkillColor = (rate: number) =>
    rate >= 75 ? 'text-emerald-600' : rate >= 50 ? 'text-amber-600' : 'text-red-600';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{data ? t('academicProfile.title', { name: data.name }) : t('analytics.loading')}</DialogTitle>
        </DialogHeader>

        {loading && <p className="text-center py-8">{t('analytics.loading')}</p>}
        {error && <p className="text-center py-8 text-red-600">{error}</p>}
        {!loading && !data && !error && <EmptyState />}

        {data && (
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="flex-wrap h-auto">
              <TabsTrigger value="overview">{t('academicProfile.overview')}</TabsTrigger>
              <TabsTrigger value="skills">{t('academicProfile.skills')}</TabsTrigger>
              <TabsTrigger value="activity">{t('academicProfile.activity')}</TabsTrigger>
              <TabsTrigger value="achievements">{t('academicProfile.achievements')}</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              {/* Risk Flags */}
              {data.at_risk_flags.length > 0 && (
                <Card className="border-red-200 dark:border-red-800">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2 text-red-600">
                      <AlertTriangle className="h-4 w-4" />
                      {t('academicProfile.riskFlags')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {data.at_risk_flags.map((flag) => (
                        <Badge key={flag} variant="destructive">
                          {flagLabels[flag] || flag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Stats Grid */}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardContent className="p-4 flex items-center gap-3">
                    <Target className="h-8 w-8 text-emerald-600 shrink-0" />
                    <div>
                      <p className="text-2xl font-bold">
                        {data.tasks_completed}/{data.total_tasks}
                      </p>
                      <p className="text-xs text-muted-foreground">{t('academicProfile.tasksCompleted')}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 flex items-center gap-3">
                    <Clock className="h-8 w-8 text-amber-600 shrink-0" />
                    <div>
                      <p className="text-2xl font-bold">{data.completion_rate}%</p>
                      <p className="text-xs text-muted-foreground">{t('academicProfile.completionRate')}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 flex items-center gap-3">
                    <Flame className="h-8 w-8 text-orange-500 shrink-0" />
                    <div>
                      <p className="text-2xl font-bold">{data.streak_current}</p>
                      <p className="text-xs text-muted-foreground">
                        {t('academicProfile.streak')} (max: {data.streak_longest})
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 flex items-center gap-3">
                    <TrendIcon className={`h-8 w-8 shrink-0 ${trendColor}`} />
                    <div>
                      <p className={`text-lg font-bold capitalize ${trendColor}`}>
                        {t(`analytics.students.trend.${data.performance_trend}`)}
                      </p>
                      <p className="text-xs text-muted-foreground">{t('academicProfile.trend')}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recommendations */}
              {data.recommendations.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 text-amber-500" />
                      {t('academicProfile.recommendations.title')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1 text-sm">
                      {data.recommendations.map((rec) => {
                        const key = rec.startsWith('focus_on_') ? `focus_on_${rec.replace('focus_on_', '')}` : rec;
                        const label = recommendationLabels[key] || rec;
                        return (
                          <li key={rec} className="flex items-center gap-2">
                            <span className="text-amber-500">•</span>
                            {label}
                          </li>
                        );
                      })}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Skills Tab */}
            <TabsContent value="skills" className="space-y-4">
              {data.skill_breakdown.map((skill) => (
                <Card key={skill.category}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{skill.label}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`font-bold ${getSkillColor(skill.rate)}`}>{skill.rate}%</span>
                        <span className="text-xs text-muted-foreground">
                          {skill.completed}/{skill.total}
                        </span>
                      </div>
                    </div>
                    <Progress value={skill.rate} className="h-2 mb-2" />
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span>
                        {t('academicProfile.attempts')}: {skill.avg_attempts}
                      </span>
                      <span>
                        {skill.completed === skill.total
                          ? t('academicProfile.complete')
                          : `${skill.total - skill.completed} ${t('academicProfile.remaining')}`}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            {/* Activity Tab */}
            <TabsContent value="activity" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>{t('academicProfile.recentActivity')}</CardTitle>
                  <CardDescription>{t('academicProfile.recentActivityDesc')}</CardDescription>
                </CardHeader>
                <CardContent>
                  {data.recent_activity.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t('analytics.student.neverActive')}</p>
                  ) : (
                    <div className="space-y-2">
                      {data.recent_activity.map((activity) => (
                        <div
                          key={activity.task_id}
                          className="flex items-center justify-between py-2 border-b last:border-0"
                        >
                          <div>
                            <p className="font-medium text-sm">{activity.task_title}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(activity.completed_at).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                          <Badge variant={activity.attempts === 1 ? 'default' : 'secondary'}>
                            {activity.attempts} {t('analytics.leaderboard.attempts')}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Achievements Tab */}
            <TabsContent value="achievements" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    {t('academicProfile.achievements')} ({data.achievements.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {data.achievements.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t('analytics.student.noAchievements')}</p>
                  ) : (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {data.achievements.map((achievement) => (
                        <div
                          key={`${achievement.title}-${achievement.earned_at}`}
                          className="flex items-start gap-2 p-3 rounded-lg border"
                        >
                          <Award className="h-4 w-4 text-purple-600 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-sm font-medium">{achievement.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(achievement.earned_at).toLocaleDateString(undefined)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
