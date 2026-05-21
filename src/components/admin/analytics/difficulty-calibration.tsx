'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Scale } from 'lucide-react';
import { t } from '@/lib/i18n';
import { useDateRange } from '../analytics-dashboard';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ZAxis,
} from 'recharts';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import EmptyState from './empty-state';

export default function DifficultyCalibration() {
  const [tasks, setTasks] = useState<Array<{
    task_id: string; task_title: string; intended_difficulty: string; completions: number;
    avg_attempts: number; first_attempt_rate: number; failure_rate: number;
    actual_difficulty_score: number; recommended_difficulty: string; is_misclassified: boolean;
  }>>([]);
  const [misclassifiedCount, setMisclassifiedCount] = useState(0);
  const [totalTasks, setTotalTasks] = useState(0);
  const [misclassifiedRate, setMisclassifiedRate] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/analytics/difficulty-calibration')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        setTasks(data.tasks || []);
        setMisclassifiedCount(data.misclassified_count || 0);
        setTotalTasks(data.total_tasks || 0);
        setMisclassifiedRate(data.misclassified_rate || 0);
      })
      .catch(() => setError(t('analytics.error')))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-center py-4">{t('analytics.loading')}</p>;
  if (error) return <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>;
  if (tasks.length === 0) return <EmptyState />;

  const difficultyScores = { beginner: 20, intermediate: 50, advanced: 80 };

  const scatterData = tasks.filter(t => t.completions >= 5).map(t => ({
    ...t,
    intended_x: difficultyScores[t.intended_difficulty as keyof typeof difficultyScores] || 50,
    x: t.actual_difficulty_score,
    y: t.avg_attempts,
    size: t.completions,
  }));

  const misclassifiedTasks = tasks.filter(t => t.is_misclassified);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">{t('analytics.calibration.title')}</h2>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Scale className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-2xl font-bold">{totalTasks}</p>
              <p className="text-xs text-muted-foreground">{t('analytics.calibration.task')}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="h-8 w-8 text-red-600" />
            <div>
              <p className="text-2xl font-bold">{misclassifiedCount}</p>
              <p className="text-xs text-muted-foreground">{t('analytics.calibration.misclassified')}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Scale className="h-8 w-8 text-amber-600" />
            <div>
              <p className="text-2xl font-bold">{misclassifiedRate}%</p>
              <p className="text-xs text-muted-foreground">{t('analytics.calibration.misclassifiedRate')}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>{t('analytics.calibration.actual')} vs {t('analytics.calibration.intended')}</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="x" name="Actual Score" type="number" domain={[0, 100]} />
              <YAxis dataKey="y" name="Avg Attempts" type="number" />
              <ZAxis dataKey="size" range={[20, 200]} />
              <Tooltip content={({ active, payload }) => {
                if (active && payload && payload[0]) {
                  const d = payload[0].payload;
                  return (
                    <div className="bg-background border rounded p-2 text-sm">
                      <p className="font-bold">{d.task_title}</p>
                      <p>{t('analytics.calibration.intended')}: {d.intended_difficulty}</p>
                      <p>{t('analytics.calibration.actual')}: {d.actual_difficulty_score}</p>
                      <p>{t('analytics.tasks.avgAttempts')}: {d.avg_attempts}</p>
                    </div>
                  );
                }
                return null;
              }} />
              <ReferenceLine x={30} stroke="#94a3b8" strokeDasharray="3 3" />
              <ReferenceLine x={60} stroke="#94a3b8" strokeDasharray="3 3" />
              <Scatter data={scatterData} fill="#3b82f6" />
            </ScatterChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {misclassifiedTasks.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-red-600">{t('analytics.calibration.misclassified')}</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('analytics.calibration.task')}</TableHead>
                  <TableHead>{t('analytics.calibration.intended')}</TableHead>
                  <TableHead>{t('analytics.calibration.recommended')}</TableHead>
                  <TableHead>{t('analytics.calibration.score')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {misclassifiedTasks.map(task => (
                  <TableRow key={task.task_id}>
                    <TableCell className="font-medium">{task.task_title}</TableCell>
                    <TableCell><Badge>{task.intended_difficulty}</Badge></TableCell>
                    <TableCell><Badge variant="destructive">{task.recommended_difficulty}</Badge></TableCell>
                    <TableCell>{task.actual_difficulty_score}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
