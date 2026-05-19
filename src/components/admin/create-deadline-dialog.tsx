'use client';

import { useState } from 'react';
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
}

export function CreateDeadlineDialog({ open, onOpenChange, onSuccess }: CreateDeadlineDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<Deadline['type']>('course');
  const [targetType, setTargetType] = useState<Deadline['target_type']>('all_students');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('23:59');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !dueDate) {
      toast.error('Заполните обязательные поля');
      return;
    }

    const dueAt = new Date(`${dueDate}T${dueTime}`).getTime();
    if (isNaN(dueAt)) {
      toast.error('Неверная дата');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/admin/deadlines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, type, targetType, dueAt }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');

      toast.success(t('deadline.created'));
      onSuccess();
      onOpenChange(false);
      setTitle('');
      setDescription('');
      setDueDate('');
      setDueTime('23:59');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('deadline.create')}</DialogTitle>
          <DialogDescription>{t('deadline.noDeadlinesDesc')}</DialogDescription>
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
                <Label>Время</Label>
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
              {loading ? '...' : t('deadline.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
