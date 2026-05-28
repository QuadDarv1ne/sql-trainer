'use client';

import type * as React from 'react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { t } from '@/lib/i18n';
import { Deadline } from '@/lib/db-users';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CreateDeadlineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  deadline?: Deadline | null;
}

export function CreateDeadlineDialog({ open, onOpenChange, onSuccess, deadline }: CreateDeadlineDialogProps) {
  const isEdit = !!deadline;
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<Deadline['type']>('course');
  const [targetType, setTargetType] = useState<Deadline['target_type']>('all_students');
  const [targetId, setTargetId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('23:59');
  const [loading, setLoading] = useState(false);

  // Populate form when deadline changes
  useEffect(() => {
    if (deadline) {
      const d = new Date(deadline.due_at);
      setTitle(deadline.title);
      setDescription(deadline.description || '');
      setType(deadline.type);
      setTargetType(deadline.target_type);
      setTargetId(deadline.target_id || '');
      setDueDate(d.toISOString().split('T')[0]);
      setDueTime(d.toTimeString().slice(0, 5));
    } else if (open) {
      setTitle('');
      setDescription('');
      setType('course');
      setTargetType('all_students');
      setDueDate('');
      setDueTime('23:59');
    }
  }, [deadline, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !dueDate) {
      toast.error(t('deadline.requiredFields'));
      return;
    }

    const dueAt = new Date(`${dueDate}T${dueTime}`).getTime();
    if (isNaN(dueAt)) {
      toast.error(t('deadline.invalidDate'));
      return;
    }

    setLoading(true);
    try {
      if (isEdit && !deadline) throw new Error('Deadline not found');
      const url = isEdit ? `/api/admin/deadlines/${deadline.id}` : '/api/admin/deadlines';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, type, targetType, targetId: targetId || null, dueAt }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');

      toast.success(isEdit ? t('deadline.updated') : t('deadline.created'));
      onSuccess();
      onOpenChange(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('admin.stats.loading');
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? t('deadline.edit') : t('deadline.create')}</DialogTitle>
          <DialogDescription>{isEdit ? t('deadline.updated') : t('deadline.noDeadlinesDesc')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label>{t('deadline.titleLabel')}</Label>
              <Input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder={t('deadline.titlePlaceholder')}
              />
            </div>

            <div>
              <Label>{t('deadline.description')}</Label>
              <Input
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder={t('deadline.descriptionPlaceholder')}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('deadline.type')}</Label>
                <Select value={type} onValueChange={v => setType(v as Deadline['type'])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="course">{t('deadline.type.course')}</SelectItem>
                    <SelectItem value="exam">{t('deadline.type.exam')}</SelectItem>
                    <SelectItem value="task">{t('deadline.type.task')}</SelectItem>
                    <SelectItem value="inactivity">{t('deadline.type.inactivity')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>{t('deadline.target')}</Label>
                <Select value={targetType} onValueChange={v => setTargetType(v as Deadline['target_type'])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all_students">{t('deadline.target.all')}</SelectItem>
                    <SelectItem value="group">{t('deadline.target.group')}</SelectItem>
                    <SelectItem value="individual">{t('deadline.target.individual')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {(targetType === 'group' || targetType === 'individual') && (
              <div>
                <Label>{targetType === 'group' ? t('deadline.targetId.group') : t('deadline.targetId.individual')}</Label>
                <Input
                  value={targetId}
                  onChange={e => setTargetId(e.target.value)}
                  placeholder={targetType === 'group' ? t('deadline.targetId.groupPlaceholder') : t('deadline.targetId.individualPlaceholder')}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('deadline.dueDate')}</Label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                />
              </div>
              <div>
                <Label>{t('deadline.time')}</Label>
                <Input
                  type="time"
                  value={dueTime}
                  onChange={e => setDueTime(e.target.value)}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('action.close')}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? '...' : (isEdit ? t('deadline.edit') : t('deadline.create'))}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
