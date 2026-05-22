'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
  Card, CardContent, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Database, Users, Activity, Clock, HardDrive, CheckCircle2, AlertTriangle, XCircle, RefreshCw,
} from 'lucide-react';
import { t } from '@/lib/i18n';

interface SystemHealthData {
  db_size_bytes: number;
  db_wal_size_bytes: number;
  total_users: number;
  total_progress_entries: number;
  total_achievements: number;
  active_today: number;
  active_this_week: number;
  completions_today: number;
  completions_this_week: number;
  db_connection_status: 'healthy' | 'degraded' | 'error';
  last_24h_activity: { hour: string; completions: number; users: number }[];
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return t('admin.stats.bytes.zero');
  const k = 1024;
  const sizes = [t('admin.stats.bytes.B'), t('admin.stats.bytes.KB'), t('admin.stats.bytes.MB'), t('admin.stats.bytes.GB')];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 10) / 10 + ' ' + sizes[i];
}

export default function SystemHealth() {
  const [health, setHealth] = useState<SystemHealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const r = await fetch('/api/admin/system');
      if (!r.ok) throw new Error();
      const d = await r.json();
      setHealth(d.health);
      setError('');
    } catch {
      setError(t('admin.health.error'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(), 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <p className="text-center py-4 text-muted-foreground">{t('analytics.loading')}</p>;
  if (error) return <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>;
  if (!health) return null;

  const statusConfig = {
    healthy: { icon: CheckCircle2, label: t('admin.health.status.healthy'), color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30' },
    degraded: { icon: AlertTriangle, label: t('admin.health.status.degraded'), color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/30' },
    error: { icon: XCircle, label: t('admin.health.status.error'), color: 'text-red-600 bg-red-50 dark:bg-red-950/30' },
  };

  const StatusIcon = statusConfig[health.db_connection_status].icon;

  const summaryCards = [
    { icon: Users, label: t('admin.health.totalUsers'), value: health.total_users, color: 'text-blue-600' },
    { icon: Activity, label: t('admin.health.activeToday'), value: health.active_today, color: 'text-emerald-600' },
    { icon: Activity, label: t('admin.health.activeWeek'), value: health.active_this_week, color: 'text-amber-600' },
    { icon: Database, label: t('admin.health.progressEntries'), value: health.total_progress_entries, color: 'text-purple-600' },
    { icon: Database, label: t('admin.health.achievements'), value: health.total_achievements, color: 'text-pink-600' },
    { icon: HardDrive, label: t('admin.health.dbSize'), value: formatBytes(health.db_size_bytes), color: 'text-gray-600' },
    { icon: HardDrive, label: t('admin.health.dbWalSize'), value: formatBytes(health.db_wal_size_bytes), color: 'text-gray-500' },
  ];

  const chartData = health.last_24h_activity.map(h => ({
    hour: `${h.hour}:00`,
    completions: h.completions,
    users: h.users,
  }));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            {t('admin.health.title')}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`flex items-center gap-1 px-3 py-1 ${statusConfig[health.db_connection_status].color}`}>
              <StatusIcon className="h-3.5 w-3.5" />
              {statusConfig[health.db_connection_status].label}
            </Badge>
            <button
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="p-1 rounded hover:bg-accent disabled:opacity-50"
              title={t('admin.health.refresh')}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {summaryCards.map(card => (
            <div key={card.label} className="flex flex-col items-center p-3 rounded-lg border bg-card">
              <card.icon className={`h-5 w-5 ${card.color} mb-1`} />
              <div className="text-lg font-bold">{card.value}</div>
              <div className="text-[10px] text-muted-foreground text-center">{card.label}</div>
            </div>
          ))}
        </div>

        {health.last_24h_activity.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2 text-sm font-medium text-muted-foreground">
              <Clock className="h-4 w-4" />
              {t('admin.health.hourlyActivity')}
            </div>
            <div className="h-[150px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 10, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" tick={{ fontSize: 9 }} interval={2} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="completions" name={t('admin.health.completions')} fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
