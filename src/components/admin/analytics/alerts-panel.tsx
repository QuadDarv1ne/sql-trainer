'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, AlertTriangle, TrendingUp, Award, Eye } from 'lucide-react';
import StudentDetailDialog from './student-detail-dialog';
import { t } from '@/lib/i18n';
import EmptyState from './empty-state';
import { useAnalyticsQuery } from '@/hooks/use-analytics-query';

interface StudentAlert {
  user_id: string;
  name: string;
  email: string;
  alert_type: 'at_risk' | 'inactive' | 'struggling' | 'excelling' | 'milestone';
  severity: 'high' | 'medium' | 'low';
  message: string;
  created_at: number;
}

const AlertIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'at_risk': return <AlertTriangle className="h-5 w-5 text-red-600" />;
    case 'inactive': return <AlertCircle className="h-5 w-5 text-amber-600" />;
    case 'struggling': return <AlertTriangle className="h-5 w-5 text-orange-600" />;
    case 'excelling': return <TrendingUp className="h-5 w-5 text-emerald-600" />;
    case 'milestone': return <Award className="h-5 w-5 text-blue-600" />;
    default: return <AlertCircle className="h-5 w-5" />;
  }
};

const severityColors = {
  high: 'border-l-red-500 bg-red-50 dark:bg-red-950/20',
  medium: 'border-l-amber-500 bg-amber-50 dark:bg-amber-950/20',
  low: 'border-l-blue-500 bg-blue-50 dark:bg-blue-950/20',
};

export default function AlertsPanel() {
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: alerts, loading, error } = useAnalyticsQuery<StudentAlert[]>({
    endpoint: '/api/admin/analytics/alerts',
    dataKey: 'alerts',
  });

  if (loading) return <p className="text-center py-4">{t('analytics.loading')}</p>;
  if (error) return <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>;
  if (!alerts.length) return <EmptyState icon="alert" title={t('analytics.alerts.noAlerts')} />;

  const alertTypeLabels: Record<string, string> = {
    at_risk: t('analytics.alerts.atRisk'),
    inactive: t('analytics.alerts.inactive'),
    struggling: t('analytics.alerts.struggling'),
    excelling: t('analytics.alerts.excelling'),
    milestone: t('analytics.alerts.milestone'),
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            {t('analytics.alerts.title')} ({alerts.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={`${alert.user_id}-${alert.alert_type}`}
              className={`p-4 border-l-4 rounded ${severityColors[alert.severity]}`}
            >
              <div className="flex items-start gap-3">
                <AlertIcon type={alert.alert_type} />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium">{alert.name}</h4>
                    <Badge
                      variant="outline"
                      className={
                        alert.severity === 'high'
                          ? 'border-red-500 text-red-600'
                          : alert.severity === 'medium'
                          ? 'border-amber-500 text-amber-600'
                          : 'border-blue-500 text-blue-600'
                      }
                    >
                      {t(`analytics.alerts.severity.${alert.severity}`)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{alert.message}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{alertTypeLabels[alert.alert_type]}</Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => {
                        setSelectedStudent(alert.user_id);
                        setDialogOpen(true);
                      }}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      {t('analytics.alerts.viewStudent')}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <StudentDetailDialog
        studentId={selectedStudent}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
}
