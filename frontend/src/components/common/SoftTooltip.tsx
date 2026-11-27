import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface SoftTooltipProps {
  label: string;
  children: React.ReactNode;
}

interface TooltipCoords {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
  centered?: boolean;
}

/**
 * Lightweight portal tooltip rendered in soft neutral gray so it never gets
 * clipped by scrollable table containers or styled with harsh OS dark boxes.
 */
export default function SoftTooltip({ label, children }: SoftTooltipProps) {
  const triggerRef = useRef<HTMLSpanElement | null>(null);
  const [coords, setCoords] = useState<TooltipCoords | null>(null);

  function showTooltip() {
    if (!triggerRef.current || !label) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const showAbove = spaceBelow < 44;
    const nearRightEdge = window.innerWidth - rect.right < 90;

    const next: TooltipCoords = {};
    if (showAbove) {
      next.bottom = window.innerHeight - rect.top + 6;
    } else {
      next.top = rect.bottom + 6;
    }

    if (nearRightEdge) {
      next.right = Math.max(8, window.innerWidth - rect.right);
    } else {
      next.left = rect.left + rect.width / 2;
      next.centered = true;
    }

    setCoords(next);
  }

  function hideTooltip() {
    setCoords(null);
  }

  return (
    <span
      ref={triggerRef}
      className="inline-flex"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      {coords &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            role="tooltip"
            style={{
              position: 'fixed',
              top: coords.top,
              bottom: coords.bottom,
              left: coords.left,
              right: coords.right,
              transform: coords.centered ? 'translateX(-50%)' : undefined,
            }}
            className="z-[9999] pointer-events-none px-2.5 py-1 rounded-md bg-[#F4F4F5] text-[#52525B] border border-[#E4E4E7] shadow-sm text-[11px] font-medium leading-tight whitespace-nowrap"
          >
            {label}
          </div>,
          document.body,
        )}
    </span>
  );
}
