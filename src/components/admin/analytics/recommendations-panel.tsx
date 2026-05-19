'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Lightbulb, ListChecks } from 'lucide-react';
import { t } from '@/lib/i18n';

interface Recommendation {
  user_id: string;
  name: string;
  recommendation_type: 'practice_more' | 'review_basics' | 'advance_level' | 'seek_help' | 'maintain_pace';
  priority: 'high' | 'medium' | 'low';
  description: string;
  action_items: string[];
}

const priorityColors = {
  high: 'border-red-500 bg-red-50 dark:bg-red-950/20',
  medium: 'border-amber-500 bg-amber-50 dark:bg-amber-950/20',
  low: 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20',
};

const typeLabels: Record<string, string> = {
  practice_more: 'analytics.recommendations.practiceMore',
  review_basics: 'analytics.recommendations.reviewBasics',
  advance_level: 'analytics.recommendations.advanceLevel',
  seek_help: 'analytics.recommendations.seekHelp',
  maintain_pace: 'analytics.recommendations.maintainPace',
};

export default function RecommendationsPanel() {
  const [data, setData] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/analytics/recommendations')
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((data) => setData(data.recommendations))
      .catch(() => setError(t('analytics.error')))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-center py-4">{t('analytics.loading')}</p>;
  if (error) return <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>;
  if (!data.length) return <Card><CardContent className="p-6 text-center text-muted-foreground">{t('analytics.recommendations.noRecommendations')}</CardContent></Card>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-amber-600" />
          {t('analytics.recommendations.title')} ({data.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.map((rec, index) => (
          <div key={index} className={`p-4 border-l-4 rounded ${priorityColors[rec.priority]}`}>
            <div className="flex items-start gap-3">
              <Lightbulb className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{rec.name}</h4>
                  <Badge
                    variant="outline"
                    className={
                      rec.priority === 'high'
                        ? 'border-red-500 text-red-600'
                        : rec.priority === 'medium'
                        ? 'border-amber-500 text-amber-600'
                        : 'border-emerald-500 text-emerald-600'
                    }
                  >
                    {t(`analytics.recommendations.priority.${rec.priority}`)}
                  </Badge>
                </div>
                <p className="text-sm">{t(typeLabels[rec.recommendation_type])}</p>
                <div className="bg-background/50 rounded p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <ListChecks className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">
                      {t('analytics.recommendations.actionItems')}:
                    </span>
                  </div>
                  <ul className="text-sm space-y-1 ml-6 list-disc">
                    {rec.action_items.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
