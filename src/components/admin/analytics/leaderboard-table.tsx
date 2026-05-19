'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AlertCircle, Award, Trophy, Medal, Search, ChevronUp, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import StudentDetailDialog from './student-detail-dialog';
import { t } from '@/lib/i18n';

interface LeaderboardEntry {
  rank: number;
  user_id: string;
  name: string;
  email: string;
  tasks_completed: number;
  total_attempts: number;
  avg_attempts: number;
  achievements_count: number;
  completion_rate: number;
}

type SortKey = 'rank' | 'name' | 'tasks_completed' | 'avg_attempts' | 'achievements_count' | 'completion_rate';

function RankIcon({ rank }: { rank: number }) {
  if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
  if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
  if (rank === 3) return <Medal className="h-5 w-5 text-amber-700" />;
  return <span className="text-muted-foreground font-medium">{rank}</span>;
}

export default function LeaderboardTable() {
  const [data, setData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('rank');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  useEffect(() => {
    fetch('/api/admin/analytics/leaderboard')
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load');
        return r.json();
      })
      .then((data) => setData(data.leaderboard))
      .catch(() => setError(t('analytics.error')))
      .finally(() => setLoading(false));
  }, []);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir(key === 'rank' ? 'asc' : 'desc');
    }
    setPage(1);
  };

  const filteredAndSorted = useMemo(() => {
    let result = [...data];
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(e => e.name.toLowerCase().includes(s) || e.email.toLowerCase().includes(s));
    }
    result.sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (typeof aVal === 'number' && typeof bVal === 'number') return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      const aStr = String(aVal ?? '');
      const bStr = String(bVal ?? '');
      return sortDir === 'asc' ? aStr.localeCompare(bStr, 'ru') : bStr.localeCompare(aStr, 'ru');
    });
    return result;
  }, [data, search, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSorted.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = filteredAndSorted.slice((safePage - 1) * pageSize, safePage * pageSize);

  const handleRowClick = (userId: string) => {
    setSelectedStudentId(userId);
    setDialogOpen(true);
  };

  if (loading) return <p className="text-center py-4">{t('analytics.loading')}</p>;
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }
  if (!data.length) return <p className="text-center py-4">{t('analytics.noData')}</p>;

  const sortCols: { key: SortKey; label: string; className?: string }[] = [
    { key: 'rank', label: t('analytics.leaderboard.rank'), className: 'w-16' },
    { key: 'name', label: t('analytics.leaderboard.name') },
    { key: 'tasks_completed', label: t('analytics.leaderboard.completed') },
    { key: 'avg_attempts', label: t('analytics.leaderboard.avgAttempts') },
    { key: 'achievements_count', label: t('analytics.leaderboard.achievements') },
    { key: 'completion_rate', label: t('analytics.leaderboard.completionRate'), className: 'w-40' },
  ];

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              {t('analytics.leaderboard.title')}
            </CardTitle>
            <div className="flex items-center gap-2 w-64">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('analytics.leaderboard.search')}
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="h-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  {sortCols.map(({ key, label, className }) => (
                    <TableHead
                      key={key}
                      className={`cursor-pointer select-none ${className ?? ''}`}
                      onClick={() => handleSort(key)}
                    >
                      <div className="flex items-center gap-1">
                        {label}
                        {sortKey === key && (
                          sortDir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                        )}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map((entry) => (
                  <TableRow
                    key={entry.user_id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleRowClick(entry.user_id)}
                  >
                    <TableCell>
                      <div className="flex items-center justify-center">
                        <RankIcon rank={entry.rank} />
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      <div>
                        <div>{entry.name}</div>
                        <div className="text-xs text-muted-foreground">{entry.email}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary">{entry.tasks_completed}/56</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {Math.round(entry.avg_attempts * 10) / 10}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Award className="h-4 w-4 text-purple-600" />
                        <span>{entry.achievements_count}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Progress value={entry.completion_rate} className="h-2" />
                        <p className="text-xs text-muted-foreground text-right">
                          {entry.completion_rate}%
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <span className="text-sm text-muted-foreground">
              {filteredAndSorted.length === 0
                ? t('analytics.leaderboard.noResults')
                : `${(safePage - 1) * pageSize + 1}–${Math.min(safePage * pageSize, filteredAndSorted.length)} из ${filteredAndSorted.length}`}
            </span>
            <div className="flex items-center gap-2">
              <Select value={String(pageSize)} onValueChange={v => { setPageSize(Number(v)); setPage(1); }}>
                <SelectTrigger className="w-16 h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" disabled={safePage <= 1} onClick={() => setPage(p => p - 1)}>
                {t('analytics.leaderboard.prev')}
              </Button>
              <Button variant="outline" size="sm" disabled={safePage >= totalPages} onClick={() => setPage(p => p + 1)}>
                {t('analytics.leaderboard.next')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <StudentDetailDialog
        studentId={selectedStudentId}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
}
