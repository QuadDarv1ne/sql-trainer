'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import RoleBadge from '@/components/auth/role-badge';
import type { UserRole } from '@/lib/db-users';
import { Users, Trash2, AlertCircle, CheckCircle2, ChevronUp, ChevronDown, Search } from 'lucide-react';
import { t } from '@/lib/i18n';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  created_at: number;
  tasks_completed: number;
}

type SortKey = keyof User;

export default function UserTable() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/users');
      if (!res.ok) throw new Error('Failed to load users');
      const data = await res.json();
      setUsers(data.users);
    } catch {
      setError(t('admin.users.error'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setPage(1);
  };

  const filteredAndSorted = useMemo(() => {
    let result = [...users];
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(u => u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s));
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
  }, [users, search, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSorted.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = filteredAndSorted.slice((safePage - 1) * pageSize, safePage * pageSize);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) throw new Error('Failed to update role');
      setSuccess(t('admin.users.roleUpdated'));
      fetchUsers();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('admin.users.roleUpdateError'));
    }
  };

  const handleDelete = async (userId: string, userName: string) => {
    if (!confirm(t('admin.users.deleteConfirm', { name: userName }))) return;
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete user');
      }
      setSuccess(t('admin.users.deleted'));
      fetchUsers();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('admin.users.deleteError'));
    }
  };

  if (loading) return <p className="text-center py-8">{t('admin.users.loading')}</p>;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {t('admin.users.title')}
          </CardTitle>
          <div className="flex items-center gap-2 w-64">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('admin.users.search')}
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
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
        {success && (
          <Alert className="mb-4 border-emerald-500 bg-emerald-50 dark:bg-emerald-950">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <AlertDescription className="text-emerald-600">{success}</AlertDescription>
          </Alert>
        )}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {([
                  { key: 'name' as SortKey, label: t('admin.users.name') },
                  { key: 'email' as SortKey, label: t('admin.users.email') },
                  { key: 'role' as SortKey, label: t('admin.users.role') },
                  { key: 'tasks_completed' as SortKey, label: t('admin.users.tasks') },
                  { key: 'created_at' as SortKey, label: t('admin.users.registered') },
                ]).map(({ key, label }) => (
                  <TableHead
                    key={key}
                    className="cursor-pointer select-none"
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
                <TableHead>{t('admin.users.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Select
                      value={user.role}
                      onValueChange={(v: UserRole) => handleRoleChange(user.id, v)}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">{t('admin.users.role.student')}</SelectItem>
                        <SelectItem value="teacher">{t('admin.users.role.teacher')}</SelectItem>
                        <SelectItem value="admin">{t('admin.users.role.admin')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>{user.tasks_completed}</TableCell>
                  <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(user.id, user.name)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
              ? t('admin.users.noResults')
              : `${(safePage - 1) * pageSize + 1}–${Math.min(safePage * pageSize, filteredAndSorted.length)} ${t('teacher.progress.of')} ${filteredAndSorted.length}`}
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
              {t('admin.users.prev')}
            </Button>
            <Button variant="outline" size="sm" disabled={safePage >= totalPages} onClick={() => setPage(p => p + 1)}>
              {t('admin.users.next')}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
