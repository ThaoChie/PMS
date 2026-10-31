import React from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useToastStore, ToastItem, ToastType } from '../../store/toastStore';

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />,
  error: <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />,
  warning: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />,
  info: <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />,
};

const BORDER_COLORS: Record<ToastType, string> = {
  success: 'border-emerald-200 bg-white/95',
  error: 'border-rose-200 bg-white/95',
  warning: 'border-amber-200 bg-white/95',
  info: 'border-blue-200 bg-white/95',
};

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-5 right-5 z-[99999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none"
    >
      {toasts.map((item: ToastItem) => (
        <div
          key={item.id}
          className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-lg backdrop-blur-sm transition-all duration-300 animate-slide-up ${BORDER_COLORS[item.type]}`}
          role="status"
        >
          {ICONS[item.type]}
          <div className="flex-1 min-w-0 pr-1">
            {item.title && (
              <h4 className="text-xs font-semibold text-[#1A1A1A] mb-0.5">{item.title}</h4>
            )}
            <p className="text-xs text-[#333333] leading-relaxed break-words">{item.message}</p>
          </div>
          <button
            type="button"
            onClick={() => removeToast(item.id)}
            className="text-[#9B9B9F] hover:text-[#1A1A1A] p-0.5 rounded transition-colors shrink-0"
            aria-label="Đóng thông báo"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
