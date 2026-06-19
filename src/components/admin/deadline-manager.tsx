'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { t } from '@/lib/i18n';
import { logger } from '@/lib/logger';
import { Deadline } from '@/lib/db-users';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { CreateDeadlineDialog } from './create-deadline-dialog';

const typeLabels: Record<Deadline['type'], string> = {
  course: 'deadline.type.course',
  exam: 'deadline.type.exam',
  task: 'deadline.type.task',
  inactivity: 'deadline.type.inactivity',
};

const targetLabels: Record<Deadline['target_type'], string> = {
  all_students: 'deadline.target.all',
  group: 'deadline.target.group',
  individual: 'deadline.target.individual',
};

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getTimeStatus(dueAt: number): { label: string; variant: 'destructive' | 'default' | 'secondary' } {
  const now = Date.now();
  const hoursLeft = (dueAt - now) / 3600000;
  if (hoursLeft < 0) return { label: t('reminder.overdue'), variant: 'destructive' };
  if (hoursLeft < 24) return { label: t('reminder.dueSoon'), variant: 'destructive' };
  if (hoursLeft < 72) return { label: t('reminder.dueSoon'), variant: 'default' };
  return { label: `${Math.round(hoursLeft)}h`, variant: 'secondary' };
}

export function DeadlineManager() {
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDeadline, setEditDeadline] = useState<Deadline | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchDeadlines = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch('/api/admin/deadlines?scope=all');
      if (!res.ok) throw new Error('Failed to load deadlines');
      const data = await res.json();
      setDeadlines(data.deadlines || []);
    } catch (err) {
      logger.error('Failed to load deadlines:', err);
      setError(err instanceof Error ? err.message : t('admin.stats.loading'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDeadlines();
  }, [fetchDeadlines]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/admin/deadlines/${deleteId}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to delete deadline');
      }
      toast.success(t('deadline.deleted'));
      fetchDeadlines();
    } catch (err: unknown) {
      logger.error('Failed to delete deadline:', err);
      const message = err instanceof Error ? err.message : t('admin.stats.loading');
      toast.error(message);
    } finally {
      setDeleteId(null);
    }
  };

  if (loading)
    return (
      <div className="p-8 text-center" role="status">
        {t('admin.stats.loading')}
      </div>
    );

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-destructive">{error}</p>
        <Button variant="outline" size="sm" className="mt-2" onClick={fetchDeadlines}>
          {t('admin.users.retry', { default: 'Retry' })}
        </Button>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{t('deadline.title')}</CardTitle>
        <Button onClick={() => setDialogOpen(true)}>{t('deadline.create')}</Button>
      </CardHeader>
      <CardContent>
        {deadlines.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <p>{t('deadline.noDeadlines')}</p>
            <p className="text-sm mt-1">{t('deadline.noDeadlinesDesc')}</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('deadline.titleLabel')}</TableHead>
                <TableHead>{t('deadline.type')}</TableHead>
                <TableHead>{t('deadline.target')}</TableHead>
                <TableHead>{t('deadline.dueDate')}</TableHead>
                <TableHead>{t('deadline.status')}</TableHead>
                <TableHead className="text-right">{t('admin.users.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deadlines.map((d) => {
                const status = getTimeStatus(d.due_at);
                return (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">
                      <div>{d.title}</div>
                      {d.description && <div className="text-sm text-muted-foreground">{d.description}</div>}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{t(typeLabels[d.type])}</Badge>
                    </TableCell>
                    <TableCell>{t(targetLabels[d.target_type])}</TableCell>
                    <TableCell>{formatDate(d.due_at)}</TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditDeadline(d);
                            setDialogOpen(true);
                          }}
                        >
                          {t('deadline.edit')}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => setDeleteId(d.id)}
                        >
                          {t('deadline.delete')}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <CreateDeadlineDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditDeadline(null);
        }}
        deadline={editDeadline}
        onSuccess={fetchDeadlines}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deadline.delete')}</AlertDialogTitle>
            <AlertDialogDescription>{t('deadline.confirmDelete')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('action.close')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>{t('deadline.delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
