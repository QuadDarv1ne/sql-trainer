'use client';

import { useSession, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Loader2,
  User,
  Mail,
  Phone,
  Save,
  Lock,
  Eye,
  EyeOff,
  Trash2,
  AlertTriangle,
  Shield,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Bookmark,
  Copy,
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

function getPasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
  requirements: { met: boolean; text: string }[];
} {
  const requirements = [
    { met: password.length >= 6, text: t('profile.req.minChars') },
    { met: /[A-Z]/.test(password), text: t('profile.req.uppercase') },
    { met: /[a-z]/.test(password), text: t('profile.req.lowercase') },
    { met: /\d/.test(password), text: t('profile.req.digit') },
    { met: /[^A-Za-z0-9]/.test(password), text: t('profile.req.special') },
  ];

  const metCount = requirements.filter((r) => r.met).length;
  const score = Math.round((metCount / requirements.length) * 100);

  let label = t('profile.strength.weak');
  let color = 'text-red-500';
  if (score >= 80) {
    label = t('profile.strength.strong');
    color = 'text-emerald-500';
  } else if (score >= 60) {
    label = t('profile.strength.fair');
    color = 'text-yellow-500';
  } else if (score >= 40) {
    label = t('profile.strength.weak');
    color = 'text-orange-500';
  }

  return { score, label, color, requirements };
}

