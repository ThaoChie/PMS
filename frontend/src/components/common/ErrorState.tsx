import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export default function ErrorState({
  title = 'Đã có lỗi xảy ra',
  message = 'Không thể tải dữ liệu. Vui lòng thử lại.',
  onRetry,
  className = '',
}: ErrorStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center bg-white rounded-xl border border-[#FBD5D5] ${className}`}
    >
      <div className="w-10 h-10 rounded-full bg-[#FDECEC] flex items-center justify-center text-[#E53E3E] mb-3">
        <AlertCircle className="w-5 h-5" />
      </div>
      <h3 className="text-sm font-semibold text-[#1A1A1A]">{title}</h3>
      <p className="text-xs text-[#6B6B70] mt-1 max-w-sm">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 flex items-center gap-1.5 px-3 py-1.5 border border-[#E5E5E7] text-[#1A1A1A] text-xs font-medium rounded-lg hover:bg-[#F7F7F8] transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5 text-[#6B6B70]" />
          Thử lại
        </button>
      )}
    </div>
  );
}
