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
import { FileSpreadsheet, FileText, Download, Loader2 } from 'lucide-react';
import { exportToCSV, exportToExcel, exportToJSON } from '@/lib/export-utils';
import { t } from '@/lib/i18n';

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  startDate: number | null;
  endDate: number | null;
}

export default function ExportDialog({ open, onOpenChange, startDate, endDate }: ExportDialogProps) {
  const [format, setFormat] = useState<'csv' | 'excel' | 'json'>('csv');
  const [lmsFormat, setLmsFormat] = useState<'csv' | 'json' | 'xml'>('csv');
  const [activeTab, setActiveTab] = useState<'analytics' | 'lms'>('analytics');
  const [loading, setLoading] = useState(false);

  const [includeProgress, setIncludeProgress] = useState(true);
  const [includeAchievements, setIncludeAchievements] = useState(true);
  const [includeAttempts, setIncludeAttempts] = useState(true);

  const sections = [
    { key: 'activity', label: 'Activity data', checked: true },
    { key: 'tasks', label: 'Task analytics', checked: true },
    { key: 'distribution', label: 'Completion distribution', checked: true },
    { key: 'difficulty', label: 'Difficulty comparison', checked: true },
    { key: 'leaderboard', label: 'Leaderboard', checked: true },
    { key: 'students', label: 'Student performance', checked: true },
    { key: 'classReport', label: 'Class report', checked: true },
  ];

  const [selectedSections, setSelectedSections] = useState<Record<string, boolean>>(
    Object.fromEntries(sections.map(s => [s.key, s.checked]))
  );

  const toggleSection = (key: string) => {
    setSelectedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleExportAnalytics = async () => {
    setLoading(true);
    try {
      const selectedKeys = Object.entries(selectedSections)
        .filter(([, v]) => v)
        .map(([k]) => k)
        .join(',');

      const params = new URLSearchParams({ sections: selectedKeys });
      if (startDate) params.set('startDate', String(startDate));
      if (endDate) params.set('endDate', String(endDate));

      const res = await fetch(`/api/admin/analytics/export?${params}`);
      if (!res.ok) throw new Error('Export failed');
      const { data } = await res.json();

      const filename = `analytics-export-${new Date().toISOString().slice(0, 10)}`;
      const allData = Object.values(data).flat() as Record<string, unknown>[];

      if (format === 'csv') {
        const columns = allData.length
          ? Object.keys(allData[0]).map(k => ({ key: k, label: k }))
          : [];
        // Export each section separately
        for (const [key, sectionData] of Object.entries(data)) {
          if (key === 'exportedAt') continue;
          if (!Array.isArray(sectionData) || !sectionData.length) continue;
          const cols = Object.keys(sectionData[0]).map(k => ({ key: k, label: k }));
          exportToCSV(sectionData, cols, `${filename}-${key}`);
        }
      } else if (format === 'excel') {
        for (const [key, sectionData] of Object.entries(data)) {
          if (key === 'exportedAt') continue;
          if (!Array.isArray(sectionData) || !sectionData.length) continue;
          const cols = Object.keys(sectionData[0]).map(k => ({ key: k, label: k }));
          exportToExcel(sectionData, cols, `${filename}-${key}`);
        }
      } else {
        exportToJSON(data as Record<string, unknown>[], filename);
      }
    } catch (e) {
      console.error('Export error:', e);
    } finally {
      setLoading(false);
      onOpenChange(false);
    }
  };

  const handleLMSExport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        format: lmsFormat,
        includeProgress: String(includeProgress),
        includeAchievements: String(includeAchievements),
        includeAttempts: String(includeAttempts),
      });

      const res = await fetch(`/api/admin/analytics/lms-export?${params}`);
      if (!res.ok) throw new Error('LMS export failed');

      const blob = await res.blob();
      const contentDisposition = res.headers.get('Content-Disposition');
      let filename = 'lms-export';
      if (contentDisposition) {
        const match = contentDisposition.match(/filename=(.+)/);
        if (match) filename = match[1].replace(/['"]/g, '');
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('LMS export error:', e);
    } finally {
      setLoading(false);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            {t('analytics.lms.title')}
          </DialogTitle>
          <DialogDescription>
            Выберите формат и данные для экспорта
          </DialogDescription>
        </DialogHeader>

        <RadioGroup value={activeTab} onValueChange={v => setActiveTab(v as 'analytics' | 'lms')} className="flex gap-4">
          <div className="flex items-center gap-2">
            <RadioGroupItem value="analytics" id="analytics" />
            <Label htmlFor="analytics">Аналитика</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="lms" id="lms" />
            <Label htmlFor="lms">LMS</Label>
          </div>
        </RadioGroup>

        <Separator />

        {activeTab === 'analytics' && (
          <div className="space-y-4">
            <div>
              <Label className="text-base">Формат</Label>
              <RadioGroup value={format} onValueChange={v => setFormat(v as typeof format)} className="flex gap-4 mt-2">
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="csv" id="csv" />
                  <Label htmlFor="csv" className="flex items-center gap-1">
                    <FileText className="h-4 w-4" /> CSV
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="excel" id="excel" />
                  <Label htmlFor="excel" className="flex items-center gap-1">
                    <FileSpreadsheet className="h-4 w-4" /> Excel
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="json" id="json" />
                  <Label htmlFor="json" className="flex items-center gap-1">
                    <FileText className="h-4 w-4" /> JSON
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label className="text-base">Разделы для экспорта</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {sections.map(section => (
                  <div key={section.key} className="flex items-center gap-2">
                    <Checkbox
                      id={section.key}
                      checked={selectedSections[section.key]}
                      onCheckedChange={() => toggleSection(section.key)}
                    />
                    <Label htmlFor={section.key} className="text-sm">{section.label}</Label>
                  </div>
                ))}
              </div>
            </div>

            <Button onClick={handleExportAnalytics} disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Экспорт...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Экспортировать
                </>
              )}
            </Button>
          </div>
        )}

        {activeTab === 'lms' && (
          <div className="space-y-4">
            <div>
              <Label>{t('analytics.lms.format')}</Label>
              <RadioGroup value={lmsFormat} onValueChange={v => setLmsFormat(v as typeof lmsFormat)} className="flex gap-4 mt-2">
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="csv" id="lms-csv" />
                  <Label htmlFor="lms-csv">CSV</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="json" id="lms-json" />
                  <Label htmlFor="lms-json">JSON</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="xml" id="lms-xml" />
                  <Label htmlFor="lms-xml">XML (IMS Global)</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="includeProgress"
                  checked={includeProgress}
                  onCheckedChange={v => setIncludeProgress(!!v)}
                />
                <Label htmlFor="includeProgress">{t('analytics.lms.includeProgress')}</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="includeAchievements"
                  checked={includeAchievements}
                  onCheckedChange={v => setIncludeAchievements(!!v)}
                />
                <Label htmlFor="includeAchievements">{t('analytics.lms.includeAchievements')}</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="includeAttempts"
                  checked={includeAttempts}
                  onCheckedChange={v => setIncludeAttempts(!!v)}
                />
                <Label htmlFor="includeAttempts">{t('analytics.lms.includeAttempts')}</Label>
              </div>
            </div>

            <Button onClick={handleLMSExport} disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Экспорт...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  {t('analytics.lms.exportAll')}
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
