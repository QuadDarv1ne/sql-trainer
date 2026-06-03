'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { TRAINING_TASKS } from '@/lib/training-tasks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, AlertCircle, Clock, Eye, Search, ChevronUp, ChevronDown } from 'lucide-react';
import { t } from '@/lib/i18n';
import TeacherStudentDialog from './teacher-student-dialog';

interface StudentProgress {
  user_id: string;
  name: string;
  email: string;
  tasks_completed: number;
  total_attempts: number;
  avg_attempts: number;
  completion_rate: number;
  last_active: number | null;
}

type SortKey = 'name' | 'email' | 'tasks_completed' | 'completion_rate' | 'avg_attempts' | 'last_active';

export default function StudentProgressTable() {
  const [students, setStudents] = useState<StudentProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('tasks_completed');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const controllerRef = useRef<AbortController | null>(null);

  const handleViewDetails = (userId: string) => {
    setSelectedStudentId(userId);
    setDialogOpen(true);
  };

  useEffect(() => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    fetch('/api/teacher/students/progress', { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load progress');
        return r.json();
      })
      .then((data) => {
        if (!controller.signal.aborted) setStudents(data.students);
      })
      .catch(() => {
        if (!controller.signal.aborted) setError(t('teacher.error'));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, []);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'name' ? 'asc' : 'desc');
    }
    setPage(1);
  };

  const filteredAndSorted = useMemo(() => {
    let result = [...students];
    if (search) {
      const s = search.toLowerCase();
      result = result.filter((u) => u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s));
    }
    result.sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (typeof aVal === 'number' && typeof bVal === 'number') return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      if (aVal === null && bVal === null) return 0;
      if (aVal === null) return 1;
      if (bVal === null) return -1;
      const aStr = String(aVal);
      const bStr = String(bVal);
      return sortDir === 'asc' ? aStr.localeCompare(bStr, 'ru') : bStr.localeCompare(aStr, 'ru');
    });
    return result;
  }, [students, search, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSorted.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = filteredAndSorted.slice((safePage - 1) * pageSize, safePage * pageSize);

  if (loading) return <p className="text-center py-8">{t('teacher.loading')}</p>;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {t('teacher.progress.title')}
            </CardTitle>
            <div className="flex items-center gap-2 w-64">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('teacher.progress.search')}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="h-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  {[
                    { key: 'name' as SortKey, label: t('teacher.progress.name') },
                    { key: 'email' as SortKey, label: t('teacher.progress.email') },
                    { key: 'tasks_completed' as SortKey, label: t('teacher.progress.completed') },
                    { key: 'completion_rate' as SortKey, label: t('teacher.progress.completionRate') },
                    { key: 'avg_attempts' as SortKey, label: t('teacher.progress.avgAttempts') },
                    { key: 'last_active' as SortKey, label: t('teacher.progress.lastActive') },
                  ].map(({ key, label }) => (
                    <TableHead key={key} className="cursor-pointer select-none" onClick={() => handleSort(key)}>
                      <div className="flex items-center gap-1">
                        {label}
                        {sortKey === key &&
                          (sortDir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                      </div>
                    </TableHead>
                  ))}
                  <TableHead className="text-right">{t('teacher.student.details')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map((student) => {
                  const daysAgo = student.last_active
                    ? Math.floor((Date.now() - student.last_active) / (24 * 60 * 60 * 1000))
                    : null;

                  return (
                    <TableRow key={student.user_id}>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell>{student.email}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary">
                          {student.tasks_completed}/{TRAINING_TASKS.length}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Progress value={student.completion_rate} className="h-2 w-16" />
                          <span className="text-sm w-10 text-right">{student.completion_rate}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{student.avg_attempts}</TableCell>
                      <TableCell>
                        {student.last_active ? (
                          <span className="flex items-center gap-1 text-sm">
                            <Clock className="h-3 w-3" />
                            {daysAgo === 0
                              ? t('teacher.progress.today')
                              : daysAgo === 1
                                ? t('teacher.progress.yesterday')
                                : t('teacher.progress.daysAgo', { days: String(daysAgo) })}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">{t('teacher.progress.neverActive')}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleViewDetails(student.user_id)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <span className="text-sm text-muted-foreground">
              {filteredAndSorted.length === 0
                ? t('teacher.progress.noResults')
                : `${(safePage - 1) * pageSize + 1}–${Math.min(safePage * pageSize, filteredAndSorted.length)} ${t('teacher.progress.of')} ${filteredAndSorted.length}`}
            </span>
            <div className="flex items-center gap-2">
              <Select
                value={String(pageSize)}
                onValueChange={(v) => {
                  setPageSize(Number(v));
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-16 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" disabled={safePage <= 1} onClick={() => setPage((p) => p - 1)}>
                {t('teacher.progress.prev')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                {t('teacher.progress.next')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <TeacherStudentDialog studentId={selectedStudentId} open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}
