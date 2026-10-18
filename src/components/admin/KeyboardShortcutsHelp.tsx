'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Keyboard } from 'lucide-react';

interface Shortcut {
  keys: string[];
  description: string;
  category: string;
}

const shortcuts: Shortcut[] = [
  {
    keys: ['Ctrl', 'K'],
    description: 'فتح قائمة الأوامر السريعة',
    category: 'عام',
  },
  {
    keys: ['Ctrl', 'F'],
    description: 'التركيز على البحث',
    category: 'عام',
  },
  {
    keys: ['Ctrl', 'R'],
    description: 'تحديث القائمة',
    category: 'عام',
  },
  {
    keys: ['Ctrl', 'E'],
    description: 'تصدير البيانات',
    category: 'عام',
  },
  {
    keys: ['Escape'],
    description: 'إغلاق النوافذ المنبثقة',
    category: 'عام',
  },
  {
    keys: ['?'],
    description: 'عرض هذه المساعدة',
    category: 'عام',
  },
];

export function KeyboardShortcutsHelp() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        // Only trigger if not in an input field
        const target = e.target as HTMLElement;
        if (
          target.tagName !== 'INPUT' &&
          target.tagName !== 'TEXTAREA' &&
          !target.isContentEditable
        ) {
          e.preventDefault();
          setOpen(true);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, Shortcut[]>);

  return (
    <>
      {/* Floating help button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 left-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-brand-green text-white shadow-lg hover:bg-brand-green-dark transition-all hover:scale-110"
        title="اختصارات لوحة المفاتيح (?)"
      >
        <Keyboard className="h-5 w-5" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Keyboard className="h-5 w-5" />
              اختصارات لوحة المفاتيح
            </DialogTitle>
            <DialogDescription>
              استخدم هذه الاختصارات لتسريع العمل في لوحة الإدارة
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {Object.entries(groupedShortcuts).map(([category, items]) => (
              <div key={category}>
                <h3 className="text-sm font-semibold text-text-secondary mb-3">
                  {category}
                </h3>
                <div className="space-y-2">
                  {items.map((shortcut, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted transition-colors"
                    >
                      <span className="text-sm">{shortcut.description}</span>
                      <div className="flex gap-1">
                        {shortcut.keys.map((key, keyIndex) => (
                          <kbd
                            key={keyIndex}
                            className="inline-flex h-7 min-w-[28px] items-center justify-center rounded border border-border-default bg-muted px-2 font-mono text-xs font-medium"
                          >
                            {key}
                          </kbd>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t pt-4 text-center text-xs text-muted-foreground">
            <p>
              اضغط <kbd className="inline-flex h-5 items-center rounded border bg-muted px-1.5 font-mono text-[10px]">?</kbd>{' '}
              في أي وقت لعرض هذه المساعدة
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
