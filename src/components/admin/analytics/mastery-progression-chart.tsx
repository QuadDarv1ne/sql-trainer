'use client';

import { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  Card, CardContent, CardHeader, CardTitle,
} from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { t } from '@/lib/i18n';
import { useDateRange } from '../analytics-dashboard';
import EmptyState from './empty-state';

interface MasteryProgressionChartProps {
  apiEndpoint?: string;
}

interface MasteryWeek {
  week_start: string;
  timestamp: number;
  skills: Record<string, number>;
  overall: number;
  student_count: number;
}

const SKILL_LABELS: Record<string, string> = {
  select: 'analytics.skills.category.select',
  joins: 'analytics.skills.category.joins',
  aggregation: 'analytics.skills.category.aggregation',
  subqueries: 'analytics.skills.category.subqueries',
  dml: 'analytics.skills.category.dml',
  advanced: 'analytics.skills.category.advanced',
};

const SKILL_COLORS: Record<string, string> = {
  select: 'hsl(var(--primary))',
  joins: '#f59e0b',
  aggregation: '#10b981',
  subqueries: '#8b5cf6',
  dml: '#ef4444',
  advanced: '#06b6d4',
};

export default function MasteryProgressionChart({ apiEndpoint }: MasteryProgressionChartProps) {
  const [data, setData] = useState<MasteryWeek[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([
    'overall', 'select', 'joins', 'aggregation',
  ]);
  const { startDate, endDate } = useDateRange();

  useEffect(() => {
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', String(startDate));
    if (endDate) params.set('endDate', String(endDate));

    fetch(`${apiEndpoint || '/api/admin/analytics/mastery'}?${params}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(d => setData(d.progression))
      .catch(() => setError(t('analytics.error')))
      .finally(() => setLoading(false));
  }, [apiEndpoint, startDate, endDate]);

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev =>
      prev.includes(skill)
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    );
  };

  if (loading) return <p className="text-center py-4 text-muted-foreground">{t('analytics.loading')}</p>;
  if (error) return <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>;
  if (!data || data.length === 0) return <EmptyState />;

  const chartData = data.map(w => ({
    week: new Date(w.week_start).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
    overall: Math.round(w.overall * 10) / 10,
    select: Math.round(w.skills.select * 10) / 10,
    joins: Math.round(w.skills.joins * 10) / 10,
    aggregation: Math.round(w.skills.aggregation * 10) / 10,
    subqueries: Math.round(w.skills.subqueries * 10) / 10,
    dml: Math.round(w.skills.dml * 10) / 10,
    advanced: Math.round(w.skills.advanced * 10) / 10,
    students: w.student_count,
  }));

  const allSkillKeys = Object.keys(SKILL_LABELS);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('analytics.mastery.title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <div
            className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer border transition-colors ${
              selectedSkills.includes('overall')
                ? 'bg-primary/10 border-primary text-primary'
                : 'bg-muted border-border text-muted-foreground'
            }`}
            onClick={() => toggleSkill('overall')}
          >
            {t('analytics.mastery.avgMastery')}
          </div>
          {allSkillKeys.map(skill => (
            <div
              key={skill}
              className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer border transition-colors ${
                selectedSkills.includes(skill)
                  ? 'bg-primary/10 border-primary text-primary'
                  : 'bg-muted border-border text-muted-foreground'
              }`}
              onClick={() => toggleSkill(skill)}
            >
              {t(SKILL_LABELS[skill])}
            </div>
          ))}
        </div>

        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              {selectedSkills.includes('overall') && (
                <Line
                  type="monotone"
                  dataKey="overall"
                  name={t('analytics.mastery.avgMastery')}
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              )}
              {allSkillKeys.filter(s => selectedSkills.includes(s)).map(skill => (
                <Line
                  key={skill}
                  type="monotone"
                  dataKey={skill}
                  name={t(SKILL_LABELS[skill])}
                  stroke={SKILL_COLORS[skill]}
                  strokeWidth={1.5}
                  strokeDasharray="4 3"
                  dot={{ r: 2 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="text-xs text-muted-foreground text-center">
          {t('analytics.mastery.weekly')} &middot; {data.length} {data.length === 1 ? 'week' : 'weeks'}
        </div>
      </CardContent>
    </Card>
  );
}
