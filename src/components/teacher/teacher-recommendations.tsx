'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Lightbulb } from 'lucide-react';
import { t } from '@/lib/i18n';

interface Recommendation {
  type: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  target_users?: string[];
}

const priorityLabels: Record<string, string> = {
  high: 'Высокий',
  medium: 'Средний',
  low: 'Низкий',
};

const priorityColors: Record<string, string> = {
  high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  medium: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  low: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
};

export default function TeacherRecommendations() {
  const [data, setData] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/teacher/recommendations')
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load');
        return r.json();
      })
      .then((res) => setData(res.data))
      .catch(() => setError(t('teacher.error')))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-center py-4">{t('teacher.loading')}</p>;
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }
  if (!data.length) return <p className="text-center py-4">{t('teacher.noData')}</p>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-amber-500" />
          {t('teacher.recommendations.title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((rec, i) => (
            <div key={i} className="rounded-lg border p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h4 className="font-medium">{rec.title}</h4>
                <Badge className={priorityColors[rec.priority] || ''}>
                  {priorityLabels[rec.priority] || rec.priority}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-2">{rec.description}</p>
              {rec.target_users && rec.target_users.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {t('teacher.recommendations.target')}: {rec.target_users.slice(0, 5).join(', ')}
                  {rec.target_users.length > 5 && ` +${rec.target_users.length - 5}`}
                </p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
