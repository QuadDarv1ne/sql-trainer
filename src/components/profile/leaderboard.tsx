'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useSession } from 'next-auth/react';
import { Loader2, Trophy, Medal, Star } from 'lucide-react';
import { logger } from '@/lib/logger';

interface LeaderboardEntry {
  user_id: string;
  name: string;
  tasks_completed: number;
  total_attempts: number;
}

export default function LeaderboardTable() {
  const { data: session } = useSession();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/user/leaderboard')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then((data) => {
        if (data.success) setLeaderboard(data.leaderboard);
      })
      .catch((e) => logger.error('Failed to fetch leaderboard', e))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Trophy className="h-12 w-12 text-muted-foreground/40 mb-3" />
          <p className="text-sm font-medium text-muted-foreground">Рейтинг пуст</p>
        </CardContent>
      </Card>
    );
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy className="h-4 w-4 text-yellow-500 dark:text-yellow-400" />;
      case 2: return <Medal className="h-4 w-4 text-gray-400" />;
      case 3: return <Medal className="h-4 w-4 text-amber-600 dark:text-amber-400" />;
      default: return <span className="text-xs font-mono text-muted-foreground w-4 text-center">{rank}</span>;
    }
  };

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-10 text-center">#</TableHead>
              <TableHead>Имя</TableHead>
              <TableHead className="text-right">Заданий</TableHead>
              <TableHead className="text-right">Попыток</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leaderboard.map((entry, idx) => {
              const rank = idx + 1;
              const isCurrentUser = entry.user_id === session?.user?.id;
              return (
                <TableRow
                  key={entry.user_id}
                  className={isCurrentUser ? 'bg-emerald-50 dark:bg-emerald-950/20' : ''}
                >
                  <TableCell className="text-center">
                    {getRankIcon(rank)}
                  </TableCell>
                  <TableCell className="font-medium">
                    {entry.name}
                    {isCurrentUser && <Badge variant="secondary" className="ml-2 text-[10px]">Вы</Badge>}
                  </TableCell>
                  <TableCell className="text-right">
                    {entry.tasks_completed}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {entry.total_attempts}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
