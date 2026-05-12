'use client';

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
    toast.success('Прогресс экспортирован', {
      description: `Выполнено заданий: ${data.completedTasks.length}`,
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
          setImportError('Не удалось прочитать файл');
          return;
        }

        const data = JSON.parse(content) as ExportData;
        const result = importProgress(data);

        if (result.success) {
          setImportStatus('success');
          toast.success('Прогресс импортирован', {
            description: `Загружено ${data.completedTasks.length} выполненных заданий`,
          });
        } else {
          setImportStatus('error');
          setImportError(result.error || 'Ошибка импорта');
          toast.error('Ошибка импорта', { description: result.error });
        }
      } catch {
        setImportStatus('error');
        setImportError('Неверный формат JSON файла');
        toast.error('Ошибка импорта', {
          description: 'Неверный формат JSON файла',
        });
      }
    };
    reader.onerror = () => {
      setImportStatus('error');
      setImportError('Не удалось прочитать файл');
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
          Экспорт / Импорт
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-emerald-500" />
            Экспорт / Импорт прогресса
          </DialogTitle>
          <DialogDescription>
            Сохраните или восстановите ваш прогресс обучения
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Export */}
          <div className="rounded-lg border border-border p-4">
            <h4 className="mb-2 text-sm font-medium">Экспорт прогресса</h4>
            <p className="mb-3 text-xs text-muted-foreground">
              Скачайте файл с вашими выполненными заданиями, избранным и серией
            </p>
            <Button onClick={handleExport} className="w-full" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Скачать прогресс
            </Button>
          </div>

          {/* Import */}
          <div className="rounded-lg border border-border p-4">
            <h4 className="mb-2 text-sm font-medium">Импорт прогресса</h4>
            <p className="mb-3 text-xs text-muted-foreground">
              Загрузите ранее экспортированный файл прогресса
            </p>

            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="cursor-pointer rounded-md border-2 border-dashed border-muted-foreground/25 p-6 text-center transition-colors hover:border-emerald-500/50 hover:bg-muted/30"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="mx-auto h-8 w-8 text-muted-foreground/50" />
              <p className="mt-2 text-sm text-muted-foreground">
                Перетащите файл сюда или{' '}
                <span className="text-emerald-600 dark:text-emerald-400">выберите</span>
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
                Прогресс успешно загружен!
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
            <strong>Внимание:</strong> Импорт заменит ваш текущий прогресс данными из файла
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
