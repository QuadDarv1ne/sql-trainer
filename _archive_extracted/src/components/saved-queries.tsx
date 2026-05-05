'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Bookmark, Trash2, Save, Clock, Tag } from 'lucide-react';
import { useSQLTrainerStore } from '@/lib/store';
import { useState, useRef } from 'react';
import type { SavedQuery } from '@/lib/store';

interface SavedQueriesProps {
  onLoadQuery?: (sql: string) => void;
}

export default function SavedQueries({ onLoadQuery }: SavedQueriesProps) {
  const { savedQueries, saveQuery, deleteSavedQuery, editorContent } = useSQLTrainerStore();
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [queryName, setQueryName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    if (!editorContent.trim() || !queryName.trim()) return;
    saveQuery({
      name: queryName.trim(),
      sql: editorContent.trim(),
      taskId: undefined,
    });
    setQueryName('');
    setSaveDialogOpen(false);
  };

  const handleLoad = (query: SavedQuery) => {
    onLoadQuery?.(query.sql);
  };

  return (
    <>
      <Dialog open={saveDialogOpen} onOpenChange={(open) => {
        setSaveDialogOpen(open);
        if (open) {
          setQueryName('');
        }
      }}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5">
              <Bookmark className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Сохранённые</span>
              {savedQueries.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 h-4 min-w-4 flex items-center justify-center">
                  {savedQueries.length}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <div className="px-2 py-1.5">
              <p className="text-xs font-medium text-muted-foreground">Сохранённые запросы</p>
            </div>
            <DropdownMenuSeparator />
            {savedQueries.length === 0 ? (
              <div className="px-2 py-4 text-center">
                <Bookmark className="mx-auto h-5 w-5 text-muted-foreground/30 mb-1" />
                <p className="text-xs text-muted-foreground">Нет сохранённых запросов</p>
              </div>
            ) : (
              <ScrollArea className="max-h-64">
                {savedQueries.map((query) => (
                  <DropdownMenuItem
                    key={query.id}
                    className="flex items-start gap-2 px-3 py-2 cursor-pointer"
                    onClick={() => handleLoad(query)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-medium truncate">{query.name}</span>
                        {query.taskId && (
                          <Tag className="h-2.5 w-2.5 shrink-0 text-emerald-500" />
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Clock className="h-2.5 w-2.5 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(query.createdAt).toLocaleDateString('ru-RU')}
                        </span>
                        <code className="text-[10px] text-muted-foreground/60 truncate ml-1">
                          {query.sql.slice(0, 40)}{query.sql.length > 40 ? '...' : ''}
                        </code>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSavedQuery(query.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </DropdownMenuItem>
                ))}
              </ScrollArea>
            )}
            <DropdownMenuSeparator />
            <DialogTrigger asChild>
              <DropdownMenuItem
                className="text-emerald-600 dark:text-emerald-400 cursor-pointer"
                onSelect={(e) => e.preventDefault()}
                disabled={!editorContent.trim()}
              >
                <Save className="mr-2 h-3.5 w-3.5" />
                Сохранить текущий запрос
              </DropdownMenuItem>
            </DialogTrigger>
          </DropdownMenuContent>
        </DropdownMenu>

        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Сохранить запрос</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Название</label>
              <Input
                ref={inputRef}
                value={queryName}
                onChange={(e) => setQueryName(e.target.value)}
                placeholder="Например: Сотрудники с высокой зарплатой"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave();
                }}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">SQL</label>
              <pre className="max-h-32 overflow-auto rounded-md bg-muted p-3 text-xs font-mono">
                {editorContent.slice(0, 200)}
                {editorContent.length > 200 ? '...' : ''}
              </pre>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Отмена</Button>
            </DialogClose>
            <Button
              onClick={handleSave}
              disabled={!queryName.trim() || !editorContent.trim()}
              className="bg-emerald-600 text-white hover:bg-emerald-700"
            >
              <Save className="mr-2 h-4 w-4" />
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
