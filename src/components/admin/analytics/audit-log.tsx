'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, FileText, Users, Clock } from 'lucide-react';
import { t } from '@/lib/i18n';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import EmptyState from './empty-state';
import { useAnalyticsQuery } from '@/hooks/use-analytics-query';

interface AuditData {
  entries: Array<{
    action_type: string;
    actor_name: string | null;
    target_type: string;
    target_id: string;
    details: string;
    created_at: number;
  }>;
  summary: {
    total_actions: number;
    actions_by_type: Array<{ type: string; count: number }>;
    most_active_users: Array<{ name: string; action_count: number }>;
    actions_this_week: number;
    actions_this_month: number;
  };
}

export default function AuditLog() {
  const { data, loading, error } = useAnalyticsQuery<AuditData>({
    endpoint: '/api/admin/analytics/audit',
    transform: (json) => ({
      entries: (json.entries || []) as AuditData['entries'],
      summary: json.summary as AuditData['summary'],
    }),
  });

  const entries = data?.entries || [];
  const summary = data?.summary || null;

  if (loading) return <p className="text-center py-4">{t('analytics.loading')}</p>;
  if (error)
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  if (!summary) return <EmptyState />;

  const actionLabels: Record<string, string> = {
    deadline_created: t('analytics.audit.actions.deadlineCreated'),
    deadline_updated: t('analytics.audit.actions.deadlineUpdated'),
    role_changed: t('analytics.audit.actions.roleChanged'),
    notification_pref_changed: t('analytics.audit.actions.notificationPref'),
  };

  const stats = [
    { label: t('analytics.audit.totalActions'), value: summary.total_actions, icon: FileText, color: 'text-blue-600' },
    { label: t('analytics.audit.thisWeek'), value: summary.actions_this_week, icon: Clock, color: 'text-emerald-600' },
    { label: t('analytics.audit.thisMonth'), value: summary.actions_this_month, icon: Users, color: 'text-purple-600' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">{t('analytics.audit.title')}</h2>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
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
        {summary.actions_by_type.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t('analytics.audit.actionsByType')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {summary.actions_by_type.map((item) => (
                  <div key={item.type} className="flex justify-between items-center">
                    <Badge>{actionLabels[item.type] || item.type}</Badge>
                    <span className="font-bold">{item.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {summary.most_active_users.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t('analytics.audit.mostActiveUsers')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {summary.most_active_users.map((item) => (
                  <div key={item.name} className="flex justify-between items-center">
                    <span className="font-medium">{item.name}</span>
                    <Badge className="bg-blue-100 text-blue-800">{item.action_count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {entries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('analytics.audit.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('analytics.audit.date')}</TableHead>
                  <TableHead>{t('analytics.audit.action')}</TableHead>
                  <TableHead>{t('analytics.audit.actor')}</TableHead>
                  <TableHead>{t('analytics.audit.target')}</TableHead>
                  <TableHead>{t('analytics.audit.details')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.slice(0, 30).map((entry) => (
                  <TableRow key={`${entry.target_id}-${entry.created_at}`}>
                    <TableCell className="text-sm">{new Date(entry.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge>{actionLabels[entry.action_type] || entry.action_type}</Badge>
                    </TableCell>
                    <TableCell>{entry.actor_name || '—'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{entry.target_type}</Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-sm">{entry.details}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
