import React, { useState } from 'react';
import { Download, ChevronDown, FileSpreadsheet, FileText } from 'lucide-react';
import { exportService } from '../../../services/exportService';

interface ExportButtonProps {
  onExport?: (format: 'xlsx' | 'csv') => void;
  criteria?: any;
}

export default function ExportButton({ onExport, criteria }: ExportButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleExport(format: 'xlsx' | 'csv') {
    setOpen(false);
    if (onExport) {
      onExport(format);
      return;
    }
    setLoading(true);
    try {
      await exportService.exportIssues(criteria || {}, format);
    } catch (err) {
      // In mock prototype mode, alert
      alert(`Đang chuẩn bị xuất tệp ${format.toUpperCase()}...`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative inline-block">
      <button
        type="button"
        disabled={loading}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#E5E5E7] bg-white text-xs text-[#1A1A1A] hover:bg-[#F7F7F8] transition-colors"
      >
        <Download className="w-3.5 h-3.5 text-[#6B6B70]" />
        <span>Xuất dữ liệu</span>
        <ChevronDown className="w-3 h-3 text-[#9B9B9F]" />
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-40 bg-white border border-[#E5E5E7] rounded-lg shadow-lg z-30 py-1 overflow-hidden fade-in">
          <button
            type="button"
            onClick={() => handleExport('xlsx')}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left text-[#1A1A1A] hover:bg-[#F7F7F8]"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            Excel (.xlsx)
          </button>
          <button
            type="button"
            onClick={() => handleExport('csv')}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left text-[#1A1A1A] hover:bg-[#F7F7F8]"
          >
            <FileText className="w-3.5 h-3.5 text-blue-600" />
            CSV (.csv)
          </button>
        </div>
      )}
    </div>
  );
}
