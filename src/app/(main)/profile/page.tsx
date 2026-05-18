'use client';

import { useSession, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import {
  Loader2, User, Mail, Phone, Calendar, Save, Lock, Eye, EyeOff,
  Trash2, AlertTriangle, Shield, CheckCircle2, AlertCircle, RotateCcw,
  Bookmark, Copy,
} from 'lucide-react';
import ProgressStats from '@/components/profile/progress-stats';
import AchievementsGrid from '@/components/profile/achievements-grid';
import LeaderboardTable from '@/components/profile/leaderboard';
import { useSQLTrainerStore } from '@/lib/store';
import { t } from '@/lib/i18n';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  created_at: number;
}

function getPasswordStrength(password: string): { score: number; label: string; color: string; requirements: { met: boolean; text: string }[] } {
  const requirements = [
    { met: password.length >= 6, text: 'Минимум 6 символов' },
    { met: /[A-Z]/.test(password), text: 'Заглавная буква' },
    { met: /[a-z]/.test(password), text: 'Строчная буква' },
    { met: /\d/.test(password), text: 'Цифра' },
    { met: /[^A-Za-z0-9]/.test(password), text: 'Спецсимвол' },
  ];

  const metCount = requirements.filter(r => r.met).length;
  const score = Math.round((metCount / requirements.length) * 100);

  let label = 'Слабый';
  let color = 'text-red-500';
  if (score >= 80) { label = 'Надёжный'; color = 'text-emerald-500'; }
  else if (score >= 60) { label = 'Средний'; color = 'text-yellow-500'; }
  else if (score >= 40) { label = 'Слабый'; color = 'text-orange-500'; }

  return { score, label, color, requirements };
}

