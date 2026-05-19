'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useDateRange } from '../analytics-dashboard';
import { t } from '@/lib/i18n';
import EmptyState from './empty-state';

interface HourlyData {
  hour: number;
  completions: number;
  unique_students: number;
  avg_attempts: number;
  success_rate: number;
}

interface DailyData {
  day: string;
  day_name: string;
  completions: number;
  unique_students: number;
  avg_attempts: number;
}

export default function TimePatternsChart() {
  const [hourly, setHourly] = useState<HourlyData[]>([]);
  const [daily, setDaily] = useState<DailyData[]>([]);
  const [peakHour, setPeakHour] = useState(0);
  const [peakDay, setPeakDay] = useState('0');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { startDate, endDate } = useDateRange();

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (startDate) params.set('startDate', String(startDate));
        if (endDate) params.set('endDate', String(endDate));
        const res = await fetch(`/api/admin/analytics/time-patterns?${params}`);
        const json = await res.json();
        setHourly(json.hourly || []);
        setDaily(json.daily || []);
        setPeakHour(json.peak_hour || 0);
        setPeakDay(json.peak_day || '0');
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [startDate, endDate]);

  if (loading) return <div className="flex justify-center py-8">{t('analytics.loading')}</div>;
  if (error) return <div className="text-red-500 py-8">{error.message}</div>;
  
  const totalCompletions = hourly.reduce((sum, h) => sum + h.completions, 0);
  if (totalCompletions === 0) return <EmptyState />;

  const hourlyFormatted = hourly.map(h => ({
    ...h,
    hour_label: `${String(h.hour).padStart(2, '0')}:00`,
  }));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('analytics.timePatterns.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3 mb-6">
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold">{totalCompletions}</div>
                <p className="text-xs text-muted-foreground">{t('analytics.timePatterns.totalCompletions')}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold">{String(peakHour).padStart(2, '0')}:00</div>
                <p className="text-xs text-muted-foreground">{t('analytics.timePatterns.peakHour')}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold">{daily.find(d => d.day === peakDay)?.day_name || '\u2014'}</div>
                <p className="text-xs text-muted-foreground">{t('analytics.timePatterns.peakDay')}</p>
              </CardContent>
            </Card>
          </div>

          <h3 className="text-sm font-medium mb-2">{t('analytics.timePatterns.hourly')}</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyFormatted}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour_label" tick={{ fontSize: 10 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="completions" name="Completions" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('analytics.timePatterns.byDay')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={daily}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day_name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="completions" name="Completions" fill="#22c55e" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
