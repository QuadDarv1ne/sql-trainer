'use client';

import { useState, useEffect, useCallback } from 'react';
import { logger } from '@/lib/logger';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Users,
  Activity,
  TrendingUp,
  TrendingDown,
  Database,
  Server,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Download,
  RefreshCw,
  Calendar,
  UserCheck,
  UserPlus,
  UserX,
  Shield,
} from 'lucide-react';
import { t } from '@/lib/i18n';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface SystemMetrics {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  totalQueries: number;
  avgResponseTime: number;
  errorRate: number;
  databaseSize: number;
  uptime: number;
}

interface UserActivity {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  lastActive: number;
  queriesToday: number;
  status: 'active' | 'inactive' | 'banned';
}

interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  timestamp: number;
  ipAddress: string;
  details?: string;
}

export default function AdminAnalytics() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [userActivity, setUserActivity] = useState<UserActivity[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');
  const [refreshing, setRefreshing] = useState(false);

  const fetchMetrics = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/system');
      const data = await res.json();
      if (data.success) {
        setMetrics(data.metrics);
      }
    } catch (error) {
      logger.error('Failed to fetch metrics:', error);
    }
  }, []);

  const fetchUserActivity = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/users?limit=20`);
      const data = await res.json();
      if (data.success) {
        setUserActivity(data.users || []);
      }
    } catch (error) {
      logger.error('Failed to fetch user activity:', error);
    }
  }, []);

  const fetchAuditLogs = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/audit-logs?limit=20');
      const data = await res.json();
      if (data.success) {
        setAuditLogs(data.logs || []);
      }
    } catch (error) {
      logger.error('Failed to fetch audit logs:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchMetrics(), fetchUserActivity(), fetchAuditLogs()]);
    };
    loadData();
  }, [fetchMetrics, fetchUserActivity, fetchAuditLogs]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchMetrics(), fetchUserActivity(), fetchAuditLogs()]);
  };

  const handleExport = async () => {
    try {
      const res = await fetch('/api/admin/export-analytics');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${timeRange}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      logger.error('Failed to export:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-red-600" />
          <h2 className="text-2xl font-bold">{t('admin.analytics.title', { default: 'Admin Dashboard' })}</h2>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={(v: string) => setTimeRange(v as typeof timeRange)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">{t('admin.timeRange.24h', { default: '24 hours' })}</SelectItem>
              <SelectItem value="7d">{t('admin.timeRange.7d', { default: '7 days' })}</SelectItem>
              <SelectItem value="30d">{t('admin.timeRange.30d', { default: '30 days' })}</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {t('common.refresh', { default: 'Refresh' })}
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            {t('admin.export', { default: 'Export' })}
          </Button>
        </div>
      </div>

      {/* System Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('admin.metrics.totalUsers', { default: 'Total Users' })}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalUsers ?? 0}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <UserCheck className="h-3 w-3 text-emerald-600" />
              <span className="text-emerald-600">{metrics?.activeUsers ?? 0}</span>
              <span>{t('admin.metrics.activeNowSuffix', { default: 'active now' })}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('admin.metrics.newUsers', { default: 'New Today' })}
            </CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.newUsersToday ?? 0}</div>
            <div className="flex items-center gap-1 text-xs">
              <TrendingUp className="h-3 w-3 text-emerald-600" />
              <span className="text-emerald-600">+12%</span>
              <span className="text-muted-foreground">
                {t('admin.metrics.vsYesterday', { default: 'vs yesterday' })}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin.metrics.queries', { default: 'Requests' })}</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalQueries ?? 0}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>
                {metrics?.avgResponseTime ?? 0} {t('admin.metrics.ms', { default: 'ms' })} avg response
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin.metrics.errors', { default: 'Errors' })}</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(metrics?.errorRate ?? 0).toFixed(2)}%</div>
            <div className="flex items-center gap-1 text-xs">
              {metrics?.errorRate && metrics.errorRate < 1 ? (
                <>
                  <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                  <span className="text-emerald-600">{t('admin.metrics.normal', { default: 'Normal' })}</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-3 w-3 text-amber-600" />
                  <span className="text-amber-600">{t('admin.metrics.attention', { default: 'Attention' })}</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('admin.metrics.database', { default: 'Database' })}
            </CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{((metrics?.databaseSize ?? 0) / 1024 / 1024).toFixed(2)} MB</div>
            <div className="text-xs text-muted-foreground">{t('admin.metrics.dbSize', { default: 'DB Size' })}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin.metrics.uptime', { default: 'Uptime' })}</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.uptime ?? 99.9}%</div>
            <div className="text-xs text-muted-foreground">
              {t('admin.metrics.last30Days', { default: 'over 30 days' })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin.metrics.activeNow', { default: 'Online' })}</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.activeUsers ?? 0}</div>
            <div className="text-xs text-muted-foreground">{t('admin.metrics.usersOnline', { default: 'users' })}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('admin.metrics.responseTime', { default: 'Response Time' })}
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.avgResponseTime ?? 0} ms</div>
            <div className="flex items-center gap-1 text-xs">
              <TrendingDown className="h-3 w-3 text-emerald-600" />
              <span className="text-emerald-600">-5%</span>
              <span className="text-muted-foreground">
                {t('admin.metrics.vsYesterday', { default: 'vs yesterday' })}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Activity Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                {t('admin.activity.title', { default: 'User Activity' })}
              </CardTitle>
              <CardDescription>{t('admin.activity.subtitle', { default: 'Recently Active Users' })}</CardDescription>
            </div>
            <Button variant="outline" size="sm">
              {t('admin.viewAll', { default: 'All Users' })}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('admin.user', { default: 'User' })}</TableHead>
                <TableHead>{t('admin.role', { default: 'Role' })}</TableHead>
                <TableHead>{t('admin.queries', { default: 'Queries Today' })}</TableHead>
                <TableHead>{t('admin.lastActive', { default: 'Last Seen' })}</TableHead>
                <TableHead>{t('admin.status', { default: 'Status' })}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {userActivity.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        user.role === 'admin' ? 'destructive' : user.role === 'teacher' ? 'secondary' : 'outline'
                      }
                    >
                      {user.role === 'admin'
                        ? t('role.admin', { default: 'Admin' })
                        : user.role === 'teacher'
                          ? t('role.teacher', { default: 'Teacher' })
                          : t('role.student', { default: 'Student' })}
                    </Badge>
                  </TableCell>
                  <TableCell>{user.queriesToday}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(user.lastActive), 'dd MMM HH:mm', { locale: ru })}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        user.status === 'active' ? 'default' : user.status === 'banned' ? 'destructive' : 'secondary'
                      }
                      className="flex items-center gap-1 w-fit"
                    >
                      {user.status === 'active' && <CheckCircle2 className="h-3 w-3" />}
                      {user.status === 'banned' && <UserX className="h-3 w-3" />}
                      {user.status === 'active'
                        ? t('status.active', { default: 'Active' })
                        : user.status === 'banned'
                          ? t('status.banned', { default: 'Banned' })
                          : t('status.inactive', { default: 'Inactive' })}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Audit Logs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                {t('admin.audit.title', { default: 'Audit Log' })}
              </CardTitle>
              <CardDescription>{t('admin.audit.subtitle', { default: 'Latest system actions' })}</CardDescription>
            </div>
            <Button variant="outline" size="sm">
              {t('admin.viewAll', { default: 'All Logs' })}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('admin.timestamp', { default: 'Time' })}</TableHead>
                <TableHead>{t('admin.user', { default: 'User' })}</TableHead>
                <TableHead>{t('admin.action', { default: 'Action' })}</TableHead>
                <TableHead>{t('admin.resource', { default: 'Resource' })}</TableHead>
                <TableHead>{t('admin.ip', { default: 'IP' })}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm">
                        {format(new Date(log.timestamp), 'dd.MM.yyyy HH:mm', { locale: ru })}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{log.userName}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{log.action}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{log.resource}</TableCell>
                  <TableCell className="font-mono text-xs">{log.ipAddress}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {auditLogs.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p>{t('admin.noLogs', { default: 'Audit log is empty' })}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
