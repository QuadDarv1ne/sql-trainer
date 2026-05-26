'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, AlertTriangle, TrendingUp, Clock, Award, CheckCircle2 } from 'lucide-react';
import { t } from '@/lib/i18n';

interface TeacherAlert {
  type: 'at_risk' | 'inactive' | 'struggling' | 'excelling';
  studentId: string;
  studentName: string;
  message: string;
  severity: 'high' | 'medium' | 'low';
}

export default function TeacherAlerts() {
  const [alerts, setAlerts] = useState<TeacherAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    fetch('/api/teacher/alerts', { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load');
        return r.json();
      })
      .then((data) => { if (!controller.signal.aborted) setAlerts(data.alerts); })
      .catch((err) => { if (err.name !== 'AbortError' && !controller.signal.aborted) setError(t('teacher.error')); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);

  if (loading) return <p className="text-center py-4">{t('teacher.loading')}</p>;
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }
  if (!alerts.length) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-emerald-500" />
          <p>{t('teacher.alerts.noAlerts')}</p>
        </CardContent>
      </Card>
    );
  }

  const typeIcons: Record<string, React.ReactNode> = {
    at_risk: <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />,
    inactive: <Clock className="h-4 w-4 text-gray-500 dark:text-gray-400" />,
    struggling: <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />,
    excelling: <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />,
  };

  const severityColors: Record<string, string> = {
    high: 'border-red-300 bg-red-50 dark:bg-red-950/50 dark:border-red-800',
    medium: 'border-amber-300 bg-amber-50 dark:bg-amber-950/50 dark:border-amber-800',
    low: 'border-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 dark:border-emerald-800',
  };

  const typeLabels: Record<string, string> = {
    at_risk: t('teacher.alerts.atRisk'),
    inactive: t('teacher.alerts.inactive'),
    struggling: t('teacher.alerts.struggling'),
    excelling: t('teacher.alerts.excelling'),
  };

  const severityLabels: Record<string, string> = {
    high: t('teacher.alerts.high'),
    medium: t('teacher.alerts.medium'),
    low: t('teacher.alerts.low'),
  };

  // Group by type
  const grouped = alerts.reduce<Record<string, TeacherAlert[]>>((acc, alert) => {
    if (!acc[alert.type]) acc[alert.type] = [];
    acc[alert.type].push(alert);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-4">
        {Object.entries(grouped).map(([type, typeAlerts]) => (
          <Card key={type}>
            <CardContent className="p-4 flex items-center gap-3">
              {typeIcons[type]}
              <div>
                <p className="text-2xl font-bold">{typeAlerts.length}</p>
                <p className="text-xs text-muted-foreground">{typeLabels[type]}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alerts list */}
      <Card>
        <CardHeader>
          <CardTitle>{t('teacher.alerts.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.studentId}
                className={`flex items-start gap-3 p-4 rounded-lg border ${severityColors[alert.severity]}`}
              >
                {typeIcons[alert.type]}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{alert.studentName}</span>
                    <Badge variant="outline" className="text-xs">
                      {typeLabels[alert.type]}
                    </Badge>
                    <Badge
                      variant={alert.severity === 'high' ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {severityLabels[alert.severity]}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{alert.message}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
