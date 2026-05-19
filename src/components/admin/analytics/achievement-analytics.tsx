'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Award, Clock } from 'lucide-react';
import { t } from '@/lib/i18n';
import { useDateRange } from '../analytics-dashboard';
import EmptyState from './empty-state';

interface AchievementStatsEntry {
  id: string;
  title: string;
  description: string;
  icon: string;
  earned_count: number;
  total_students: number;
  earn_rate: number;
  recent_earners: { user_id: string; name: string; earned_at: number }[];
}

export default function AchievementAnalytics() {
  const [data, setData] = useState<AchievementStatsEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { startDate, endDate } = useDateRange();

  useEffect(() => {
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', String(startDate));
    if (endDate) params.set('endDate', String(endDate));

    fetch(`/api/admin/analytics/achievements?${params}`)
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load');
        return r.json();
      })
      .then((data) => setData(data.achievements))
      .catch(() => setError(t('analytics.error')))
      .finally(() => setLoading(false));
  }, [startDate, endDate]);

  if (loading) return <p className="text-center py-4">{t('analytics.loading')}</p>;
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }
  if (!data.length) return <EmptyState />;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('analytics.achievements.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((achievement) => (
            <div key={achievement.id} className="p-4 rounded-lg border space-y-3">
              <div className="flex items-start gap-3">
                <Award className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-medium">{achievement.title}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {achievement.description}
                      </p>
                    </div>
                    <Badge variant="outline" className="flex-shrink-0">
                      {achievement.earn_rate}%
                    </Badge>
                  </div>

                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                      <span>
                        {achievement.earned_count}/{achievement.total_students} {t('analytics.achievements.earnRate').toLowerCase()}
                      </span>
                    </div>
                    <Progress value={achievement.earn_rate} className="h-2" />
                  </div>

                  {achievement.recent_earners.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-muted-foreground mb-1">
                        {t('analytics.achievements.recent')}:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {achievement.recent_earners.map((earner) => (
                          <div
                            key={earner.user_id}
                            className="flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded"
                          >
                            <Clock className="h-3 w-3" />
                            <span>{earner.name}</span>
                            <span className="text-muted-foreground">
                              {new Date(earner.earned_at).toLocaleDateString('ru-RU')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
