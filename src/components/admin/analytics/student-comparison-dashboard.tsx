'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Users, Loader2 } from 'lucide-react';
import { t } from '@/lib/i18n';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

interface ComparisonStudent {
  user_id: string;
  name: string;
  email: string;
  tasks_completed: number;
  completion_rate: number;
  avg_attempts: number;
  streak: number;
  achievements: number;
  beginner_completed: number;
  intermediate_completed: number;
  advanced_completed: number;
  category_completion: Array<{ category: string; rate: number }>;
  sessions_per_week: number;
  consistency_score: number;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export default function StudentComparisonDashboard() {
  const [students, setStudents] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [comparisonData, setComparisonData] = useState<ComparisonStudent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load student list
  useEffect(() => {
    fetch('/api/admin/analytics/students')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Failed to fetch student comparison'))))
      .then((data) =>
        setStudents(
          (data.students || []).map((s: { user_id: string; name: string }) => ({ id: s.user_id, name: s.name })),
        ),
      )
      .catch(() => setError(t('analytics.error')));
  }, []);

  const handleCompare = async () => {
    if (selectedIds.length < 2) return;
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/admin/analytics/student-comparison?ids=${selectedIds.join(',')}`);
      if (!response.ok) throw new Error('Failed to load');
      const data = await response.json();
      setComparisonData(data.comparisonData || []);
    } catch {
      setError(t('analytics.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : prev.length < 4 ? [...prev, id] : prev,
    );
  };

  // Radar data
  const radarData = useMemo(
    () =>
      comparisonData.length > 0
        ? ['completion_rate', 'consistency_score', 'sessions_per_week'].map((metric) => {
            const entry: Record<string, string | number> = { metric: t(`analytics.studentComparison.${metric}`) };
            for (const student of comparisonData) {
              entry[student.name] = (student as unknown as Record<string, unknown>)[metric] as number;
            }
            return entry;
          })
        : [],
    [comparisonData],
  );

  // Category bar chart data
  const categoryData = useMemo(
    () =>
      comparisonData.length > 0
        ? comparisonData[0].category_completion.map((cat) => {
            const entry: Record<string, string | number> = { category: cat.category };
            for (const student of comparisonData) {
              const found = student.category_completion.find((c) => c.category === cat.category);
              entry[student.name] = found?.rate || 0;
            }
            return entry;
          })
        : [],
    [comparisonData],
  );

  return (
    <div className="space-y-6">
      {/* Student Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {t('analytics.studentComparison.title')}
          </CardTitle>
          <CardDescription>{t('analytics.studentComparison.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            {students.map((student) => (
              <Badge
                key={student.id}
                variant={selectedIds.includes(student.id) ? 'default' : 'outline'}
                className="cursor-pointer select-none"
                onClick={() => handleSelect(student.id)}
              >
                {student.name}
              </Badge>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {selectedIds.length}/4 {t('analytics.studentComparison.selected')}
            </span>
            <Button onClick={handleCompare} disabled={selectedIds.length < 2 || loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {t('analytics.studentComparison.compare')}
            </Button>
          </div>
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {comparisonData.length > 0 && (
        <>
          {/* Metric Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {comparisonData.map((student, idx) => (
              <Card key={student.user_id}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                    <span className="font-medium">{student.name}</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('analytics.studentComparison.completionRate')}</span>
                      <span className="font-medium">{student.completion_rate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('analytics.studentComparison.avgAttempts')}</span>
                      <span className="font-medium">{student.avg_attempts}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('analytics.studentComparison.streak')}</span>
                      <span className="font-medium">{student.streak}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('analytics.studentComparison.achievements')}</span>
                      <span className="font-medium">{student.achievements}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Radar Chart */}
          {radarData.length > 0 && comparisonData.length >= 2 && (
            <Card>
              <CardHeader>
                <CardTitle>{t('analytics.studentComparison.radarTitle')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12 }} />
                    <PolarRadiusAxis />
                    {comparisonData.map((student, idx) => (
                      <Radar
                        key={student.user_id}
                        name={student.name}
                        dataKey={student.name}
                        stroke={COLORS[idx % COLORS.length]}
                        fill={COLORS[idx % COLORS.length]}
                        fillOpacity={0.2}
                      />
                    ))}
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Category Comparison */}
          {categoryData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t('analytics.studentComparison.categoryTitle')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={categoryData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    {comparisonData.map((student, idx) => (
                      <Bar key={student.user_id} dataKey={student.name} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
