import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { useProjectStore } from '../../../store/projectStore';
import { memberService } from '../../../services/memberService';
import { issueService } from '../../../services/issueService';
import { customFieldService } from '../../../services/customFieldService';
import type { IssueType, Priority, CustomField } from '../../../types';

interface CreateIssueModalProps {
  onClose: () => void;
  onSubmitSuccess?: () => void;
}

function Field({
  label,
  children,
  optional = false,
}: {
  label: string;
  children: React.ReactNode;
  optional?: boolean;
}) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs font-medium text-[#1A1A1A] mb-1.5">
        {label}
        {optional && <span className="text-[10px] text-[#9B9B9F] font-normal">tùy chọn</span>}
      </label>
      {children}
    </div>
  );
}

export default function CreateIssueModal({ onClose, onSubmitSuccess }: CreateIssueModalProps) {
  const { projects, currentProject } = useProjectStore();

  const [form, setForm] = useState({
    projectId: currentProject ? currentProject.id : (projects[0]?.id || ''),
    summary: '',
    description: '',
    type: 'TASK' as string,
    priority: 'MEDIUM' as string,
    assigneeId: '',
    labels: '',
    estimates: '',
    dueDate: '',
    environment: '',
  });

  const [members, setMembers] = useState<Array<{ id: string; name: string }>>([]);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync members & custom fields when selected project changes
  useEffect(() => {
    if (form.projectId) {
      memberService.getMembers(form.projectId)
        .then((res) => {
          const raw = res?.data || [];
          const list = Array.isArray(raw) ? raw : (raw as any).content || [];
          setMembers(
            list.map((m: any) => ({
              id: String(m.user?.id || m.userId || m.id),
              name: m.user?.fullName || m.fullName || m.user?.email || m.email || 'Thành viên',
            }))
          );
        })
        .catch(() => setMembers([]));

      customFieldService.getCustomFields(form.projectId)
        .then((res) => {
          const list = res?.data || [];
          setCustomFields(list);
          const initialValues: Record<string, string> = {};
          list.forEach((f) => {
            if (f.defaultValue) {
              initialValues[f.fieldKey] = f.defaultValue;
            }
          });
          setCustomFieldValues(initialValues);
        })
        .catch(() => setCustomFields([]));
    }
  }, [form.projectId]);

  function set<K extends keyof typeof form>(key: K, val: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: val }));
    if (errorMsg) setErrorMsg(null);
  }

  function setCustomFieldValue(key: string, val: string) {
    setCustomFieldValues((prev) => ({ ...prev, [key]: val }));
    if (errorMsg) setErrorMsg(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.summary.trim()) return;

    setSaving(true);
    setErrorMsg(null);

    const labelsList = form.labels
      ? form.labels.split(',').map((l) => l.trim()).filter(Boolean)
      : undefined;

    // Validate required custom fields
    for (const cf of customFields) {
      if (cf.required) {
        const val = customFieldValues[cf.fieldKey];
        if (!val || !val.trim()) {
          setErrorMsg(`Trường "${cf.name}" là bắt buộc.`);
          setSaving(false);
          return;
        }
      }
    }

    try {
      const payload: any = {
        summary: form.summary.trim(),
        description: form.description || undefined,
        type: form.type as IssueType,
        priority: form.priority as Priority,
        assigneeId: form.assigneeId || undefined,
        labels: labelsList,
        estimates: form.estimates.trim() || undefined,
        dueDate: form.dueDate || undefined,
        environment: form.environment.trim() || undefined,
        customFields: Object.keys(customFieldValues).length > 0 ? customFieldValues : undefined,
      };

      await issueService.createIssue(form.projectId, payload);
      onSubmitSuccess?.();
      onClose();
    } catch (err: any) {
      const msg = err?.message || err?.data?.message || 'Không thể tạo công việc. Vui lòng kiểm tra lại.';
      setErrorMsg(msg);
    } finally {
      setSaving(false);
    }
  }

  const inputCls =
    'w-full px-3 py-2.5 border border-[#E5E5E7] rounded-lg text-sm text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] transition-colors placeholder:text-[#9B9B9F]';
  const selectCls = `${inputCls} appearance-none bg-white`;

  return (
    <div
      className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 modal-backdrop px-4"
      onClick={onClose}
    >
      <div
        className="bg-white border border-[#E5E5E7] rounded-xl w-full max-w-2xl shadow-xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E5E7] shrink-0">
          <h2 className="text-sm font-semibold text-[#1A1A1A]">Tạo công việc mới</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-[#9B9B9F] hover:text-[#1A1A1A] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error banner */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="overflow-y-auto flex-1 px-6 py-5">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <Field label="Dự án">
                <select
                  value={form.projectId}
                  onChange={(e) => set('projectId', e.target.value)}
                  className={selectCls}
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.key})
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Loại công việc">
                <select
                  value={form.type}
                  onChange={(e) => set('type', e.target.value)}
                  className={selectCls}
                >
                  <option value="TASK">Task (Tác vụ)</option>
                  <option value="BUG">Bug (Lỗi phần mềm)</option>
                  <option value="EPIC">Epic (Tính năng lớn)</option>
                  <option value="SUB_TASK">Sub-task (Tác vụ con)</option>
                </select>
              </Field>
            </div>

            <div className="mb-4">
              <Field label="Tóm tắt công việc">
                <input
                  value={form.summary}
                  onChange={(e) => set('summary', e.target.value)}
                  placeholder="Mô tả ngắn gọn, rõ ràng về công việc cần thực hiện"
                  className={inputCls}
                  required
                />
              </Field>
            </div>

            <div className="mb-4">
              <Field label="Mô tả chi tiết" optional>
                <textarea
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                  placeholder="Mô tả chi tiết yêu cầu, các bước tái hiện, kết quả mong đợi…"
                  rows={4}
                  className={`${inputCls} resize-none`}
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <Field label="Mức độ ưu tiên">
                <select
                  value={form.priority}
                  onChange={(e) => set('priority', e.target.value)}
                  className={selectCls}
                >
                  <option value="HIGHEST">Khẩn cấp nhất (Highest)</option>
                  <option value="HIGH">Cao (High)</option>
                  <option value="MEDIUM">Trung bình (Medium)</option>
                  <option value="LOW">Thấp (Low)</option>
                  <option value="LOWEST">Rất thấp (Lowest)</option>
                </select>
              </Field>
              <Field label="Người thực hiện" optional>
                <select
                  value={form.assigneeId}
                  onChange={(e) => set('assigneeId', e.target.value)}
                  className={selectCls}
                >
                  <option value="">Chưa phân công</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <Field label="Nhãn (Labels)" optional>
                <input
                  value={form.labels}
                  onChange={(e) => set('labels', e.target.value)}
                  placeholder="Ví dụ: backend, api, security (cách nhau bởi dấu phẩy)"
                  className={inputCls}
                />
              </Field>
              <Field label="Ước tính thời gian" optional>
                <input
                  value={form.estimates}
                  onChange={(e) => set('estimates', e.target.value)}
                  placeholder="Ví dụ: 2h30m, 1d"
                  className={inputCls}
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <Field label="Hạn hoàn thành" optional>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => set('dueDate', e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="Môi trường" optional>
                <input
                  value={form.environment}
                  onChange={(e) => set('environment', e.target.value)}
                  placeholder="Ví dụ: Production, Staging"
                  className={inputCls}
                />
              </Field>
            </div>

            {/* Custom Fields section */}
            {customFields.length > 0 && (
              <div className="pt-2 border-t border-[#E5E5E7] mb-4">
                <p className="text-[10px] font-semibold text-[#9B9B9F] uppercase tracking-wider mb-3">
                  Thông tin bổ sung dự án ({customFields.length})
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {customFields.map((cf) => {
                    const optionsList = cf.options ? cf.options.split(',').map((s) => s.trim()).filter(Boolean) : [];
                    const val = customFieldValues[cf.fieldKey] || '';

                    return (
                      <Field key={cf.fieldKey} label={cf.name} optional={!cf.required}>
                        {cf.type === 'DROPDOWN' ? (
                          <select
                            value={val}
                            onChange={(e) => setCustomFieldValue(cf.fieldKey, e.target.value)}
                            className={selectCls}
                          >
                            <option value="">-- Chọn {cf.name} --</option>
                            {optionsList.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        ) : cf.type === 'CHECKBOX' ? (
                          <label className="flex items-center gap-2 mt-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={val === 'true'}
                              onChange={(e) => setCustomFieldValue(cf.fieldKey, String(e.target.checked))}
                              className="rounded border-[#C5C5C8] text-[#1A1A1A] focus:ring-0"
                            />
                            <span className="text-xs text-[#1A1A1A]">Đã bật / Đồng ý</span>
                          </label>
                        ) : (
                          <input
                            type={cf.type === 'NUMBER' ? 'number' : cf.type === 'DATE' ? 'date' : 'text'}
                            value={val}
                            onChange={(e) => setCustomFieldValue(cf.fieldKey, e.target.value)}
                            placeholder={cf.defaultValue || `Nhập ${cf.name}...`}
                            className={inputCls}
                          />
                        )}
                        {cf.description && (
                          <p className="text-[10px] text-[#9B9B9F] mt-1">{cf.description}</p>
                        )}
                      </Field>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#E5E5E7] shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-[#E5E5E7] text-xs text-[#6B6B70] rounded-lg hover:bg-[#F7F7F8] transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving || !form.summary.trim()}
              className="px-4 py-2 bg-[#E53E3E] text-white text-xs font-medium rounded-lg hover:bg-[#C53030] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? 'Đang tạo…' : 'Tạo công việc'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
