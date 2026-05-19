'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { FileSpreadsheet, Download, Loader2 } from 'lucide-react';
import { exportToCSV, exportToExcel } from '@/lib/export-utils';
import { generateClassReportPDF } from '@/lib/pdf-report';
import { t, getLocale } from '@/lib/i18n';

interface TeacherExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function TeacherExportDialog({ open, onOpenChange }: TeacherExportDialogProps) {
  const [format, setFormat] = useState<'csv' | 'excel' | 'pdf'>('csv');
  const [loading, setLoading] = useState(false);
  const [includeProgress, setIncludeProgress] = useState(true);
  const [includeEngagement, setIncludeEngagement] = useState(true);
  const [includeAnalytics, setIncludeAnalytics] = useState(true);

  const handleExport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        includeProgress: String(includeProgress),
        includeEngagement: String(includeEngagement),
        includeAnalytics: String(includeAnalytics),
      });

      if (format === 'pdf') {
        // Fetch class report data and generate PDF
        const res = await fetch(`/api/teacher/analytics?${params}`);
        if (!res.ok) throw new Error('Export failed');
        const { analytics } = await res.json();

        const progressRes = await fetch('/api/teacher/students/progress');
        const { students } = await progressRes.json();

        generateClassReportPDF(
          {
            total_students: students.length,
            active_students: students.filter((s: any) => s.last_active && s.last_active > Date.now() - 7 * 24 * 60 * 60 * 1000).length,
            avg_completion_rate: students.length > 0
              ? Math.round(students.reduce((s: number, st: any) => s + st.completion_rate, 0) / students.length)
              : 0,
            avg_attempts: students.length > 0
              ? Math.round(students.reduce((s: number, st: any) => s + st.avg_attempts, 0) / students.length * 10) / 10
              : 0,
            at_risk_count: students.filter((s: any) => s.tasks_completed < 5).length,
            excelling_count: students.filter((s: any) => s.tasks_completed > 45).length,
            top_performers: students
              .filter((s: any) => s.tasks_completed > 30)
              .sort((a: any, b: any) => b.tasks_completed - a.tasks_completed)
              .slice(0, 5)
              .map((s: any) => ({ name: s.name, tasks_completed: s.tasks_completed, avg_attempts: s.avg_attempts })),
            struggling_students: students
              .filter((s: any) => s.avg_attempts > 4 && s.tasks_completed >= 3)
              .sort((a: any, b: any) => b.avg_attempts - a.avg_attempts)
              .slice(0, 5)
              .map((s: any) => ({ name: s.name, tasks_completed: s.tasks_completed, avg_attempts: s.avg_attempts })),
            inactive_students: students
              .filter((s: any) => !s.last_active || s.last_active < Date.now() - 7 * 24 * 60 * 60 * 1000)
              .slice(0, 10)
              .map((s: any) => ({ name: s.name, last_active: s.last_active || 0 })),
          },
          {
            title: t('teacher.export.classReport'),
            generatedAt: new Date(),
            locale: getLocale(),
          }
        );
      } else {
        // CSV or Excel: fetch all data and export
        const res = await fetch(`/api/teacher/export?${params}`);
        if (!res.ok) throw new Error('Export failed');
        const { data } = await res.json();

        const filename = `teacher-report-${new Date().toISOString().slice(0, 10)}`;

        for (const [key, sectionData] of Object.entries(data)) {
          if (!Array.isArray(sectionData) || !sectionData.length) continue;
          const cols = Object.keys(sectionData[0] as Record<string, unknown>).map(k => ({ key: k, label: k }));
          if (format === 'csv') {
            exportToCSV(sectionData as Record<string, unknown>[], cols, `${filename}-${key}`);
          } else {
            exportToExcel(sectionData as Record<string, unknown>[], cols, `${filename}-${key}`);
          }
        }
      }
    } catch (e) {
      console.error('Export error:', e);
    } finally {
      setLoading(false);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            {t('teacher.export.title')}
          </DialogTitle>
          <DialogDescription>
            {t('teacher.export.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>{t('teacher.export.format')}</Label>
            <RadioGroup value={format} onValueChange={v => setFormat(v as typeof format)} className="flex gap-4 mt-2">
              <div className="flex items-center gap-2">
                <RadioGroupItem value="csv" id="t-csv" />
                <Label htmlFor="t-csv">CSV</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="excel" id="t-excel" />
                <Label htmlFor="t-excel">Excel</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="pdf" id="t-pdf" />
                <Label htmlFor="t-pdf">PDF</Label>
              </div>
            </RadioGroup>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Checkbox
                id="t-progress"
                checked={includeProgress}
                onCheckedChange={v => setIncludeProgress(!!v)}
              />
              <Label htmlFor="t-progress">{t('teacher.tabs.progress')}</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="t-engagement"
                checked={includeEngagement}
                onCheckedChange={v => setIncludeEngagement(!!v)}
              />
              <Label htmlFor="t-engagement">{t('teacher.tabs.engagement')}</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="t-analytics"
                checked={includeAnalytics}
                onCheckedChange={v => setIncludeAnalytics(!!v)}
              />
              <Label htmlFor="t-analytics">{t('teacher.tabs.analytics')}</Label>
            </div>
          </div>

          <Button onClick={handleExport} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('teacher.export.exporting')}
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                {t('teacher.export.button')}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
