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
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import StudentAcademicProfile from '@/components/admin/analytics/student-academic-profile';
import type { UserRole } from '@/lib/db-users';
import { Users, Trash2, AlertCircle, CheckCircle2, ChevronUp, ChevronDown, Search, Plus, UserPlus, Undo2, Pencil, BookOpen } from 'lucide-react';
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

interface DeletedUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  deleted_at: number;
  created_at: number;
}

type SortKey = keyof User;

export default function UserTable() {
  const [users, setUsers] = useState<User[]>([]);
  const [deletedUsers, setDeletedUsers] = useState<DeletedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<'role' | 'delete' | null>(null);
  const [bulkRole, setBulkRole] = useState<UserRole>('student');
  const [createOpen, setCreateOpen] = useState(false);
  const [newUser, setNewUser] = useState({ email: '', name: '', password: '', phone: '', role: 'student' as UserRole });
  const [creating, setCreating] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editUser, setEditUser] = useState<{ id: string; name: string; email: string; phone: string | null } | null>(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '' });
  const [saving, setSaving] = useState(false);
  const [detailStudentId, setDetailStudentId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('active');

  const fetchUsers = useCallback(async () => {
    try {
      const [usersRes, deletedRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/users/deleted'),
      ]);
      if (!usersRes.ok) throw new Error('Failed to load users');
      const usersData = await usersRes.json();
      setUsers(usersData.users);
      if (deletedRes.ok) {
        const deletedData = await deletedRes.json();
        setDeletedUsers(deletedData.users);
      }
    } catch {
      setError(t('admin.users.error'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSort = useCallback((key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setPage(1);
  }, [sortKey]);

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
      setSelectedIds(prev => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
      fetchUsers();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('admin.users.deleteError'));
    }
  };

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = () => {
    if (selectedIds.size === paged.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paged.map(u => u.id)));
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedIds.size === 0) return;
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/admin/users/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: bulkAction === 'delete' ? 'delete' : 'role',
          userIds: [...selectedIds],
          role: bulkRole,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Bulk action failed');
      }
      const result = await res.json();
      const count = result.changed || result.deleted || 0;
      setSuccess(t('admin.users.bulkUpdated', { count: String(count) }));
      setSelectedIds(new Set());
      setBulkAction(null);
      fetchUsers();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('admin.users.roleUpdateError'));
    }
  };

  const handleCreateUser = async () => {
    if (!newUser.email || !newUser.name || !newUser.password) {
      setError('Email, name, and password are required');
      return;
    }
    setError('');
    setSuccess('');
    setCreating(true);
    try {
      const res = await fetch('/api/admin/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create user');
      }
      setSuccess(t('admin.users.created'));
      setCreateOpen(false);
      setNewUser({ email: '', name: '', password: '', phone: '', role: 'student' as UserRole });
      fetchUsers();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('admin.users.createError'));
    } finally {
      setCreating(false);
    }
  };

  const handleRestore = async (userId: string, userName: string) => {
    if (!confirm(t('admin.users.restoreConfirm', { name: userName }))) return;
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`/api/admin/users/${userId}/restore`, { method: 'POST' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to restore user');
      }
      setSuccess(t('admin.users.restored'));
      fetchUsers();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('admin.users.restoreError'));
    }
  };

  const openEdit = (user: User) => {
    setEditUser({ id: user.id, name: user.name, email: user.email, phone: user.phone });
    setEditForm({ name: user.name, email: user.email, phone: user.phone || '' });
    setEditOpen(true);
  };

  const handleSaveUser = async () => {
    if (!editUser || !editForm.name || !editForm.email) {
      setError('Name and email are required');
      return;
    }
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${editUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update user');
      }
      setSuccess(t('admin.users.updated'));
      setEditOpen(false);
      setEditUser(null);
      fetchUsers();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('admin.users.updateError'));
    } finally {
      setSaving(false);
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
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <UserPlus className="h-4 w-4 mr-1" />
              {t('admin.users.create')}
            </Button>
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
          <TabsList>
            <TabsTrigger value="active">{t('admin.users.tabs.active')} ({users.length})</TabsTrigger>
            <TabsTrigger value="deleted">{t('admin.users.tabs.deleted')} ({deletedUsers.length})</TabsTrigger>
          </TabsList>
        </Tabs>

        {activeTab === 'active' && (
          <>
            {selectedIds.size > 0 && (
              <div className="flex items-center gap-2 mb-4 p-3 bg-muted rounded-md">
                <span className="text-sm font-medium">{selectedIds.size} selected</span>
                {bulkAction === null ? (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setBulkAction('role')}
                    >
                      {t('admin.users.bulk.changeRole')}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setBulkAction('delete')}
                      className="text-red-600"
                    >
                      {t('admin.users.bulk.delete')}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}>
                      {t('admin.users.bulk.cancel')}
                    </Button>
                  </>
                ) : bulkAction === 'role' ? (
                  <>
                    <Select value={bulkRole} onValueChange={(v: UserRole) => setBulkRole(v)}>
                      <SelectTrigger className="w-40 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">{t('admin.users.role.student')}</SelectItem>
                        <SelectItem value="teacher">{t('admin.users.role.teacher')}</SelectItem>
                        <SelectItem value="admin">{t('admin.users.role.admin')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button size="sm" onClick={handleBulkAction}>{t('admin.users.bulk.apply')}</Button>
                    <Button size="sm" variant="ghost" onClick={() => setBulkAction(null)}>{t('admin.users.bulk.cancel')}</Button>
                  </>
                ) : bulkAction === 'delete' ? (
                  <>
                    <span className="text-sm text-destructive">{t('admin.users.bulk.confirmDelete', { count: String(selectedIds.size) })}</span>
                    <Button size="sm" variant="destructive" onClick={handleBulkAction}>{t('admin.users.bulk.confirm')}</Button>
                    <Button size="sm" variant="ghost" onClick={() => setBulkAction(null)}>{t('admin.users.bulk.cancel')}</Button>
                  </>
                ) : null}
              </div>
            )}

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === paged.length && paged.length > 0}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                </TableHead>
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
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(user.id)}
                      onChange={() => toggleSelect(user.id)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                  </TableCell>
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
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDetailStudentId(user.id)}
                        className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-950"
                        aria-label={t('admin.users.viewDetails')}
                      >
                        <BookOpen className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(user)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950"
                        aria-label={t('admin.users.edit')}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(user.id, user.name)}
                        className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950"
                        aria-label={t('admin.users.deleteAria')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
          </>
        )}

        {activeTab === 'deleted' && (
          <>
            {deletedUsers.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">{t('admin.users.deleted.empty')}</p>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('admin.users.name')}</TableHead>
                      <TableHead>{t('admin.users.email')}</TableHead>
                      <TableHead>{t('admin.users.role')}</TableHead>
                      <TableHead>{t('admin.users.deletedAt')}</TableHead>
                      <TableHead>{t('admin.users.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deletedUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{t(`admin.users.role.${user.role}`)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{new Date(user.deleted_at).toLocaleString()}</TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRestore(user.id, user.name)}
                          >
                            <Undo2 className="h-4 w-4 mr-1" />
                            {t('admin.users.restore')}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </>
        )}
      </CardContent>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              {t('admin.users.create')}
            </DialogTitle>
            <DialogDescription>
              {t('admin.users.createDesc')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">{t('admin.users.name')}</Label>
              <Input
                id="name"
                value={newUser.name}
                onChange={e => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                placeholder="John Doe"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">{t('admin.users.email')}</Label>
              <Input
                id="email"
                type="email"
                value={newUser.email}
                onChange={e => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                placeholder="john@example.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">{t('admin.users.password')}</Label>
              <Input
                id="password"
                type="password"
                value={newUser.password}
                onChange={e => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                placeholder="••••••••"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">{t('admin.users.phone')}</Label>
              <Input
                id="phone"
                value={newUser.phone}
                onChange={e => setNewUser(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+1234567890"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">{t('admin.users.role')}</Label>
              <Select value={newUser.role} onValueChange={(v: UserRole) => setNewUser(prev => ({ ...prev, role: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">{t('admin.users.role.student')}</SelectItem>
                  <SelectItem value="teacher">{t('admin.users.role.teacher')}</SelectItem>
                  <SelectItem value="admin">{t('admin.users.role.admin')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              {t('admin.users.cancel')}
            </Button>
            <Button onClick={handleCreateUser} disabled={creating}>
              {creating ? t('admin.users.creating') : t('admin.users.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-4 w-4" />
              {t('admin.users.edit')}
            </DialogTitle>
            <DialogDescription>
              {t('admin.users.editDesc')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">{t('admin.users.name')}</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-email">{t('admin.users.email')}</Label>
              <Input
                id="edit-email"
                type="email"
                value={editForm.email}
                onChange={e => setEditForm(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-phone">{t('admin.users.phone')}</Label>
              <Input
                id="edit-phone"
                value={editForm.phone}
                onChange={e => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              {t('admin.users.cancel')}
            </Button>
            <Button onClick={handleSaveUser} disabled={saving}>
              {saving ? t('admin.users.saving') : t('admin.users.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <StudentAcademicProfile
        studentId={detailStudentId}
        open={detailStudentId !== null}
        onOpenChange={(open) => { if (!open) setDetailStudentId(null); }}
      />
    </Card>
  );
}
