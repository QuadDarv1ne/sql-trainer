'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Users, Clock, RefreshCw } from 'lucide-react';
import { t } from '@/lib/i18n';
import { usePolling } from '@/lib/use-polling';

export default function LiveActivity() {
  const [data, setData] = useState<{
    active_now: number;
    active_last_5min: Array<{ id: string; name: string; email: string; last_active: number }>;
    active_last_hour: number;
    active_last_24h: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    fetch('/api/admin/analytics/live')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const { refresh, isPaused } = usePolling(fetchData, { intervalMs: 30000 });

  if (loading) return <p className="text-center py-4">{t('analytics.loading')}</p>;
  if (!data) return <p className="text-center py-4 text-muted-foreground">{t('analytics.error')}</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold">{t('analytics.live.title')}</h2>
          <Badge variant={data.active_now > 0 ? 'default' : 'secondary'} className="flex items-center gap-1">
            <span className={`h-2 w-2 rounded-full ${data.active_now > 0 ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
            {isPaused ? t('analytics.live.paused') : t('analytics.live')}
          </Badge>
        </div>
        <button onClick={refresh} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <RefreshCw className="h-4 w-4" /> {t('analytics.live.refresh')}
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4 text-green-500" />
              {t('analytics.live.activeNow')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{data.active_now}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              {t('analytics.live.last5min')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.active_now}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              {t('analytics.live.lastHour')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.active_last_hour}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-500" />
              {t('analytics.live.last24h')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.active_last_24h}</div>
          </CardContent>
        </Card>
      </div>

      {data.active_last_5min.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('analytics.live.activeStudents')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.active_last_5min.map(student => (
                <div key={student.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <span className="font-medium">{student.name}</span>
                    <span className="text-sm text-muted-foreground ml-2">{student.email}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {new Date(student.last_active).toLocaleTimeString()}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
