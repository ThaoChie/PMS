import React, { useState } from 'react';
import { X, Plus, CheckCircle2, AlertCircle } from 'lucide-react';
import { projectService } from '../../../services/projectService';
import { useProjectStore, mapProjectResponseToProject } from '../../../store/projectStore';

interface CreateProjectModalProps {
  onClose: () => void;
  onSubmitSuccess?: () => void;
}

export default function CreateProjectModal({ onClose, onSubmitSuccess }: CreateProjectModalProps) {
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [description, setDescription] = useState('');
  const [memberEmails, setMemberEmails] = useState<string[]>(['']);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteResults, setInviteResults] = useState<Record<string, string> | null>(null);

  function autoKey(n: string) {
    return n.replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 6);
  }

  function handleNameChange(n: string) {
    setName(n);
    if (!key || key === autoKey(name)) setKey(autoKey(n));
  }

  function addEmail() {
    setMemberEmails((es) => [...es, '']);
  }

  function updateEmail(i: number, val: string) {
    setMemberEmails((es) => es.map((e, idx) => (idx === i ? val : e)));
  }

  function removeEmail(i: number) {
    setMemberEmails((es) => es.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !key.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const validEmails = memberEmails.map((e) => e.trim()).filter(Boolean);
      const res = await projectService.createProject({
        name: name.trim(),
        projectKey: key.trim().toUpperCase(),
        description: description.trim(),
        initialEmails: validEmails,
      });

      if (res?.data) {
        const createdProject = mapProjectResponseToProject(res.data);
        useProjectStore.getState().addProject(createdProject);

        if (res.data.inviteResults && Object.keys(res.data.inviteResults).length > 0) {
          setInviteResults(res.data.inviteResults);
          onSubmitSuccess?.();
        } else {
          onSubmitSuccess?.();
          onClose();
        }
      }
    } catch (err: any) {
      const code = err?.response?.data?.code;
      if (code === 'PROJECT_KEY_EXISTS' || err?.response?.status === 409) {
        setError('Mã dự án (key) đã tồn tại. Vui lòng chọn mã khác.');
      } else {
        setError(
          err?.response?.data?.message || err?.message || 'Không thể tạo dự án. Vui lòng thử lại.'
        );
      }
    } finally {
      setSaving(false);
    }
  }

  const inputCls =
    'w-full px-3 py-2.5 border border-[#E5E5E7] rounded-lg text-sm text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] transition-colors placeholder:text-[#9B9B9F]';

  return (
    <div
      className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 modal-backdrop px-4"
      onClick={onClose}
    >
      <div
        className="bg-white border border-[#E5E5E7] rounded-xl w-full max-w-md shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E5E7]">
          <h2 className="text-sm font-semibold text-[#1A1A1A]">Tạo dự án mới</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-[#9B9B9F] hover:text-[#1A1A1A] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {inviteResults ? (
          <div className="px-6 py-5 space-y-4">
            <div className="flex items-center gap-2 text-emerald-600 font-semibold text-sm">
              <CheckCircle2 className="w-5 h-5" />
              <span>Dự án đã được tạo thành công!</span>
            </div>
            <p className="text-xs text-[#6B6B70]">Kết quả gửi lời mời thành viên ban đầu:</p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {Object.entries(inviteResults).map(([email, status]) => (
                <div
                  key={email}
                  className="flex items-center justify-between p-2.5 bg-[#F7F7F8] rounded-lg text-xs"
                >
                  <span className="font-mono text-[#1A1A1A] truncate">{email}</span>
                  <span
                    className={`font-medium ${
                      status === 'SUCCESS' ? 'text-emerald-600' : 'text-[#E53E3E]'
                    }`}
                  >
                    {status === 'SUCCESS'
                      ? 'Đã gửi lời mời'
                      : status === 'USER_NOT_FOUND'
                      ? 'Chưa có tài khoản'
                      : status === 'MEMBER_ALREADY_EXISTS'
                      ? 'Đã là thành viên'
                      : 'Đang chờ xử lý'}
                  </span>
                </div>
              ))}
            </div>
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-[#1A1A1A] text-white text-xs font-medium rounded-lg hover:bg-[#333] transition-colors"
              >
                Xong
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-[#1A1A1A] mb-1.5">
                Tên dự án <span className="text-[#E53E3E]">*</span>
              </label>
              <input
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Ví dụ: Thiết kế ứng dụng di động"
                className={inputCls}
                required
              />
            </div>

          <div>
            <label className="block text-xs font-medium text-[#1A1A1A] mb-1.5">
              Mã dự án (Key) <span className="text-[#E53E3E]">*</span>
            </label>
            <input
              value={key}
              onChange={(e) =>
                setKey(e.target.value.toUpperCase().slice(0, 6).replace(/[^A-Z0-9]/g, ''))
              }
              placeholder="Ví dụ: MAR"
              className={`${inputCls} font-mono uppercase`}
              maxLength={6}
              required
            />
            <p className="text-[10px] text-[#9B9B9F] mt-1">
              Từ 2–6 ký tự chữ hoa/số. Dùng làm tiền tố mã công việc (ví dụ MAR-1).
            </p>
          </div>

          <div>
            <label className="flex items-center gap-1 text-xs font-medium text-[#1A1A1A] mb-1.5">
              Mô tả dự án <span className="text-[10px] text-[#9B9B9F] font-normal">(tùy chọn)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả ngắn gọn về mục tiêu và phạm vi của dự án"
              rows={3}
              className={`${inputCls} resize-none`}
            />
          </div>

          <div>
            <label className="flex items-center gap-1 text-xs font-medium text-[#1A1A1A] mb-1.5">
              Mời thành viên ban đầu <span className="text-[10px] text-[#9B9B9F] font-normal">(tùy chọn)</span>
            </label>
            <div className="space-y-2">
              {memberEmails.map((email, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => updateEmail(i, e.target.value)}
                    placeholder="dongnghiep@company.com"
                    className={`${inputCls} flex-1`}
                  />
                  {memberEmails.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeEmail(i)}
                      className="text-[#9B9B9F] hover:text-[#E53E3E] transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addEmail}
                className="flex items-center gap-1.5 text-xs text-[#6B6B70] hover:text-[#1A1A1A] transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> + Thêm email khác
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-[#E5E5E7] text-xs text-[#6B6B70] rounded-lg hover:bg-[#F7F7F8] transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim() || !key.trim()}
              className="px-4 py-2 bg-[#E53E3E] text-white text-xs font-medium rounded-lg hover:bg-[#C53030] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? 'Đang tạo…' : 'Tạo dự án'}
            </button>
          </div>
        </form>
      )}
    </div>
  </div>
  );
}
