'use client';

import { t } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Search, Lightbulb } from 'lucide-react';

interface ExplainPanelProps {
  plan: string;
  suggestions: string[];
  onClose: () => void;
}

export default function ExplainPanel({ plan, suggestions, onClose }: ExplainPanelProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-blue-500" />
          <span className="text-sm font-medium">{t('action.explain')}</span>
        </div>
        <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={onClose}>
          {t('action.close')}
        </Button>
      </div>
      <div className="flex-1 overflow-auto p-4">
        <pre className="whitespace-pre-wrap break-words rounded-md bg-muted/50 p-3 text-xs font-mono">{plan}</pre>
        {suggestions.length > 0 && (
          <div className="mt-4 space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-1.5">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              {t('explain.suggestionsTitle', { default: 'Рекомендации по оптимизации' })}
            </h4>
            <ul className="space-y-1.5">
              {suggestions.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-amber-500" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
