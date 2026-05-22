'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, BarChart3, TrendingUp, CheckCircle2, XCircle } from 'lucide-react';
import { t } from '@/lib/i18n';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

export default function ABTest() {
  const [testType, setTestType] = useState('learning_path');
  const [data, setData] = useState<{
    test_name: string;
    group_a: { name: string; count: number; avg_attempts: number; completion_rate: number; avg_time_hours: number };
    group_b: { name: string; count: number; avg_attempts: number; completion_rate: number; avg_time_hours: number };
    metrics: Array<{ metric: string; group_a: number; group_b: number; difference: number; significant: boolean }>;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/analytics/ab-test?testType=${testType}`)
      .then(r => r.ok ? r.json() : Promise.reject(new Error('Failed to fetch AB test data')))
      .then(setData)
      .catch(() => setError(t('analytics.error')))
      .finally(() => setLoading(false));
  }, [testType]);

  if (loading) return <p className="text-center py-4">{t('analytics.loading')}</p>;
  if (error) return <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>;
  if (!data) return <p className="text-center py-4 text-muted-foreground">{t('analytics.error')}</p>;

  const chartData = data.metrics.map(m => ({
    metric: m.metric,
    [data.group_a.name]: m.group_a,
    [data.group_b.name]: m.group_b,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="h-6 w-6" />
          {t('analytics.abTest.title')}
        </h2>
        <select
          value={testType}
          onChange={e => setTestType(e.target.value)}
          className="border rounded-md px-3 py-2 text-sm"
        >
          <option value="learning_path">{t('analytics.abTest.test.learningPath')}</option>
          <option value="hint_usage">{t('analytics.abTest.test.hintUsage')}</option>
        </select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{data.test_name}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Group A */}
            <div className="border rounded-lg p-4 bg-blue-50/50">
              <h3 className="font-semibold text-lg text-blue-700 mb-3">{data.group_a.name}</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('analytics.abTest.students')}</span>
                  <span className="font-bold">{data.group_a.count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('analytics.abTest.avgAttempts')}</span>
                  <span>{data.group_a.avg_attempts}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('analytics.abTest.completionRate')}</span>
                  <span>{data.group_a.completion_rate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('analytics.abTest.avgTime')}</span>
                  <span>{data.group_a.avg_time_hours}h</span>
                </div>
              </div>
            </div>

            {/* Group B */}
            <div className="border rounded-lg p-4 bg-amber-50/50">
              <h3 className="font-semibold text-lg text-amber-700 mb-3">{data.group_b.name}</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('analytics.abTest.students')}</span>
                  <span className="font-bold">{data.group_b.count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('analytics.abTest.avgAttempts')}</span>
                  <span>{data.group_b.avg_attempts}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('analytics.abTest.completionRate')}</span>
                  <span>{data.group_b.completion_rate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('analytics.abTest.avgTime')}</span>
                  <span>{data.group_b.avg_time_hours}h</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comparison Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {t('analytics.abTest.comparison')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="metric" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey={data.group_a.name} fill="#3b82f6" />
                <Bar dataKey={data.group_b.name} fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Significance Indicators */}
      <Card>
        <CardHeader>
          <CardTitle>{t('analytics.abTest.significance')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.metrics.map((m, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                <div className="flex items-center gap-2">
                  {m.significant ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-gray-400" />
                  )}
                  <span>{m.metric}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {m.difference > 0 ? '+' : ''}{m.difference}
                  </span>
                  <Badge variant={m.significant ? 'default' : 'secondary'}>
                    {m.significant ? t('analytics.abTest.significant') : t('analytics.abTest.notSignificant')}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
