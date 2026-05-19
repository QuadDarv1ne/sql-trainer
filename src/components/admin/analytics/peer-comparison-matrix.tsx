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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { t } from '@/lib/i18n';
import { useDateRange } from '../analytics-dashboard';
import EmptyState from './empty-state';

interface PeerComparisonEntry {
  user_id: string;
  name: string;
  email: string;
  percentiles: {
    completion_rate: number;
    avg_attempts: number;
    velocity: number;
    consistency: number;
  };
  cohort_avg: {
    completion_rate: number;
    avg_attempts: number;
    velocity: number;
  };
  tasks_completed: number;
  avg_attempts: number;
  velocity: number;
}

export default function PeerComparisonMatrix() {
  const [data, setData] = useState<PeerComparisonEntry[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { startDate, endDate } = useDateRange();

  useEffect(() => {
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', String(startDate));
    if (endDate) params.set('endDate', String(endDate));

    fetch(`/api/admin/analytics/peer-comparison?${params}`)
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load');
        return r.json();
      })
      .then((data) => {
        setData(data.comparisons);
        if (data.comparisons.length > 0 && !selectedStudent) {
          setSelectedStudent(data.comparisons[0].user_id);
        }
      })
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

  const selected = data.find(d => d.user_id === selectedStudent);

  const radarData = selected ? [
    {
      dimension: t('analytics.peer.completion'),
      student: selected.percentiles.completion_rate,
      cohort: 50,
    },
    {
      dimension: t('analytics.peer.attempts'),
      student: selected.percentiles.avg_attempts,
      cohort: 50,
    },
    {
      dimension: t('analytics.peer.velocity'),
      student: selected.percentiles.velocity,
      cohort: 50,
    },
    {
      dimension: t('analytics.peer.consistency'),
      student: selected.percentiles.consistency,
      cohort: 50,
    },
  ] : [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{t('analytics.peer.title')}</CardTitle>
          <Select value={selectedStudent} onValueChange={setSelectedStudent}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder={t('analytics.peer.selectStudent')} />
            </SelectTrigger>
            <SelectContent>
              {data.map(d => (
                <SelectItem key={d.user_id} value={d.user_id}>{d.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {selected && (
          <>
            <ResponsiveContainer width="100%" height={350}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="dimension" />
                <PolarRadiusAxis domain={[0, 100]} />
                <Radar
                  name={selected.name}
                  dataKey="student"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.3}
                />
                <Radar
                  name={t('analytics.peer.cohortAvg')}
                  dataKey="cohort"
                  stroke="hsl(var(--muted-foreground))"
                  fill="hsl(var(--muted))"
                  fillOpacity={0.2}
                />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: t('analytics.peer.completion'), value: selected.percentiles.completion_rate },
                { label: t('analytics.peer.attempts'), value: selected.percentiles.avg_attempts },
                { label: t('analytics.peer.velocity'), value: selected.percentiles.velocity },
                { label: t('analytics.peer.consistency'), value: selected.percentiles.consistency },
              ].map((item) => (
                <div key={item.label} className="p-4 rounded-lg border space-y-2">
                  <div className="text-xs text-muted-foreground">{item.label}</div>
                  <div className="text-2xl font-bold">{item.value}%</div>
                  <Progress value={item.value} className="h-2" />
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
