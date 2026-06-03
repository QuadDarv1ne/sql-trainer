'use client';

import { useState, useEffect } from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { t } from '@/lib/i18n';

interface SkillInfo {
  completed: number;
  total: number;
  score: number;
}

interface StudentData {
  user_id: string;
  name: string;
  email: string;
  skills: Record<string, SkillInfo>;
  overall_score: number;
}

export default function StudentComparison() {
  const [data, setData] = useState<StudentData[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [studentA, setStudentA] = useState<string | null>(null);
  const [studentB, setStudentB] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/analytics/skills')
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((d) => {
        setData(d.breakdown);
        if (d.breakdown.length >= 2) {
          setStudentA(d.breakdown[0].user_id);
          setStudentB(d.breakdown[1].user_id);
        } else if (d.breakdown.length === 1) {
          setStudentA(d.breakdown[0].user_id);
        }
      })
      .catch(() => setError(t('analytics.error')))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-center py-4 text-muted-foreground">{t('analytics.loading')}</p>;
  if (error)
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  if (!data || data.length < 2)
    return <p className="text-center py-4 text-muted-foreground">{t('analytics.noData')}</p>;

  const sA = data.find((s) => s.user_id === studentA) || data[0];
  const sB = data.find((s) => s.user_id === studentB) || data[1];

  const SKILL_ORDER = ['select', 'joins', 'aggregation', 'subqueries', 'dml', 'advanced'];

  const radarData = SKILL_ORDER.map((skill) => ({
    skill: t(`analytics.skills.category.${skill}`),
    [sA.name]: sA.skills[skill]?.score || 0,
    [sB.name]: sB.skills[skill]?.score || 0,
    fullMark: 100,
  }));

  const barData = SKILL_ORDER.map((skill) => ({
    skill: t(`analytics.skills.category.${skill}`),
    [sA.name]: sA.skills[skill]?.completed || 0,
    [sB.name]: sB.skills[skill]?.completed || 0,
  }));

  const SKILL_COLORS = ['hsl(var(--primary))', '#f59e0b'];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('admin.comparison.title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium mb-1 block">{t('admin.comparison.studentA')}</label>
            <Select value={studentA || undefined} onValueChange={setStudentA}>
              <SelectTrigger>
                <SelectValue placeholder={t('admin.comparison.select')} />
              </SelectTrigger>
              <SelectContent>
                {data.map((s) => (
                  <SelectItem key={s.user_id} value={s.user_id}>
                    {s.name} ({s.overall_score}%)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">{t('admin.comparison.studentB')}</label>
            <Select value={studentB || undefined} onValueChange={setStudentB}>
              <SelectTrigger>
                <SelectValue placeholder={t('admin.comparison.select')} />
              </SelectTrigger>
              <SelectContent>
                {data.map((s) => (
                  <SelectItem key={s.user_id} value={s.user_id}>
                    {s.name} ({s.overall_score}%)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="65%" data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="skill" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
                {data
                  .filter((s) => s.user_id === sA.user_id || s.user_id === sB.user_id)
                  .map((s, i) => (
                    <Radar
                      key={s.user_id}
                      name={s.name}
                      dataKey={s.name}
                      stroke={SKILL_COLORS[i]}
                      fill={SKILL_COLORS[i]}
                      fillOpacity={0.15}
                    />
                  ))}
                <Tooltip />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical" margin={{ left: 80, right: 20, top: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="skill" width={90} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey={sA.name} fill={SKILL_COLORS[0]} radius={[0, 3, 3, 0]} />
                <Bar dataKey={sB.name} fill={SKILL_COLORS[1]} radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {[sA, sB].map((s) => (
            <div key={s.user_id} className="rounded-lg border p-4">
              <div className="font-medium mb-2">{s.name}</div>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('admin.comparison.overall')}</span>
                  <Badge variant="secondary">{s.overall_score}%</Badge>
                </div>
                {SKILL_ORDER.map((skill) => (
                  <div key={skill} className="flex justify-between">
                    <span className="text-muted-foreground">{t(`analytics.skills.category.${skill}`)}</span>
                    <span>
                      {s.skills[skill]?.completed || 0}/{s.skills[skill]?.total || 0} ({s.skills[skill]?.score || 0}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
