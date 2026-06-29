'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import {
  Users,
  Plus,
  MoreVertical,
  UserPlus,
  Download,
  Trash2,
  Edit,
  Mail,
  Search,
  Filter,
  GraduationCap,
  TrendingUp,
  AlertCircle,
  X,
} from 'lucide-react';
import { t } from '@/lib/i18n';
import { logger } from '@/lib/logger';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

interface Student {
  id: string;
  name: string;
  email: string;
  joinedAt: number;
  lastActiveAt?: number;
  completedTasks: number;
  totalAttempts: number;
  level: number;
  xp: number;
}

interface Group {
  id: string;
  name: string;
  description?: string;
  studentCount: number;
  createdAt: number;
  deadline?: number;
}

interface GroupManagementProps {
  groupId?: string;
}

export default function GroupManagement({ groupId }: GroupManagementProps) {
  const { toast } = useToast();
  const [groups, setGroups] = useState<Group[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isAddStudentDialogOpen, setIsAddStudentDialogOpen] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [studentEmails, setStudentEmails] = useState('');

  const fetchGroups = useCallback(async () => {
    try {
      const res = await fetch('/api/teacher/groups');
      if (!res.ok) return;
      const data = await res.json();
      if (data.success) {
        setGroups(data.groups || []);
        if (groupId && !selectedGroup) {
          const group = data.groups.find((g: Group) => g.id === groupId);
          if (group) setSelectedGroup(group);
        }
      }
    } catch (error) {
      logger.error('Failed to fetch groups:', error);
    }
  }, [groupId, selectedGroup]);

  const fetchStudents = useCallback(async (groupIdParam?: string) => {
    if (!groupIdParam) return;
    try {
      const res = await fetch(`/api/teacher/groups/${groupIdParam}/members`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.success) {
        setStudents(data.students || []);
      }
    } catch (error) {
      logger.error('Failed to fetch students:', error);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  useEffect(() => {
    if (selectedGroup) {
      fetchStudents(selectedGroup.id);
    }
  }, [selectedGroup, fetchStudents]);

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      toast({
        title: t('teacher.group.error'),
        description: t('teacher.group.enterName'),
        variant: 'destructive',
      });
      return;
    }

    try {
      const res = await fetch('/api/teacher/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newGroupName.trim(),
          description: newGroupDescription.trim(),
        }),
      });

      if (!res.ok) {
        toast({
          title: t('teacher.group.error'),
          description: t('teacher.group.createFailed'),
          variant: 'destructive',
        });
        return;
      }
      const data = await res.json();
      if (data.success) {
        toast({
          title: t('teacher.group.created'),
          description: t('teacher.group.createdDesc', { name: newGroupName }),
        });
        setNewGroupName('');
        setNewGroupDescription('');
        setIsCreateDialogOpen(false);
        fetchGroups();
      }
    } catch (error) {
      logger.error('Failed to create group:', error);
      toast({
        title: t('teacher.group.error'),
        description: t('teacher.group.createFailed'),
        variant: 'destructive',
      });
    }
  };

  const handleAddStudents = async () => {
    if (!selectedGroup || !studentEmails.trim()) {
      toast({
        title: t('teacher.group.error'),
        description: t('teacher.group.enterEmails'),
        variant: 'destructive',
      });
      return;
    }

    const emails = studentEmails
      .split(/[,\n]+/)
      .map((e) => e.trim())
      .filter((e) => e.length > 0);

    try {
      const res = await fetch(`/api/teacher/groups/${selectedGroup.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emails }),
      });

      if (!res.ok) {
        toast({ title: t('teacher.group.error'), description: t('teacher.group.addFailed'), variant: 'destructive' });
        return;
      }
      const data = await res.json();
      if (data.success) {
        toast({
          title: t('teacher.group.added'),
          description: t('teacher.group.addedDesc'),
        });
        setStudentEmails('');
        setIsAddStudentDialogOpen(false);
        fetchStudents(selectedGroup.id);
      }
    } catch (error) {
      logger.error('Failed to add students:', error);
      toast({
        title: t('teacher.group.error'),
        description: t('teacher.group.addFailed'),
        variant: 'destructive',
      });
    }
  };

  const handleRemoveStudent = async (studentId: string) => {
    if (!selectedGroup) return;

    try {
      const res = await fetch(`/api/teacher/groups/${selectedGroup.id}/members`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentIds: [studentId] }),
      });

      if (!res.ok) {
        toast({
          title: t('teacher.group.error'),
          description: t('teacher.group.removeFailed'),
          variant: 'destructive',
        });
        return;
      }
      const data = await res.json();
      if (data.success) {
        toast({
          title: t('teacher.group.removed'),
          description: t('teacher.group.removedDesc'),
        });
        fetchStudents(selectedGroup.id);
      }
    } catch (error) {
      logger.error('Failed to remove student:', error);
      toast({
        title: t('teacher.group.error'),
        description: t('teacher.group.removeFailed'),
        variant: 'destructive',
      });
    }
  };

  const handleBulkRemove = async () => {
    if (!selectedGroup || selectedStudents.size === 0) return;

    try {
      const res = await fetch(`/api/teacher/groups/${selectedGroup.id}/members`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentIds: Array.from(selectedStudents) }),
      });

      if (!res.ok) {
        toast({
          title: t('teacher.group.error'),
          description: t('teacher.group.removeManyFailed'),
          variant: 'destructive',
        });
        return;
      }
      const data = await res.json();
      if (data.success) {
        toast({
          title: t('teacher.group.removedMany'),
          description: t('teacher.group.removedManyDesc'),
        });
        setSelectedStudents(new Set());
        fetchStudents(selectedGroup.id);
      }
    } catch (error) {
      logger.error('Failed to remove students:', error);
      toast({
        title: t('teacher.group.error'),
        description: t('teacher.group.removeManyFailed'),
        variant: 'destructive',
      });
    }
  };

  const handleExportGroup = async () => {
    if (!selectedGroup) return;

    try {
      const res = await fetch(`/api/teacher/export?groupId=${selectedGroup.id}`);
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `group-${selectedGroup.name}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: t('teacher.group.exportComplete'),
        description: t('teacher.group.exportDesc'),
      });
    } catch (error) {
      logger.error('Failed to export group data:', error);
      toast({
        title: t('teacher.group.error'),
        description: t('teacher.group.exportFailed'),
        variant: 'destructive',
      });
    }
  };

  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const allSelected = selectedStudents.size === filteredStudents.length && filteredStudents.length > 0;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(filteredStudents.map((s) => s.id)));
    }
  };

  const toggleSelectStudent = (studentId: string) => {
    const newSelected = new Set(selectedStudents);
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId);
    } else {
      newSelected.add(studentId);
    }
    setSelectedStudents(newSelected);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold">{t('groups.title', { default: 'Group Management' })}</h2>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {t('groups.create', { default: 'Create Group' })}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('groups.createTitle', { default: 'Creating Group' })}</DialogTitle>
                <DialogDescription>
                  {t('groups.createDesc', { default: 'Create a new group to manage students' })}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t('groups.name', { default: 'Name' })}</Label>
                  <Input
                    id="name"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder={t('groups.namePlaceholder', { default: 'For example: CS-2024' })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">{t('groups.description', { default: 'Description' })}</Label>
                  <Input
                    id="description"
                    value={newGroupDescription}
                    onChange={(e) => setNewGroupDescription(e.target.value)}
                    placeholder={t('groups.descPlaceholder', { default: 'Group description' })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  {t('common.cancel', { default: 'Cancel' })}
                </Button>
                <Button onClick={handleCreateGroup}>{t('common.create', { default: 'Create' })}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Groups List */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {groups.map((group) => (
          <Card
            key={group.id}
            className={`cursor-pointer transition-all ${
              selectedGroup?.id === group.id
                ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800'
                : 'hover:border-blue-300'
            }`}
            onClick={() => setSelectedGroup(group)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-lg">{group.name}</CardTitle>
                </div>
                <Badge variant="outline">
                  {group.studentCount} {t('groups.students', { default: 'stud.' })}
                </Badge>
              </div>
              {group.description && <CardDescription className="line-clamp-2">{group.description}</CardDescription>}
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">{new Date(group.createdAt).toLocaleDateString()}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {groups.length === 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {t('groups.noGroups', { default: 'No groups. Create the first group to get started.' })}
          </AlertDescription>
        </Alert>
      )}

      {/* Selected Group Details */}
      {selectedGroup && (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5" />
                    {selectedGroup.name}
                  </CardTitle>
                  <CardDescription>
                    {selectedGroup.studentCount} {t('groups.enrolled', { default: 'students in group' })}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setIsAddStudentDialogOpen(true)}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    {t('groups.addStudents', { default: 'Add' })}
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleExportGroup}>
                    <Download className="h-4 w-4 mr-2" />
                    {t('groups.export', { default: 'Export' })}
                  </Button>
                  {selectedStudents.size > 0 && (
                    <Button variant="destructive" size="sm" onClick={handleBulkRemove}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      {t('groups.removeSelected', { default: `Remove ${selectedStudents.size}` })}
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Search and Filter */}
              <div className="flex items-center gap-2 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t('groups.search', { default: 'Search students...' })}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                      <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                    </button>
                  )}
                </div>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>

              {/* Students Table */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox checked={allSelected} onCheckedChange={toggleSelectAll} />
                    </TableHead>
                    <TableHead>{t('groups.student', { default: 'Student' })}</TableHead>
                    <TableHead>{t('groups.level', { default: 'Level' })}</TableHead>
                    <TableHead>{t('groups.progress', { default: 'Progress' })}</TableHead>
                    <TableHead>{t('groups.lastActive', { default: 'Last Seen' })}</TableHead>
                    <TableHead className="text-right">{t('common.actions', { default: 'Actions' })}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedStudents.has(student.id)}
                          onCheckedChange={() => toggleSelectStudent(student.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{student.name}</p>
                          <p className="text-sm text-muted-foreground">{student.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          {student.level}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 w-24">
                            <Progress
                              value={
                                (student.completedTasks / Math.max(1, student.completedTasks + student.totalAttempts)) *
                                100
                              }
                              className="h-2"
                            />
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {student.completedTasks} {t('groups.tasks', { default: 'ago' })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {student.lastActiveAt ? (
                          <span className="text-sm text-muted-foreground">
                            {new Date(student.lastActiveAt).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label="Actions">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Mail className="h-4 w-4 mr-2" />
                              {t('groups.email', { default: 'Message' })}
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              {t('groups.edit', { default: 'Edit' })}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleRemoveStudent(student.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              {t('groups.remove', { default: 'Delete' })}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {filteredStudents.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  <p>{t('groups.noStudents', { default: 'No students in group yet' })}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Add Students Dialog */}
      <Dialog open={isAddStudentDialogOpen} onOpenChange={setIsAddStudentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('groups.addStudentsTitle', { default: 'Add Students' })}</DialogTitle>
            <DialogDescription>
              {t('groups.addStudentsDesc', {
                default: 'Enter student email addresses (comma-separated or one per line)',
              })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="emails">{t('groups.emails', { default: 'Email Addresses' })}</Label>
              <textarea
                id="emails"
                value={studentEmails}
                onChange={(e) => setStudentEmails(e.target.value)}
                placeholder="student1@example.com&#10;student2@example.com"
                className="w-full min-h-32 p-3 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddStudentDialogOpen(false)}>
              {t('common.cancel', { default: 'Cancel' })}
            </Button>
            <Button onClick={handleAddStudents}>{t('groups.add', { default: 'Add' })}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
