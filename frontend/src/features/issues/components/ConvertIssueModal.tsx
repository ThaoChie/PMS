import React, { useState } from 'react';
import { X, GitFork, AlertCircle, Loader2 } from 'lucide-react';
import { issueService } from '../../../services/issueService';
import { toast } from '../../../store/toastStore';

interface ConvertIssueModalProps {
  issueKey: string;
  isSubtask: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ConvertIssueModal({
  issueKey,
  isSubtask,
  onClose,
  onSuccess,
}: ConvertIssueModalProps) {
  const [parentKey, setParentKey] = useState('');
  const [targetType, setTargetType] = useState('Task');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (isSubtask) {
        // Subtask -> Standalone issue
        await issueService.convertToIssue(issueKey, targetType);
        toast.success(`Đã chuyển ${issueKey} thành công việc độc lập (${targetType})`);
      } else {
        // Standalone issue -> Subtask
        const cleanParent = parentKey.trim().toUpperCase();
        if (!cleanParent) {
          setError('Vui lòng nhập mã công việc cha');
          setSubmitting(false);
          return;
        }
        if (cleanParent === issueKey.toUpperCase()) {
          setError('Không thể đặt công việc làm con của chính nó');
          setSubmitting(false);
          return;
        }
        await issueService.convertToSubtask(issueKey, cleanParent);
        toast.success(`Đã chuyển ${issueKey} thành công việc con của ${cleanParent}`);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Chuyển đổi công việc thất bại');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-[#E5E5E7] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E5E7] bg-[#FAFAFA]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700">
              <GitFork className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#1A1A1A]">
                {isSubtask ? 'Tách thành Công việc độc lập' : 'Chuyển thành Công việc con (Sub-task)'}
              </h3>
              <p className="text-[11px] text-[#6B6B70] font-mono">{issueKey}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#9B9B9F] hover:text-[#1A1A1A] p-1 rounded-md hover:bg-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-red-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {isSubtask ? (
            <div>
              <label className="block font-medium text-[#1A1A1A] mb-1.5">
                Chọn loại công việc mới sau khi tách:
              </label>
              <select
                value={targetType}
                onChange={(e) => setTargetType(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#E5E5E7] rounded-lg text-xs text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A]"
              >
                <option value="Task">Task (Công việc tiêu chuẩn)</option>
                <option value="Story">Story (Yêu cầu tính năng)</option>
                <option value="Bug">Bug (Lỗi phần mềm)</option>
              </select>
              <p className="text-[11px] text-[#6B6B70] mt-2">
                Công việc này sẽ không còn trực thuộc công việc cha hiện tại và xuất hiện trực tiếp trên bảng Kanban.
              </p>
            </div>
          ) : (
            <div>
              <label className="block font-medium text-[#1A1A1A] mb-1.5">
                Mã công việc cha (Parent Key) <span className="text-red-500">*</span>:
              </label>
              <input
                type="text"
                placeholder="Ví dụ: PROJ-1, EPMS-10"
                value={parentKey}
                onChange={(e) => setParentKey(e.target.value)}
                required
                className="w-full px-3 py-2 bg-white border border-[#E5E5E7] rounded-lg text-xs text-[#1A1A1A] uppercase focus:outline-none focus:border-[#1A1A1A]"
              />
              <p className="text-[11px] text-[#6B6B70] mt-2">
                Sau khi chuyển, công việc này sẽ trở thành Sub-task trực thuộc công việc cha bạn vừa nhập.
              </p>
            </div>
          )}

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E5E5E7]">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-3 py-1.5 border border-[#E5E5E7] rounded-lg text-xs text-[#6B6B70] hover:text-[#1A1A1A] hover:bg-[#F7F7F8] transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-1.5 bg-[#E53E3E] hover:bg-[#C53030] text-white text-xs font-medium rounded-lg disabled:opacity-50 flex items-center gap-1.5 shadow-sm transition-colors"
            >
              {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isSubtask ? 'Tách thành công việc' : 'Chuyển thành Subtask'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
