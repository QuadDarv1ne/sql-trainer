'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, Users, TrendingUp, Award, Clock, FileText, Download } from 'lucide-react';
import { generateClassReportPDF } from '@/lib/pdf-report';
import { t, getLocale } from '@/lib/i18n';
import { useDateRange } from '../analytics-dashboard';
import EmptyState from './empty-state';

interface ClassReport {
  total_students: number;
  active_students: number;
  avg_completion_rate: number;
  avg_attempts: number;
  at_risk_count: number;
  excelling_count: number;
  top_performers: Array<{ name: string; tasks_completed: number; avg_attempts: number }>;
  struggling_students: Array<{ name: string; tasks_completed: number; avg_attempts: number }>;
  inactive_students: Array<{ name: string; last_active: number }>;
}

export default function ClassReport() {
  const [report, setReport] = useState<ClassReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { startDate, endDate } = useDateRange();

  useEffect(() => {
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', String(startDate));
    if (endDate) params.set('endDate', String(endDate));

    fetch(`/api/admin/analytics/class-report?${params}`)
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((data) => setReport(data.report))
      .catch(() => setError(t('analytics.error')))
      .finally(() => setLoading(false));
  }, [startDate, endDate]);

  const handleGeneratePDF = () => {
    if (report) {
      generateClassReportPDF(report, {
        title: t('analytics.classReport.title'),
        subtitle: `${t('analytics.classReport.generated', { days: new Date().toLocaleDateString() })}`,
        generatedAt: new Date(),
        locale: getLocale(),
      });
    }
  };

  if (loading) return <p className="text-center py-4">{t('analytics.loading')}</p>;
  if (error) return <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>;
  if (!report) return <EmptyState />;

  const stats = [
    { label: t('analytics.classReport.totalStudents'), value: report.total_students, icon: Users, color: 'text-blue-600' },
    { label: t('analytics.classReport.activeStudents'), value: report.active_students, icon: TrendingUp, color: 'text-emerald-600' },
    { label: t('analytics.classReport.avgCompletion'), value: `${report.avg_completion_rate}%`, icon: Award, color: 'text-purple-600' },
    { label: t('analytics.classReport.avgAttempts'), value: report.avg_attempts, icon: Clock, color: 'text-amber-600' },
    { label: t('analytics.classReport.atRisk'), value: report.at_risk_count, icon: AlertCircle, color: 'text-red-600' },
    { label: t('analytics.classReport.excelling'), value: report.excelling_count, icon: Award, color: 'text-emerald-600' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{t('analytics.classReport.title')}</h2>
        <Button onClick={handleGeneratePDF}>
          <Download className="h-4 w-4 mr-2" />
          {t('analytics.pdf.generate')}
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

      {/* Top Performers */}
      {report.top_performers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('analytics.classReport.topPerformers')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {report.top_performers.map((student, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                      #{index + 1}
                    </Badge>
                    <span className="font-medium">{student.name}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-muted-foreground">{student.tasks_completed} {t('analytics.tasks.completions')}</span>
                    <span className="text-muted-foreground">{t('analytics.tasks.avgAttempts')}: {student.avg_attempts}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Struggling Students */}
      {report.struggling_students.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-amber-600">{t('analytics.classReport.struggling')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {report.struggling_students.map((student, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg border border-amber-200 dark:border-amber-900">
                  <span className="font-medium">{student.name}</span>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-muted-foreground">{student.tasks_completed} {t('analytics.tasks.completions')}</span>
                    <Badge variant="outline" className="border-amber-500 text-amber-600">
                      {t('analytics.tasks.avgAttempts')}: {student.avg_attempts}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Inactive Students */}
      {report.inactive_students.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-red-600">{t('analytics.classReport.inactive')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {report.inactive_students.map((student, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg border border-red-200 dark:border-red-900">
                  <span className="font-medium">{student.name}</span>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>
                      {student.last_active
                        ? t('analytics.classReport.daysAgo', { days: String(Math.floor((Date.now() - student.last_active) / (24 * 60 * 60 * 1000))) })
                        : t('analytics.classReport.noActivity')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
