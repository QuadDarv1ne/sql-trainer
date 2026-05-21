'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Mail, Send, CheckCircle, XCircle } from 'lucide-react';
import { t } from '@/lib/i18n';
import { useDateRange } from '../analytics-dashboard';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line,
} from 'recharts';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import EmptyState from './empty-state';

interface ChannelStats {
  channel: string;
  sent: number;
  delivered: number;
  failed: number;
  pending: number;
  success_rate: number;
}

interface FailureEntry {
  channel: string;
  user_id: string;
  user_name: string;
  error: string;
  sent_at: number;
}

interface DeliveryTrendEntry {
  date: string;
  sent: number;
  failed: number;
}

export default function NotificationAnalytics() {
  const [channels, setChannels] = useState<ChannelStats[]>([]);
  const [emailQueue, setEmailQueue] = useState<{ total: number; sent: number; pending: number; failed: number; retrying: number } | null>(null);
  const [recentFailures, setRecentFailures] = useState<FailureEntry[]>([]);
  const [deliveryTrend, setDeliveryTrend] = useState<DeliveryTrendEntry[]>([]);
  const [overallStats, setOverallStats] = useState<{ total_sent: number; total_failed: number; overall_success_rate: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { startDate, endDate } = useDateRange();

  useEffect(() => {
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', String(startDate));
    if (endDate) params.set('endDate', String(endDate));

    fetch(`/api/admin/analytics/notifications?${params}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        setChannels(data.by_channel || []);
        setEmailQueue(data.email_queue);
        setRecentFailures(data.recent_failures || []);
        setDeliveryTrend(data.delivery_trend || []);
        setOverallStats(data.overall_stats);
      })
      .catch(() => setError(t('analytics.error')))
      .finally(() => setLoading(false));
  }, [startDate, endDate]);

  if (loading) return <p className="text-center py-4">{t('analytics.loading')}</p>;
  if (error) return <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>;
  if (!overallStats) return <EmptyState />;

  const stats = [
    { label: t('analytics.notifications.totalSent'), value: overallStats.total_sent, icon: Send, color: 'text-blue-600' },
    { label: t('analytics.notifications.overallSuccess'), value: `${overallStats.overall_success_rate}%`, icon: CheckCircle, color: 'text-emerald-600' },
    { label: t('analytics.notifications.failed'), value: overallStats.total_failed, icon: XCircle, color: 'text-red-600' },
    { label: t('analytics.notifications.pending'), value: emailQueue?.pending || 0, icon: Mail, color: 'text-amber-600' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">{t('analytics.notifications.title')}</h2>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(stat => (
          <Card key={stat.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <stat.icon className={`h-8 w-8 ${stat.color}`} />
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>{t('analytics.notifications.channel')}</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={channels}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="channel" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="delivered" fill="#10b981" name={t('analytics.notifications.delivered')} />
                <Bar dataKey="failed" fill="#ef4444" name={t('analytics.notifications.failed')} />
                <Bar dataKey="pending" fill="#f59e0b" name={t('analytics.notifications.pending')} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{t('analytics.notifications.emailQueue')}</CardTitle></CardHeader>
          <CardContent>
            {emailQueue && (
              <div className="space-y-3">
                {[
                  { label: t('analytics.notifications.totalSent'), value: emailQueue.total, color: 'text-blue-600' },
                  { label: t('analytics.notifications.delivered'), value: emailQueue.sent, color: 'text-emerald-600' },
                  { label: t('analytics.notifications.pending'), value: emailQueue.pending, color: 'text-amber-600' },
                  { label: t('analytics.notifications.failed'), value: emailQueue.failed, color: 'text-red-600' },
                  { label: t('analytics.notifications.retrying'), value: emailQueue.retrying, color: 'text-purple-600' },
                ].map(item => (
                  <div key={item.label} className="flex justify-between">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className={`font-bold ${item.color}`}>{item.value}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>{t('analytics.notifications.recentFailures')}</CardTitle></CardHeader>
        <CardContent>
          {recentFailures.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('analytics.notifications.channel')}</TableHead>
                  <TableHead>{t('analytics.deadlineCompliance.student')}</TableHead>
                  <TableHead>{t('analytics.audit.date')}</TableHead>
                  <TableHead>{t('analytics.audit.details')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentFailures.slice(0, 10).map((f, i) => (
                  <TableRow key={i}>
                    <TableCell><Badge>{f.channel}</Badge></TableCell>
                    <TableCell>{f.user_name}</TableCell>
                    <TableCell>{new Date(f.sent_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-red-600 max-w-xs truncate">{f.error}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-4">Нет ошибок</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Тренд доставки (30 дней)</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={deliveryTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="sent" stroke="#10b981" strokeWidth={2} />
              <Line type="monotone" dataKey="failed" stroke="#ef4444" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
