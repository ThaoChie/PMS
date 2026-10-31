import React, { useState } from 'react';
import { Download, ChevronDown, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { exportService } from '../../../services/exportService';
import { toast } from '../../../store/toastStore';
import { downloadBlob } from '../../../utils/download';

interface ExportButtonProps {
  onExport?: (format: 'xlsx' | 'csv') => void;
  criteria?: any;
  issues?: any[];
  projectId?: string | number;
}

export default function ExportButton({ onExport, criteria, issues, projectId }: ExportButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  function exportFallbackCsv() {
    if (!issues || issues.length === 0) return false;
    try {
      const headers = ['Mã', 'Tiêu đề', 'Loại', 'Trạng thái', 'Người thực hiện', 'Người báo cáo', 'Độ ưu tiên', 'Hạn chót'];
      const rows = issues.map((i) => [
        i.key || i.issueKey || '',
        `"${(i.summary || '').replace(/"/g, '""')}"`,
        i.type || '',
        i.status?.name || i.status || '',
        i.assignee?.fullName || i.assignee?.name || i.assignee?.email || 'Chưa giao',
        i.reporter?.fullName || i.reporter?.name || i.reporter?.email || '',
        i.priority || '',
        i.dueDate || '',
      ]);
      const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const filename = `issues-export-${new Date().toISOString().slice(0, 10)}.csv`;
      downloadBlob(blob, filename);
      toast.success('Xuất tệp CSV thành công!');
      return true;
    } catch {
      return false;
    }
  }

  async function handleExport(format: 'xlsx' | 'csv') {
    setOpen(false);
    if (onExport) {
      onExport(format);
      return;
    }
    setLoading(true);
    try {
      const exportCriteria = {
        ...(criteria || {}),
        ...(projectId ? { projectIds: [Number(projectId)] } : {}),
      };

      await exportService.exportIssues(exportCriteria, format);
      toast.success(`Xuất dữ liệu ${format.toUpperCase()} thành công!`);
    } catch (err: any) {
      console.error('Export error:', err);

      let errorMessage = `Lỗi khi xuất tệp ${format.toUpperCase()}`;
      try {
        let blobToRead: Blob | null = null;
        if (err instanceof Blob) {
          blobToRead = err;
        } else if (err?.response?.data instanceof Blob) {
          blobToRead = err.response.data;
        }

        if (blobToRead) {
          const text = await blobToRead.text();
          const parsed = JSON.parse(text);
          if (parsed?.message) {
            errorMessage = parsed.message;
          }
        } else if (err?.message) {
          errorMessage = err.message;
        }
      } catch {
        if (err?.message) errorMessage = err.message;
      }

      // If format is CSV and issues array exists, attempt fallback
      if (format === 'csv' && issues && issues.length > 0) {
        const ok = exportFallbackCsv();
        if (ok) return;
      }

      toast.error(errorMessage, 'Lỗi xuất tệp');
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
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#E5E5E7] bg-white text-xs text-[#1A1A1A] hover:bg-[#F7F7F8] transition-colors disabled:opacity-60"
      >
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 text-[#6B6B70] animate-spin" />
        ) : (
          <Download className="w-3.5 h-3.5 text-[#6B6B70]" />
        )}
        <span>{loading ? 'Đang xuất…' : 'Xuất dữ liệu'}</span>
        <ChevronDown className="w-3 h-3 text-[#9B9B9F]" />
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-40 bg-white border border-[#E5E5E7] rounded-lg shadow-lg z-30 py-1 overflow-hidden fade-in">
          <button
            type="button"
            onClick={() => handleExport('xlsx')}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left text-[#1A1A1A] hover:bg-[#F7F7F8] transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            Excel (.xlsx)
          </button>
          <button
            type="button"
            onClick={() => handleExport('csv')}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left text-[#1A1A1A] hover:bg-[#F7F7F8] transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-blue-600" />
            CSV (.csv)
          </button>
        </div>
      )}
    </div>
  );
}
