'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollText, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { t } from '@/lib/i18n';

interface AuditEntry {
  id: string;
  actor_id: string;
  actor_name: string;
  action: string;
  target_type: string;
  target_id: string | null;
  details: string | null;
  created_at: number;
}

export default function AuditLog() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [limit, setLimit] = useState(50);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/audit?limit=${limit}&offset=0`);
      if (!res.ok) throw new Error('Failed to load audit log');
      const data = await res.json();
      setLogs(data.logs);
    } catch {
      setError('Failed to load audit log');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const getActionLabel = (action: string) => {
    const key = `admin.audit.actions.${action}`;
    const translated = t(key);
    return translated === key ? action : translated;
  };

  if (loading) return <p className="text-center py-8">{t('admin.users.loading')}</p>;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ScrollText className="h-5 w-5" />
            {t('admin.audit.title')}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setLimit(l => l === 50 ? 100 : 50)}>
              {limit} {t('admin.audit.entries')}
            </Button>
            <Button size="sm" variant="outline" onClick={fetchLogs}>{t('admin.audit.refresh')}</Button>
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
        {logs.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">{t('admin.audit.noEntries')}</p>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('admin.audit.time')}</TableHead>
                  <TableHead>{t('admin.audit.actor')}</TableHead>
                  <TableHead>{t('admin.audit.action')}</TableHead>
                  <TableHead>{t('admin.audit.target')}</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <React.Fragment key={log.id}>
                    <TableRow>
                      <TableCell className="text-sm text-muted-foreground">{new Date(log.created_at).toLocaleString()}</TableCell>
                      <TableCell className="font-medium">{log.actor_name}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          {getActionLabel(log.action)}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">{log.target_type}{log.target_id ? `: ${log.target_id.slice(0, 8)}...` : ''}</TableCell>
                      <TableCell>
                        {log.details && (
                          <Button variant="ghost" size="sm" onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}>
                            {expandedId === log.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                    {expandedId === log.id && log.details && (
                      <TableRow>
                        <TableCell colSpan={5} className="bg-muted">
                          <pre className="text-xs p-2 overflow-x-auto">{JSON.stringify(JSON.parse(log.details), null, 2)}</pre>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
