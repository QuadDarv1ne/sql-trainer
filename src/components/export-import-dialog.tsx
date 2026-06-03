'use client';

import type * as React from 'react';
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useSQLTrainerStore, type ExportData } from '@/lib/store';
import { Download, Upload, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { t } from '@/lib/i18n';

export default function ExportImportDialog() {
  const { exportProgress, importProgress } = useSQLTrainerStore();
  const [open, setOpen] = useState(false);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [importError, setImportError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const data = exportProgress();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sql-trainer-progress-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(t('exportImport.exported'), {
      description: t('exportImport.exported') + `: ${data.completedTasks.length}`,
    });
  };

  const handleImport = (file: File) => {
    setImportStatus('idle');
    setImportError('');

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result;
        if (typeof content !== 'string') {
          setImportStatus('error');
          setImportError(t('exportImport.readError'));
          return;
        }

        const data = JSON.parse(content) as ExportData;
        const result = importProgress(data);

        if (result.success) {
          setImportStatus('success');
          toast.success(t('exportImport.imported'), {
            description: `${data.completedTasks.length} ${t('sidebar.completed')}`,
          });
        } else {
          setImportStatus('error');
          setImportError(result.error || t('exportImport.importError'));
          toast.error(t('exportImport.importError'), { description: result.error });
        }
      } catch {
        setImportStatus('error');
        setImportError(t('exportImport.invalidFormat'));
        toast.error(t('exportImport.importError'), {
          description: t('exportImport.invalidFormat'),
        });
      }
    };
    reader.onerror = () => {
      setImportStatus('error');
      setImportError(t('exportImport.readError'));
    };
    reader.readAsText(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImport(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/json') {
      handleImport(file);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full text-xs">
          <Download className="mr-1.5 h-3.5 w-3.5" />
          {t('exportImport.button')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-emerald-500" />
            {t('exportImport.title')}
          </DialogTitle>
          <DialogDescription>{t('exportImport.desc')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Export */}
          <div className="rounded-lg border border-border p-4">
            <h4 className="mb-2 text-sm font-medium">{t('exportImport.exportTitle')}</h4>
            <p className="mb-3 text-xs text-muted-foreground">{t('exportImport.exportDesc')}</p>
            <Button onClick={handleExport} className="w-full" size="sm">
              <Download className="mr-2 h-4 w-4" />
              {t('exportImport.exportBtn')}
            </Button>
          </div>

          {/* Import */}
          <div className="rounded-lg border border-border p-4">
            <h4 className="mb-2 text-sm font-medium">{t('exportImport.importTitle')}</h4>
            <p className="mb-3 text-xs text-muted-foreground">{t('exportImport.importDesc')}</p>

            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="cursor-pointer rounded-md border-2 border-dashed border-muted-foreground/25 p-6 text-center transition-colors hover:border-emerald-500/50 hover:bg-muted/30"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="mx-auto h-8 w-8 text-muted-foreground/50" />
              <p className="mt-2 text-sm text-muted-foreground">
                {t('exportImport.drop')}{' '}
                <span className="text-emerald-600 dark:text-emerald-400">{t('exportImport.select')}</span>
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {/* Status messages */}
            {importStatus === 'success' && (
              <div className="mt-3 flex items-center gap-2 rounded-md bg-emerald-50 p-2 text-sm text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                {t('exportImport.success')}
              </div>
            )}

            {importStatus === 'error' && (
              <div className="mt-3 flex items-center gap-2 rounded-md bg-red-50 p-2 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-400">
                <AlertCircle className="h-4 w-4" />
                {importError}
              </div>
            )}
          </div>

          {/* Warning */}
          <div className="rounded-md bg-amber-50 p-3 text-xs text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
            <strong>{t('exportImport.warning')}</strong> {t('exportImport.warningDesc')}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
