'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, XCircle, Target, Calendar, BookOpen, Search } from 'lucide-react';
import { t } from '@/lib/i18n';

export default function LearningPlan() {
  const [userId, setUserId] = useState('');
  const [plan, setPlan] = useState<{
    student_name: string;
    current_level: string;
    completed_tasks: number;
    remaining_tasks: number;
    completed_by_difficulty: { beginner: number; intermediate: number; advanced: number };
    next_tasks: Array<{ task_id: string; task_title: string; difficulty: string; estimated_hours: number }>;
    milestones: Array<{ milestone: string; target_date: string }>;
    risk_factors: string[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchPlan = () => {
    if (!userId.trim()) return;
    setLoading(true);
    setError('');
    fetch(`/api/admin/analytics/learning-plan?userId=${encodeURIComponent(userId.trim())}`)
      .then((r) => {
        if (!r.ok) throw new Error('Plan not found');
        return r.json();
      })
      .then(setPlan)
      .catch(() => setError(t('analytics.learningPlan.error')))
      .finally(() => setLoading(false));
  };

  const difficultyColor = (diff: string) => {
    if (diff === 'beginner') return 'bg-green-100 text-green-800';
    if (diff === 'intermediate') return 'bg-amber-100 text-amber-800';
    return 'bg-red-100 text-red-800';
  };

  const levelBadge = (level: string) => {
    if (level === 'beginner') return <Badge className="bg-green-600">{t('analytics.learningPlan.beginner')}</Badge>;
    if (level === 'intermediate')
      return <Badge className="bg-amber-600">{t('analytics.learningPlan.intermediate')}</Badge>;
    return <Badge className="bg-red-600">{t('analytics.learningPlan.advanced')}</Badge>;
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">{t('analytics.learningPlan.title')}</h2>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            {t('analytics.learningPlan.selectStudent')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="userId">{t('analytics.learningPlan.studentId')}</Label>
              <Input
                id="userId"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="Enter student ID"
                onKeyDown={(e) => e.key === 'Enter' && fetchPlan()}
              />
            </div>
            <Button onClick={fetchPlan} disabled={loading || !userId.trim()} className="mt-8">
              {loading ? t('analytics.loading') : t('analytics.learningPlan.generate')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {plan && (
        <>
          {/* Student Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <BookOpen className="h-5 w-5" />
                {plan.student_name}
                {levelBadge(plan.current_level)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{plan.completed_tasks}</div>
                  <div className="text-sm text-muted-foreground">{t('analytics.learningPlan.completed')}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-amber-600">{plan.remaining_tasks}</div>
                  <div className="text-sm text-muted-foreground">{t('analytics.learningPlan.remaining')}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{plan.completed_by_difficulty.beginner}/8</div>
                  <div className="text-sm text-muted-foreground">{t('analytics.learningPlan.beginner')}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-amber-600">
                    {plan.completed_by_difficulty.intermediate}/15
                  </div>
                  <div className="text-sm text-muted-foreground">{t('analytics.learningPlan.intermediate')}</div>
                </div>
              </div>
              <div className="mt-4 text-center">
                <div className="text-2xl font-bold text-red-600">{plan.completed_by_difficulty.advanced}/25</div>
                <div className="text-sm text-muted-foreground">{t('analytics.learningPlan.advanced')}</div>
              </div>
            </CardContent>
          </Card>

          {/* Next Tasks */}
          {plan.next_tasks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  {t('analytics.learningPlan.nextTasks')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {plan.next_tasks.map((task, i) => (
                    <div key={task.task_id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div className="flex items-center gap-3">
                        <span className="text-muted-foreground font-medium">{i + 1}.</span>
                        <span>{task.task_title}</span>
                        <Badge className={difficultyColor(task.difficulty)}>{task.difficulty}</Badge>
                      </div>
                      <span className="text-sm text-muted-foreground">~{task.estimated_hours}h</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Milestones */}
          {plan.milestones.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {t('analytics.learningPlan.milestones')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {plan.milestones.map((m) => (
                    <div
                      key={`${m.milestone}-${m.target_date}`}
                      className="flex items-center justify-between py-2 border-b last:border-0"
                    >
                      <span>{m.milestone}</span>
                      <Badge variant="outline">{m.target_date}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Risk Factors */}
          {plan.risk_factors.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="h-5 w-5" />
                  {t('analytics.learningPlan.riskFactors')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {plan.risk_factors.map((risk) => (
                    <div key={risk} className="flex items-center gap-2 py-1">
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span className="text-sm">{risk}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
