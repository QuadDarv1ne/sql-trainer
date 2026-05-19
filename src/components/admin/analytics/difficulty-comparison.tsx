'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertCircle } from 'lucide-react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
} from 'recharts';
import { t } from '@/lib/i18n';

interface DifficultyComparisonEntry {
  difficulty: string;
  total_students_attempted: number;
  total_completions: number;
  avg_attempts: number;
  completion_rate: number;
  first_attempt_rate: number;
  avg_time_to_complete: number;
}

export default function DifficultyComparisonChart() {
  const [data, setData] = useState<DifficultyComparisonEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/analytics/difficulty')
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load');
        return r.json();
      })
      .then((data) => setData(data.comparison))
      .catch(() => setError(t('analytics.error')))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-center py-4">{t('analytics.loading')}</p>;
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }
  if (!data.length) return <p className="text-center py-4">{t('analytics.noData')}</p>;

  const difficultyLabels: Record<string, string> = {
    beginner: t('analytics.student.beginner'),
    intermediate: t('analytics.student.intermediate'),
    advanced: t('analytics.student.advanced'),
  };

  const difficultyColors: Record<string, string> = {
    beginner: 'border-emerald-500 text-emerald-600',
    intermediate: 'border-amber-500 text-amber-600',
    advanced: 'border-red-500 text-red-600',
  };

  const radarData = data.map(d => ({
    name: difficultyLabels[d.difficulty],
    completion_rate: d.completion_rate,
    first_attempt_rate: d.first_attempt_rate,
    inverse_attempts: Math.max(0, 100 - d.avg_attempts * 10), // Invert for better visualization
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('analytics.difficulty.title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Radar Chart */}
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={radarData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="name" />
            <PolarRadiusAxis angle={30} domain={[0, 100]} />
            <Radar
              name={t('analytics.difficulty.completion')}
              dataKey="completion_rate"
              stroke="hsl(var(--primary))"
              fill="hsl(var(--primary))"
              fillOpacity={0.3}
            />
            <Radar
              name={t('analytics.difficulty.firstAttempt')}
              dataKey="first_attempt_rate"
              stroke="hsl(var(--destructive))"
              fill="hsl(var(--destructive))"
              fillOpacity={0.3}
            />
            <Legend />
          </RadarChart>
        </ResponsiveContainer>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          {data.map((entry) => (
            <div key={entry.difficulty} className="p-4 rounded-lg border space-y-3">
              <Badge variant="outline" className={difficultyColors[entry.difficulty]}>
                {difficultyLabels[entry.difficulty]}
              </Badge>
              
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{t('analytics.difficulty.completion')}</span>
                    <span className="font-medium">{entry.completion_rate}%</span>
                  </div>
                  <Progress value={entry.completion_rate} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{t('analytics.difficulty.firstAttempt')}</span>
                    <span className="font-medium">{entry.first_attempt_rate}%</span>
                  </div>
                  <Progress value={entry.first_attempt_rate} className="h-2" />
                </div>

                <div className="flex justify-between text-xs pt-1 border-t">
                  <span className="text-muted-foreground">{t('analytics.difficulty.attempted')}</span>
                  <span className="font-medium">{entry.total_students_attempted}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
