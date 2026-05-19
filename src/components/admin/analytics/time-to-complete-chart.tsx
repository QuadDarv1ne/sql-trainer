'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface TimeEstimate {
  task_id: string;
  task_name: string;
  difficulty: string;
  avg_position: number;
  estimated_time_minutes: number;
  completion_order: number;
}

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: '#10b981',
  intermediate: '#f59e0b',
  advanced: '#ef4444',
};

export default function TimeToCompleteChart() {
  const [data, setData] = useState<TimeEstimate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/analytics/time-estimates')
      .then((res) => res.json())
      .then((data) => {
        setData(data.estimates || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Оценка времени выполнения</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Оценка времени выполнения</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Оценка времени выполнения</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">Нет данных для отображения</p>
        </CardContent>
      </Card>
    );
  }

  const totalTasks = data.length;
  const avgTime = Math.round(data.reduce((s, d) => s + d.estimated_time_minutes, 0) / totalTasks);
  const maxTime = Math.max(...data.map((d) => d.estimated_time_minutes));
  const minTime = Math.min(...data.map((d) => d.estimated_time_minutes));

  const chartData = data
    .sort((a, b) => b.estimated_time_minutes - a.estimated_time_minutes)
    .slice(0, 20)
    .map((d) => ({
      name: d.task_name.length > 15 ? d.task_name.slice(0, 15) + '...' : d.task_name,
      time: d.estimated_time_minutes,
      difficulty: d.difficulty,
    }));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Оценка времени выполнения</CardTitle>
          <div className="flex gap-2">
            <Badge variant="secondary">
              {totalTasks} задач
            </Badge>
            <Badge variant="secondary">
              {avgTime} мин среднее
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-2xl font-bold">{minTime}</p>
            <p className="text-xs text-muted-foreground">Мин. время (мин)</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-2xl font-bold">{avgTime}</p>
            <p className="text-xs text-muted-foreground">Среднее (мин)</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-2xl font-bold">{maxTime}</p>
            <p className="text-xs text-muted-foreground">Макс. время (мин)</p>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 12 }} label={{ value: 'Минуты', position: 'insideBottom', offset: -5 }} />
            <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            <Bar
              dataKey="time"
              name="Время (мин)"
              radius={[0, 4, 4, 0]}
            >
              {chartData.map((entry, index) => (
                <Cell key={index} fill={DIFFICULTY_COLORS[entry.difficulty] || '#10b981'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        <div className="flex gap-4 mt-4 justify-center">
          {Object.entries(DIFFICULTY_COLORS).map(([diff, color]) => (
            <div key={diff} className="flex items-center gap-1.5 text-xs">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
              <span className="capitalize">{diff}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
