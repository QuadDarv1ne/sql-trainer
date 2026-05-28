'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calendar, Award, Play, BookOpen, UserPlus, Search, Loader2 } from 'lucide-react';
import { t } from '@/lib/i18n';
import EmptyState from './empty-state';

interface TimelineEvent {
  event_type: string;
  event_label: string;
  timestamp: number;
  details?: string;
}

const eventIcons: Record<string, typeof Calendar> = {
  registration: UserPlus,
  first_task: Play,
  achievement: Award,
  category_started: BookOpen,
};

const eventColors: Record<string, string> = {
  registration: 'bg-blue-500',
  first_task: 'bg-emerald-500',
  achievement: 'bg-amber-500',
  category_started: 'bg-purple-500',
};

export default function AcademicTimeline() {
  const [userId, setUserId] = useState('');
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!userId.trim()) return;
    setLoading(true);
    setError('');
    setSearched(true);
    try {
      const response = await fetch(`/api/admin/analytics/academic-timeline?userId=${encodeURIComponent(userId.trim())}`);
      if (!response.ok) throw new Error('Failed to load');
      const data = await response.json();
      setTimeline(data.timeline || []);
    } catch {
      setError(t('analytics.error'));
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{t('analytics.timeline.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-6">
            <Input
              placeholder={t('analytics.timeline.placeholder')}
              value={userId}
              onChange={e => setUserId(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              className="max-w-sm"
            />
            <Button onClick={handleSearch} disabled={loading || !userId.trim()}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              {t('analytics.timeline.search')}
            </Button>
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          {!loading && searched && timeline.length === 0 && !error && (
            <EmptyState />
          )}

          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">{t('analytics.loading')}</span>
            </div>
          )}

          {timeline.length > 0 && (
            <div className="relative border-l-2 border-muted ml-4 space-y-6">
              {timeline.map((event) => {
                const Icon = eventIcons[event.event_type] || Calendar;
                const color = eventColors[event.event_type] || 'bg-gray-500';
                return (
                  <div key={`${event.event_type}-${event.timestamp}`} className="relative pl-8">
                    <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full ${color} border-2 border-background`} />
                    <div className="flex items-start gap-3">
                      <Icon className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <div className="font-medium">
                          {t(`analytics.timeline.events.${event.event_label}`, { default: event.details || event.event_label })}
                        </div>
                        {event.details && event.event_label !== event.details && (
                          <div className="text-sm text-muted-foreground">{event.details}</div>
                        )}
                        <div className="text-xs text-muted-foreground mt-1">
                          {formatDate(event.timestamp)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
