'use client';

import type * as React from 'react';
import { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';
import { Loader2, Mail, Lock, AlertCircle, CheckCircle2, KeyRound, Eye, EyeOff } from 'lucide-react';
import { t } from '@/lib/i18n';

type Step = 'request' | 'verify' | 'done';

function getPasswordStrength(password: string): { score: number; label: string; color: string; requirements: { met: boolean; text: string }[] } {
  const requirements = [
    { met: password.length >= 6, text: t('auth.passwordPlaceholder') },
    { met: /[A-Z]/.test(password), text: t('profile.req.uppercase') },
    { met: /[a-z]/.test(password), text: t('profile.req.lowercase') },
    { met: /\d/.test(password), text: t('profile.req.digit') },
    { met: /[^A-Za-z0-9]/.test(password), text: t('profile.req.special') },
  ];

  const metCount = requirements.filter(r => r.met).length;
  const score = Math.round((metCount / requirements.length) * 100);

  let label = t('auth.strength.weak');
  let colorClasses = { light: 'text-red-500', dark: 'dark:text-red-400' };
  if (score >= 80) { label = t('auth.strength.strong'); colorClasses = { light: 'text-emerald-500', dark: 'dark:text-emerald-400' }; }
  else if (score >= 60) { label = t('auth.strength.fair'); colorClasses = { light: 'text-yellow-500', dark: 'dark:text-yellow-400' }; }
  else if (score >= 40) { label = t('auth.strength.weak'); colorClasses = { light: 'text-orange-500', dark: 'dark:text-orange-400' }; }

  return { score, label, color: `${colorClasses.light} ${colorClasses.dark}`, requirements };
}

export default function ResetPasswordForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('request');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [devCode, setDevCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [codeSent, setCodeSent] = useState(false);
  const codeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (step === 'verify' && codeInputRef.current) {
      codeInputRef.current.focus();
    }
  }, [step]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const passwordStrength = useMemo(() => getPasswordStrength(newPassword), [newPassword]);

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!data.success) {
        setError(data.error);
        return;
      }

      if (data.devCode) {
        setDevCode(data.devCode);
      }
      setCodeSent(true);
      setCooldown(60);
      setStep('verify');
    } catch {
      setError(t('auth.registerError'));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError(t('auth.passwordsNoMatch'));
      return;
    }

    if (newPassword.length < 6) {
      setError(t('auth.passwordTooShort'));
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, newPassword }),
      });

      const data = await res.json();
      if (!data.success) {
        setError(data.error);
        return;
      }

      setStep('done');
    } catch {
      setError(t('auth.registerError'));
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (cooldown > 0) return;
    await handleRequestCode({ preventDefault: () => {} } as React.FormEvent);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">{t('auth.resetPassword')}</CardTitle>
        <CardDescription>
          {step === 'request' && t('auth.resetPasswordDesc')}
          {step === 'verify' && t('profile.changePasswordDesc')}
          {step === 'done' && t('auth.passwordChangeSuccess')}
        </CardDescription>
      </CardHeader>

      {step === 'request' && (
        <form onSubmit={handleRequestCode}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">{t('auth.email')}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {t('auth.sendCode')}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              <Link href="/login" className="text-blue-600 dark:text-blue-400 hover:underline">
                {t('auth.backToLogin')}
              </Link>
            </p>
          </CardFooter>
        </form>
      )}

      {step === 'verify' && (
        <form onSubmit={handleResetPassword}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {devCode && (
              <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
                <KeyRound className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <AlertDescription>
                  <span className="font-medium">{t('auth.resetCode')}</span>
                  <span className="block mt-1 font-mono text-lg">{devCode}</span>
                </AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="code">{t('auth.resetCode')}</Label>
                {codeSent && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 text-xs"
                    onClick={handleResendCode}
                    disabled={cooldown > 0}
                  >
                    {cooldown > 0 ? `${t('auth.sendCode')} ${cooldown}с` : t('auth.sendCode')}
                  </Button>
                )}
              </div>
              <Input
                ref={codeInputRef}
                id="code"
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                maxLength={6}
                required
                className="text-center text-lg tracking-widest font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">{t('auth.newPassword')}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('auth.passwordPlaceholder')}
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
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {newPassword && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{t('auth.passwordStrength')}</span>
                    <span className={`font-medium ${passwordStrength.color}`}>
                      {passwordStrength.label}
                    </span>
                  </div>
                  <Progress value={passwordStrength.score} className="h-1.5" />
                  <ul className="grid grid-cols-2 gap-1 text-xs">
                    {passwordStrength.requirements.map((req, i) => (
                      <li key={i} className={`flex items-center gap-1 ${req.met ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}>
                        {req.met ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                        {req.text}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t('auth.confirmPassword')}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder={t('auth.confirmPasswordPlaceholder')}
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
                <p className="text-xs text-red-500 dark:text-red-400 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {t('auth.passwordsNoMatchLive')}
                </p>
              )}
              {confirmPassword && newPassword === confirmPassword && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  {t('auth.passwordsMatch')}
                </p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading || newPassword !== confirmPassword}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {t('auth.changePasswordBtn')}
            </Button>
          </CardFooter>
        </form>
      )}

      {step === 'done' && (
        <CardContent className="flex flex-col items-center justify-center py-6">
          <CheckCircle2 className="h-12 w-12 text-emerald-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">{t('auth.passwordChangeSuccess')}</h3>
          <p className="text-sm text-muted-foreground text-center mb-4">
            {t('auth.loginDesc')}
          </p>
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => router.push('/login')}>
            {t('auth.loginLink')}
          </Button>
        </CardContent>
      )}
    </Card>
  );
}