function SavedQueriesSection() {
  const { savedQueries, deleteSavedQuery, resetAllProgress, undoReset } = useSQLTrainerStore();

  const copyToClipboard = (sql: string) => {
    navigator.clipboard
      .writeText(sql)
      .then(() => {
        toast.success(t('profile.sqlCopied'));
      })
      .catch(() => {
        toast.error(t('profile.copyFailed'));
      });
  };

  const handleResetAll = () => {
    resetAllProgress();
    toast.success(t('profile.resetSuccess'), {
      description: t('profile.resetUndoDesc', { default: 'Прогресс сброшен. Можно отменить в течение 30 секунд.' }),
      action: {
        label: t('profile.resetUndo', { default: 'Отменить' }),
        onClick: () => {
          undoReset();
          toast.success(t('profile.resetUndone', { default: 'Прогресс восстановлен' }));
        },
      },
      duration: 30000,
    });
  };

  if (savedQueries.length === 0) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <Bookmark className="h-12 w-12 text-muted-foreground/30" />
            <h3 className="text-lg font-semibold">{t('profile.savedEmpty')}</h3>
            <p className="text-sm text-muted-foreground">{t('profile.savedEmptyDesc')}</p>
          </CardContent>
        </Card>
        <ResetProgressCard onReset={handleResetAll} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {savedQueries.map((query: import('@/lib/store').SavedQuery) => (
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
                <pre className="mt-2 max-h-24 overflow-auto rounded-md bg-muted p-3 text-xs font-mono">{query.sql}</pre>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => copyToClipboard(query.sql)}
                  title={t('profile.copySql')}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                  onClick={() => deleteSavedQuery(query.id)}
                  title={t('profile.delete')}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      <ResetProgressCard onReset={handleResetAll} />
    </div>
  );
}

function ResetProgressCard({ onReset }: { onReset: () => void }) {
  return (
    <Card className="border-orange-200 dark:border-orange-900">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2 text-orange-600">
          <RotateCcw className="h-5 w-5" />
          {t('profile.resetProgress')}
        </CardTitle>
        <CardDescription>{t('profile.resetProgressDesc')}</CardDescription>
      </CardHeader>
      <CardFooter>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              className="text-orange-600 border-orange-300 hover:bg-orange-50 dark:hover:bg-orange-950"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              {t('profile.resetButton')}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('profile.resetConfirmTitle')}</AlertDialogTitle>
              <AlertDialogDescription>{t('profile.resetConfirmDesc')}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('profile.cancel')}</AlertDialogCancel>
              <AlertDialogAction onClick={onReset} className="bg-orange-600 hover:bg-orange-700">
                {t('profile.resetAction')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const { update } = useSession();
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
    const controller = new AbortController();
    fetch('/api/user/profile', { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!controller.signal.aborted && data.success) {
          setProfile(data.user);
          setEditName(data.user.name);
          setEditPhone(data.user.phone || '');
          setNewEmail(data.user.email);
        }
      })
      .catch((err) => {
        if (err.name !== 'AbortError') toast.error(t('profile.loadError'));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
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
        toast.success(t('profile.profileUpdated'));
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error(t('profile.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error(t('profile.passwordsNoMatchToast'));
      return;
    }
    if (newPassword.length < 8) {
      toast.error(t('profile.passwordTooShort'));
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
        toast.success(t('profile.passwordChanged'));
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error(t('profile.passwordChangeError'));
    } finally {
      setChangingPassword(false);
    }
  };

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !emailPassword) {
      toast.error(t('profile.fillAllFields'));
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
        toast.success(t('profile.emailChanged'));
        setProfile((prev) => (prev ? { ...prev, email: newEmail } : null));
        update({ email: newEmail });
        setEmailPassword('');
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error(t('profile.emailChangeError'));
    } finally {
      setChangingEmail(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      toast.error(t('profile.deleteConfirmPassword'));
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
        toast.success(t('profile.accountDeleted'));
        signOut({ redirect: false });
        router.push('/app');
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error(t('profile.deleteError'));
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
        <h2 className="text-lg font-semibold">{t('profile.pageError')}</h2>
        <p className="max-w-md text-sm text-muted-foreground">{t('profile.pageErrorDesc')}</p>
        <Button onClick={() => window.location.reload()}>
          <RotateCcw className="mr-2 h-4 w-4" />
          {t('profile.refreshPage')}
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
    <div className="h-full overflow-auto bg-gradient-to-b from-background to-muted/20">
      <div className="mx-auto max-w-5xl space-y-6 p-6">
        {/* Page Header */}
        <div className="mb-2">
          <h1 className="text-2xl font-bold tracking-tight">{t('profile.title', { default: 'Профиль' })}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t('profile.subtitle', { default: 'Управляйте своим профилем и отслеживайте прогресс' })}
          </p>
        </div>

        {/* Profile Header */}
        <Card className="border-border/80 shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-5">
                <Avatar className="h-20 w-20 ring-2 ring-emerald-600/20 ring-offset-2 ring-offset-background">
                  <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-emerald-700 text-white text-2xl font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold">{profile.name}</h2>
                  <p className="text-sm text-muted-foreground">{t('profile.memberSince', { date: createdDate })}</p>
                  <div className="flex items-center gap-2 pt-1">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{profile.email}</span>
                  </div>
                  {profile.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{profile.phone}</span>
                    </div>
                  )}
                </div>
              </div>
              {!editMode ? (
                <Button variant="outline" size="sm" className="shrink-0" onClick={() => setEditMode(true)}>
                  <User className="mr-2 h-4 w-4" />
                  {t('profile.edit')}
                </Button>
              ) : (
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditMode(false);
                      setEditName(profile.name);
                      setEditPhone(profile.phone || '');
                    }}
                  >
                    {t('profile.cancel')}
                  </Button>
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />}
                    {t('profile.save')}
                  </Button>
                </div>
              )}
            </div>

            {editMode && (
              <div className="mt-6 grid gap-4 sm:grid-cols-2 border-t border-border/50 pt-5">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">{t('profile.name')}</Label>
                  <Input id="edit-name" value={editName} onChange={(e) => setEditName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-phone">{t('profile.phone')}</Label>
                  <Input
                    id="edit-phone"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder={t('profile.phonePlaceholder')}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabs: Progress, Achievements, Leaderboard, Security */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-5 max-w-2xl">
            <TabsTrigger value="progress">{t('profile.tabs.progress')}</TabsTrigger>
            <TabsTrigger value="achievements">{t('profile.tabs.achievements')}</TabsTrigger>
            <TabsTrigger value="leaderboard">{t('profile.tabs.leaderboard')}</TabsTrigger>
            <TabsTrigger value="saved">{t('profile.tabs.saved')}</TabsTrigger>
            <TabsTrigger value="security">{t('profile.tabs.security')}</TabsTrigger>
          </TabsList>
          <TabsContent value="progress" className="space-y-4">
            <ProgressStats />
          </TabsContent>
          <TabsContent value="achievements" className="space-y-4">
            <AchievementsGrid />
          </TabsContent>
          <TabsContent value="leaderboard" className="space-y-4">
            <LeaderboardTable />
          </TabsContent>
          <TabsContent value="saved" className="space-y-4">
            <SavedQueriesSection />
          </TabsContent>
          <TabsContent value="security" className="space-y-6">
            <div className="space-y-6">
              {/* Change Password */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    {t('profile.changePassword')}
                  </CardTitle>
                  <CardDescription>{t('profile.changePasswordDesc')}</CardDescription>
                </CardHeader>
                <form onSubmit={handleChangePassword}>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="current-password">{t('profile.currentPassword')}</Label>
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
                      <Label htmlFor="new-password">{t('profile.newPassword')}</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="new-password"
                          type={showNewPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="pl-10 pr-10"
                          required
                          minLength={8}
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
                            <span className="text-muted-foreground">{t('profile.passwordStrength')}</span>
                            <span className={`font-medium ${passwordStrength.color}`}>{passwordStrength.label}</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full transition-all duration-300 rounded-full"
                              style={{
                                width: `${passwordStrength.score}%`,
                                backgroundColor:
                                  passwordStrength.score >= 80
                                    ? '#10b981'
                                    : passwordStrength.score >= 60
                                      ? '#eab308'
                                      : '#ef4444',
                              }}
                            />
                          </div>
                          <ul className="grid grid-cols-2 gap-1 text-xs">
                            {passwordStrength.requirements.map((req, i) => (
                              <li
                                key={i}
                                className={`flex items-center gap-1 ${req.met ? 'text-emerald-600' : 'text-muted-foreground'}`}
                              >
                                {req.met ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                                {req.text}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">{t('profile.confirmPassword')}</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="confirm-password"
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="pl-10 pr-10"
                          required
                          minLength={8}
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
                          {t('profile.passwordsNoMatch')}
                        </p>
                      )}
                      {confirmPassword && newPassword === confirmPassword && (
                        <p className="text-xs text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          {t('profile.passwordsMatch')}
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
                      {changingPassword ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Shield className="mr-2 h-4 w-4" />
                      )}
                      {t('profile.changePasswordBtn')}
                    </Button>
                  </CardFooter>
                </form>
              </Card>

              {/* Change Email */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    {t('profile.changeEmail')}
                  </CardTitle>
                  <CardDescription>{t('profile.changeEmailDesc')}</CardDescription>
                </CardHeader>
                <form onSubmit={handleChangeEmail}>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-email">{t('profile.newEmail')}</Label>
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
                      <Label htmlFor="email-password">{t('profile.emailPassword')}</Label>
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
                      {changingEmail ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Mail className="mr-2 h-4 w-4" />
                      )}
                      {t('profile.changeEmailBtn')}
                    </Button>
                  </CardFooter>
                </form>
              </Card>

              {/* Delete Account */}
              <Card className="border-red-200 dark:border-red-900">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-red-600">
                    <AlertTriangle className="h-5 w-5" />
                    {t('profile.deleteAccount')}
                  </CardTitle>
                  <CardDescription>{t('profile.deleteAccountDesc')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="delete-password">{t('profile.deletePassword')}</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="delete-password"
                        type={showDeletePassword ? 'text' : 'password'}
                        value={deletePassword}
                        onChange={(e) => setDeletePassword(e.target.value)}
                        className="pl-10 pr-10"
                        placeholder={t('profile.deletePasswordPlaceholder')}
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
                        {t('profile.deleteAccountBtn')}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t('profile.resetConfirmTitle')}</AlertDialogTitle>
                        <AlertDialogDescription>{t('profile.deleteConfirmDesc')}</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t('profile.cancel')}</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDeleteAccount}
                          className="bg-red-600 hover:bg-red-700"
                          disabled={deletingAccount}
                        >
                          {deletingAccount ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                          {t('profile.deleteForever')}
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
