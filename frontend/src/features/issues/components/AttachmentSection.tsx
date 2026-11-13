import React, { useState, useRef } from 'react';
import { Paperclip, Upload, Trash2, Download, Eye, X, FileText, Image as ImageIcon, FileArchive, Loader2 } from 'lucide-react';
import { issueService } from '../../../services/issueService';
import { toast } from '../../../store/toastStore';
import { API_BASE_URL } from '../../../api/axiosClient';

export interface AttachmentItem {
  id: string | number;
  fileName: string;
  fileUrl?: string;
  fileSize?: number;
  contentType?: string;
  uploadedBy?: {
    id: string | number;
    name?: string;
    fullName?: string;
    email?: string;
  };
  createdAt?: string;
}

interface AttachmentSectionProps {
  issueKey: string;
  attachments: (AttachmentItem | string)[];
  canEdit?: boolean;
  onChanged?: () => void;
}

function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return '';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function getFileIcon(filename: string, contentType?: string) {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext) || contentType?.startsWith('image/')) {
    return <ImageIcon className="w-4 h-4 text-purple-600 shrink-0" />;
  }
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
    return <FileArchive className="w-4 h-4 text-amber-600 shrink-0" />;
  }
  return <FileText className="w-4 h-4 text-blue-600 shrink-0" />;
}

export function resolveAttachmentUrl(url?: string): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const base = API_BASE_URL.replace(/\/api\/?$/, '');
  if (url.startsWith('/api/')) return `${base}${url}`;
  if (url.startsWith('/')) return `${base}/api${url}`;
  return `${base}/api/attachments/files/${url}`;
}

export default function AttachmentSection({
  issueKey,
  attachments = [],
  canEdit = true,
  onChanged,
}: AttachmentSectionProps) {
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | number | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Normalize attachments to object list
  const normalizedList: AttachmentItem[] = attachments.map((att, idx) => {
    if (typeof att === 'string') {
      return { id: idx, fileName: att, fileUrl: att };
    }
    return {
      id: att.id || idx,
      fileName: att.fileName || (att as any).name || 'File',
      fileUrl: att.fileUrl || (att as any).url,
      fileSize: att.fileSize || (att as any).size,
      contentType: att.contentType,
      uploadedBy: att.uploadedBy,
      createdAt: att.createdAt,
    };
  });

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    let successCount = 0;
    try {
      for (let i = 0; i < files.length; i++) {
        await issueService.uploadAttachment(issueKey, files[i]);
        successCount++;
      }
      toast.success(`Đã tải lên ${successCount} tệp đính kèm`);
      onChanged?.();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Không thể tải lên tệp đính kèm');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleDelete(attachmentId: string | number) {
    setDeletingId(attachmentId);
    try {
      await issueService.deleteAttachment(issueKey, String(attachmentId));
      toast.success('Đã xóa tệp đính kèm');
      onChanged?.();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Không thể xóa tệp đính kèm');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Paperclip className="w-3.5 h-3.5 text-[#6B6B70]" />
          <h4 className="text-[10px] font-semibold text-[#9B9B9F] uppercase tracking-wider">
            Tệp đính kèm ({normalizedList.length})
          </h4>
        </div>

        {canEdit && (
          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              multiple
              className="hidden"
              id="attachment-file-input"
            />
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1 px-2.5 py-1 border border-[#E5E5E7] text-[10px] font-medium text-[#1A1A1A] rounded-lg hover:bg-[#F7F7F8] disabled:opacity-50 transition-colors"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin text-[#E53E3E]" />
                  <span>Đang tải lên…</span>
                </>
              ) : (
                <>
                  <Upload className="w-3 h-3 text-[#6B6B70]" />
                  <span>Tải tệp lên</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {normalizedList.length === 0 ? (
        <div className="border border-dashed border-[#E5E5E7] rounded-xl p-4 text-center bg-[#FAF9F6]">
          <p className="text-xs text-[#9B9B9F]">Chưa có tệp đính kèm nào</p>
          {canEdit && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-1 text-xs text-[#E53E3E] font-medium hover:underline inline-flex items-center gap-1"
            >
              <Upload className="w-3 h-3" /> Chọn tệp từ thiết bị
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-1.5">
          {normalizedList.map((att) => {
            const isImg =
              ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(
                att.fileName.split('.').pop()?.toLowerCase() || ''
              ) || att.contentType?.startsWith('image/');
            const directUrl = resolveAttachmentUrl(att.fileUrl);

            return (
              <div
                key={att.id}
                className="flex items-center justify-between px-3 py-2 bg-[#F7F7F8] border border-[#E5E5E7] rounded-lg text-xs hover:border-[#C5C5C8] transition-colors gap-2"
              >
                <div className="flex items-center gap-2 truncate min-w-0">
                  {getFileIcon(att.fileName, att.contentType)}
                  <span className="truncate text-[#1A1A1A] font-medium" title={att.fileName}>
                    {att.fileName}
                  </span>
                  {att.fileSize && (
                    <span className="text-[10px] text-[#9B9B9F] shrink-0">
                      ({formatBytes(att.fileSize)})
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Image preview button */}
                  {isImg && directUrl && (
                    <button
                      type="button"
                      onClick={() => setPreviewUrl(directUrl)}
                      className="text-[#6B6B70] hover:text-[#1A1A1A] p-1 rounded hover:bg-white transition-colors"
                      title="Xem trước ảnh"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Download button */}
                  {directUrl && (
                    <a
                      href={directUrl}
                      download={att.fileName}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#6B6B70] hover:text-[#1A1A1A] p-1 rounded hover:bg-white transition-colors"
                      title="Tải xuống"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                  )}

                  {/* Delete button */}
                  {canEdit && (
                    <button
                      type="button"
                      disabled={deletingId === att.id}
                      onClick={() => handleDelete(att.id)}
                      className="text-[#9B9B9F] hover:text-[#E53E3E] p-1 rounded hover:bg-white transition-colors disabled:opacity-50"
                      title="Xóa tệp đính kèm"
                    >
                      {deletingId === att.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-[#E53E3E]" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Image Preview Lightbox Modal */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-xs"
          onClick={() => setPreviewUrl(null)}
        >
          <div className="relative max-w-3xl max-h-[85vh] bg-white rounded-xl p-2 shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setPreviewUrl(null)}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/75 transition-colors z-10"
            >
              <X className="w-4 h-4" />
            </button>
            <img
              src={previewUrl}
              alt="Xem trước ảnh"
              className="max-h-[80vh] w-auto max-w-full rounded-lg object-contain mx-auto"
            />
          </div>
        </div>
      )}
    </div>
  );
}
