import React from 'react';
import { Paperclip, Download, Trash2 } from 'lucide-react';

interface AttachmentListProps {
  attachments: string[];
  canDelete?: boolean;
  onDownload?: (filename: string) => void;
  onDelete?: (filename: string) => void;
}

export default function AttachmentList({
  attachments,
  canDelete = false,
  onDownload,
  onDelete,
}: AttachmentListProps) {
  if (!attachments || attachments.length === 0) return null;

  return (
    <div className="space-y-1.5">
      {attachments.map((file) => (
        <div
          key={file}
          className="flex items-center justify-between px-3 py-2 bg-[#F7F7F8] border border-[#E5E5E7] rounded-lg text-xs hover:border-[#C5C5C8] transition-colors"
        >
          <div className="flex items-center gap-2 truncate">
            <Paperclip className="w-3.5 h-3.5 text-[#6B6B70] shrink-0" />
            <span className="truncate text-[#1A1A1A]">{file}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {onDownload && (
              <button
                type="button"
                onClick={() => onDownload(file)}
                className="text-[#6B6B70] hover:text-[#1A1A1A]"
                title="Tải xuống"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            )}
            {canDelete && onDelete && (
              <button
                type="button"
                onClick={() => onDelete(file)}
                className="text-[#6B6B70] hover:text-[#E53E3E]"
                title="Xóa tệp"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
