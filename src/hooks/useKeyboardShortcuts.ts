import { useEffect } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  action: () => void;
  description: string;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[], enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrl ? event.ctrlKey || event.metaKey : true;
        const altMatch = shortcut.alt ? event.altKey : !event.altKey;
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();

        if (ctrlMatch && altMatch && shiftMatch && keyMatch) {
          event.preventDefault();
          shortcut.action();
          break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, enabled]);
}

// Common keyboard shortcuts for admin pages
export const commonAdminShortcuts: KeyboardShortcut[] = [
  {
    key: 'n',
    ctrl: true,
    action: () => {
      // Create new booking - to be implemented per page
      console.log('Create new booking');
    },
    description: 'Create new booking (Ctrl+N)',
  },
  {
    key: 's',
    ctrl: true,
    action: () => {
      // Save - to be implemented per page
      console.log('Save');
    },
    description: 'Save (Ctrl+S)',
  },
  {
    key: 'f',
    ctrl: true,
    action: () => {
      // Focus search
      const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
      if (searchInput) searchInput.focus();
    },
    description: 'Focus search (Ctrl+F)',
  },
  {
    key: 'Escape',
    action: () => {
      // Close modals/dialogs
      const closeButtons = document.querySelectorAll('[data-dialog-close]');
      if (closeButtons.length > 0) {
        (closeButtons[0] as HTMLButtonElement).click();
      }
    },
    description: 'Close dialog (Escape)',
  },
];
