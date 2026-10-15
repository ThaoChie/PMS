import { useEffect } from 'react';

interface HotkeyOptions {
  key: string;
  ctrlOrMeta?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
}

export function useHotkey(
  options: HotkeyOptions,
  callback: (e: KeyboardEvent) => void,
  enabled: boolean = true,
) {
  useEffect(() => {
    if (!enabled) return;

    function handler(e: KeyboardEvent) {
      if (e.key.toLowerCase() !== options.key.toLowerCase()) return;

      if (options.ctrlOrMeta && !(e.ctrlKey || e.metaKey)) return;
      if (options.altKey && !e.altKey) return;
      if (options.shiftKey && !e.shiftKey) return;

      // Don't trigger if user is typing in input/textarea unless explicitly allowed
      const target = e.target as HTMLElement;
      if (
        !options.ctrlOrMeta &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      ) {
        return;
      }

      e.preventDefault();
      callback(e);
    }

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [options, callback, enabled]);
}