function SavedQueriesSection() {
  const { savedQueries, deleteSavedQuery } = useSQLTrainerStore();

  const copyToClipboard = (sql: string) => {
    navigator.clipboard.writeText(sql).then(() => {
      toast.success('SQL скопирован в буфер обмена');
    }).catch(() => {
      toast.error('Не удалось скопировать');
    });
  };

  if (savedQueries.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
          <Bookmark className="h-12 w-12 text-muted-foreground/30" />
          <h3 className="text-lg font-semibold">{t('savedQueries.empty')}</h3>
          <p className="text-sm text-muted-foreground">
            Сохраняйте запросы с главной страницы для быстрого доступа
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {savedQueries.map((query) => (
        <Card key={query.id}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Bookmark className="h-4 w-4 text-emerald-500" />
                  <h4 className="font-medium truncate">{query.title}</h4>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(query.createdAt).toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
                <pre className="mt-2 max-h-24 overflow-auto rounded-md bg-muted p-3 text-xs font-mono">
                  {query.sql}
                </pre>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => copyToClipboard(query.sql)}
                  title="Копировать SQL"
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                  onClick={() => deleteSavedQuery(query.id)}
                  title="Удалить"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const { data: session, update } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  // Initialize active tab from URL hash
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '');
      if (hash === 'security') return 'security';
    }
    return 'progress';
  });

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // Email change state
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [showEmailPassword, setShowEmailPassword] = useState(false);
  const [changingEmail, setChangingEmail] = useState(false);

  // Delete account state
  const [deletePassword, setDeletePassword] = useState('');
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  useEffect(() => {
    fetch('/api/user/profile')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setProfile(data.user);
          setEditName(data.user.name);
          setEditPhone(data.user.phone || '');
          setNewEmail(data.user.email);
        }
      })
      .catch(() => toast.error('Не удалось загрузить профиль'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName, phone: editPhone || null }),
      });
      const data = await res.json();
      if (data.success) {
        setProfile(data.user);
        setEditMode(false);
        update({ name: editName, phone: editPhone });
        toast.success('Профиль обновлён');
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error('Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Пароли не совпадают');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Пароль должен содержать минимум 6 символов');
      return;
    }

    setChangingPassword(true);
    try {
      const res = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Пароль успешно изменён');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error('Ошибка смены пароля');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !emailPassword) {
      toast.error('Заполните все поля');
      return;
    }

    setChangingEmail(true);
    try {
      const res = await fetch('/api/user/change-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newEmail, password: emailPassword }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Email успешно изменён');
        setProfile(prev => prev ? { ...prev, email: newEmail } : null);
        update({ email: newEmail });
        setEmailPassword('');
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error('Ошибка смены email');
    } finally {
      setChangingEmail(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      toast.error('Введите пароль для подтверждения');
      return;
    }

    setDeletingAccount(true);
    try {
      const res = await fetch('/api/user/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmPassword: deletePassword }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Аккаунт удалён');
        signOut({ redirect: false });
        router.push('/');
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error('Ошибка удаления аккаунта');
    } finally {
      setDeletingAccount(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h2 className="text-lg font-semibold">Не удалось загрузить профиль</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          Произошла ошибка при загрузке данных профиля. Попробуйте обновить страницу.
        </p>
        <Button onClick={() => window.location.reload()}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Обновить страницу
        </Button>
      </div>
    );
  }

  const initials = profile.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const createdDate = new Date(profile.created_at).toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const passwordStrength = getPasswordStrength(newPassword);

  return (
    <div className="h-full overflow-auto p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Profile Header */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-emerald-600 text-white text-xl">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-xl font-bold">{profile.name}</h2>
                  <p className="text-sm text-muted-foreground">Участник с {createdDate}</p>
                </div>
              </div>
              {!editMode ? (
                <Button variant="outline" size="sm" onClick={() => setEditMode(true)}>
                  <User className="mr-2 h-4 w-4" />
                  Редактировать
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => { setEditMode(false); setEditName(profile.name); setEditPhone(profile.phone || ''); }}>
                    Отмена
                  </Button>
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={handleSave} disabled={saving}>
                    {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />}
                    Сохранить
                  </Button>
                </div>
              )}
            </div>

            {editMode ? (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Имя</Label>
                  <Input id="edit-name" value={editName} onChange={(e) => setEditName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-phone">Телефон</Label>
                  <Input id="edit-phone" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="+7 (999) 123-45-67" />
                </div>
              </div>
            ) : (
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{profile.email}</span>
                </div>
                {profile.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{profile.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{createdDate}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabs: Progress, Achievements, Leaderboard, Security */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex-wrap">
            <TabsTrigger value="progress">Прогресс</TabsTrigger>
            <TabsTrigger value="achievements">Достижения</TabsTrigger>
            <TabsTrigger value="leaderboard">Рейтинг</TabsTrigger>
            <TabsTrigger value="saved">Запросы</TabsTrigger>
            <TabsTrigger value="security">Безопасность</TabsTrigger>
          </TabsList>
          <TabsContent value="progress">
            <ProgressStats />
          </TabsContent>
          <TabsContent value="achievements">
            <AchievementsGrid />
          </TabsContent>
          <TabsContent value="leaderboard">
            <LeaderboardTable />
          </TabsContent>
          <TabsContent value="saved">
            <SavedQueriesSection />
          </TabsContent>
          <TabsContent value="security">
            <div className="space-y-6">
              {/* Change Password */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    Смена пароля
                  </CardTitle>
                  <CardDescription>Введите текущий пароль и новый пароль для смены</CardDescription>
                </CardHeader>
                <form onSubmit={handleChangePassword}>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="current-password">Текущий пароль</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="current-password"
                          type={showCurrentPassword ? 'text' : 'password'}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="pl-10 pr-10"
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        >
                          {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-password">Новый пароль</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="new-password"
                          type={showNewPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="pl-10 pr-10"
                          required
                          minLength={6}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                        >
                          {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                      {newPassword && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Надёжность пароля</span>
                            <span className={`font-medium ${passwordStrength.color}`}>
                              {passwordStrength.label}
                            </span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full transition-all duration-300 rounded-full"
                              style={{
                                width: `${passwordStrength.score}%`,
                                backgroundColor: passwordStrength.score >= 80 ? '#10b981' : passwordStrength.score >= 60 ? '#eab308' : '#ef4444',
                              }}
                            />
                          </div>
                          <ul className="grid grid-cols-2 gap-1 text-xs">
                            {passwordStrength.requirements.map((req, i) => (
                              <li key={i} className={`flex items-center gap-1 ${req.met ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                                {req.met ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                                {req.text}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Подтверждение пароля</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="confirm-password"
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="pl-10 pr-10"
                          required
                          minLength={6}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                      {confirmPassword && newPassword !== confirmPassword && (
                        <p className="text-xs text-red-500 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Пароли не совпадают
                        </p>
                      )}
                      {confirmPassword && newPassword === confirmPassword && (
                        <p className="text-xs text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Пароли совпадают
                        </p>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button
                      type="submit"
                      className="bg-emerald-600 hover:bg-emerald-700"
                      disabled={changingPassword || newPassword !== confirmPassword || !currentPassword || !newPassword}
                    >
                      {changingPassword ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Shield className="mr-2 h-4 w-4" />}
                      Сменить пароль
                    </Button>
                  </CardFooter>
                </form>
              </Card>

              {/* Change Email */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Смена email
                  </CardTitle>
                  <CardDescription>Введите новый email и пароль для подтверждения</CardDescription>
                </CardHeader>
                <form onSubmit={handleChangeEmail}>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-email">Новый email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="new-email"
                          type="email"
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          className="pl-10"
                          placeholder="you@example.com"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email-password">Текущий пароль</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email-password"
                          type={showEmailPassword ? 'text' : 'password'}
                          value={emailPassword}
                          onChange={(e) => setEmailPassword(e.target.value)}
                          className="pl-10 pr-10"
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                          onClick={() => setShowEmailPassword(!showEmailPassword)}
                        >
                          {showEmailPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button
                      type="submit"
                      className="bg-emerald-600 hover:bg-emerald-700"
                      disabled={changingEmail || newEmail === profile.email || !emailPassword}
                    >
                      {changingEmail ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                      Сменить email
                    </Button>
                  </CardFooter>
                </form>
              </Card>

              {/* Delete Account */}
              <Card className="border-red-200 dark:border-red-900">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-red-600">
                    <AlertTriangle className="h-5 w-5" />
                    Удаление аккаунта
                  </CardTitle>
                  <CardDescription>
                    Это действие нельзя отменить. Все ваши данные, прогресс и достижения будут удалены навсегда.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="delete-password">Введите пароль для подтверждения</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="delete-password"
                        type={showDeletePassword ? 'text' : 'password'}
                        value={deletePassword}
                        onChange={(e) => setDeletePassword(e.target.value)}
                        className="pl-10 pr-10"
                        placeholder="Ваш текущий пароль"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                        onClick={() => setShowDeletePassword(!showDeletePassword)}
                      >
                        {showDeletePassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" disabled={!deletePassword}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Удалить аккаунт
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Это действие нельзя отменить. Ваш аккаунт, прогресс, достижения и все связанные данные будут удалены навсегда.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Отмена</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDeleteAccount}
                          className="bg-red-600 hover:bg-red-700"
                          disabled={deletingAccount}
                        >
                          {deletingAccount ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                          Удалить навсегда
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
