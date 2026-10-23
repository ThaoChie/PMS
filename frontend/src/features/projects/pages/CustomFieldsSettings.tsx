import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Sliders,
  AlertCircle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  X,
  Type,
  Hash,
  Calendar,
  ListFilter,
  CheckSquare,
} from 'lucide-react';
import { useProjectStore } from '../../../store/projectStore';
import { customFieldService } from '../../../services/customFieldService';
import type { CustomField, CustomFieldType, Role } from '../../../types';

interface CustomFieldsSettingsProps {
  role?: Role;
}

export default function CustomFieldsSettings({ role = 'pm' }: CustomFieldsSettingsProps) {
  const { currentProject } = useProjectStore();
  const canEdit = role === 'admin' || role === 'pm';

  const [fields, setFields] = useState<CustomField[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFieldId, setEditingFieldId] = useState<number | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    fieldKey: string;
    type: CustomFieldType;
    required: boolean;
    options: string;
    defaultValue: string;
    description: string;
  }>({
    name: '',
    fieldKey: '',
    type: 'TEXT',
    required: false,
    options: '',
    defaultValue: '',
    description: '',
  });

  const loadFields = useCallback(async () => {
    if (!currentProject) return;
    setLoading(true);
    setError(null);
    try {
      const res = await customFieldService.getCustomFields(currentProject.id);
      setFields(res?.data || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Không thể tải danh sách trường tùy chỉnh');
    } finally {
      setLoading(false);
    }
  }, [currentProject]);

  useEffect(() => {
    loadFields();
  }, [loadFields]);

  function showSuccess(msg: string) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3500);
  }

  function openCreateModal() {
    setEditingFieldId(null);
    setFormData({
      name: '',
      fieldKey: '',
      type: 'DROPDOWN',
      required: false,
      options: '',
      defaultValue: '',
      description: '',
    });
    setError(null);
    setIsModalOpen(true);
  }

  function openEditModal(field: CustomField) {
    setEditingFieldId(field.id);
    setFormData({
      name: field.name,
      fieldKey: field.fieldKey,
      type: field.type,
      required: field.required,
      options: field.options || '',
      defaultValue: field.defaultValue || '',
      description: field.description || '',
    });
    setError(null);
    setIsModalOpen(true);
  }

  function handleNameChange(name: string) {
    setFormData((prev) => {
      if (editingFieldId === null) {
        const autoKey = name
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '_')
          .replace(/^_+|_+$/g, '');
        return { ...prev, name, fieldKey: autoKey };
      }
      return { ...prev, name };
    });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!currentProject) return;

    if (!formData.name.trim()) {
      setError('Vui lòng nhập tên trường');
      return;
    }

    if (formData.type === 'DROPDOWN' && !formData.options.trim()) {
      setError('Vui lòng nhập các giá trị lựa chọn cho trường Dropdown (cách nhau bởi dấu phẩy)');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      if (editingFieldId !== null) {
        await customFieldService.updateCustomField(currentProject.id, editingFieldId, {
          name: formData.name.trim(),
          type: formData.type,
          required: formData.required,
          options: formData.options.trim() || undefined,
          defaultValue: formData.defaultValue.trim() || undefined,
          description: formData.description.trim() || undefined,
        });
        showSuccess(`Đã cập nhật trường "${formData.name}" thành công!`);
      } else {
        await customFieldService.createCustomField(currentProject.id, {
          name: formData.name.trim(),
          fieldKey: formData.fieldKey.trim() || undefined,
          type: formData.type,
          required: formData.required,
          options: formData.options.trim() || undefined,
          defaultValue: formData.defaultValue.trim() || undefined,
          description: formData.description.trim() || undefined,
        });
        showSuccess(`Đã thêm trường "${formData.name}" thành công!`);
      }

      setIsModalOpen(false);
      await loadFields();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Không thể lưu trường tùy chỉnh');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(field: CustomField) {
    if (!currentProject) return;
    if (
      !window.confirm(
        `Bạn có chắc chắn muốn xoá trường "${field.name}" (${field.fieldKey}) không? Mọi dữ liệu đã nhập cho trường này trong các công việc sẽ bị xóa vĩnh viễn.`
      )
    ) {
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await customFieldService.deleteCustomField(currentProject.id, field.id);
      showSuccess(`Đã xoá trường "${field.name}" thành công!`);
      await loadFields();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Không thể xoá trường');
    } finally {
      setSaving(false);
    }
  }

  function getTypeIcon(type: CustomFieldType) {
    switch (type) {
      case 'TEXT':
        return <Type className="w-3.5 h-3.5 text-blue-500" />;
      case 'NUMBER':
        return <Hash className="w-3.5 h-3.5 text-purple-500" />;
      case 'DATE':
        return <Calendar className="w-3.5 h-3.5 text-emerald-500" />;
      case 'DROPDOWN':
        return <ListFilter className="w-3.5 h-3.5 text-amber-500" />;
      case 'CHECKBOX':
        return <CheckSquare className="w-3.5 h-3.5 text-rose-500" />;
      default:
        return <Sliders className="w-3.5 h-3.5 text-gray-400" />;
    }
  }

  function getTypeLabel(type: CustomFieldType) {
    switch (type) {
      case 'TEXT':
        return 'Văn bản (Text)';
      case 'NUMBER':
        return 'Số (Number)';
      case 'DATE':
        return 'Ngày tháng (Date)';
      case 'DROPDOWN':
        return 'Danh sách chọn (Dropdown)';
      case 'CHECKBOX':
        return 'Hộp kiểm (Checkbox)';
      default:
        return type;
    }
  }

  if (!currentProject) {
    return (
      <div className="h-full flex items-center justify-center p-8 text-center text-sm text-[#6B6B70]">
        Chưa có dự án nào được chọn. Vui lòng chọn dự án để quản lý trường tùy chỉnh.
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-white">
      <div className="max-w-4xl mx-auto px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-[#1A1A1A]" />
              <h1 className="text-xl font-bold text-[#1A1A1A]">Quản lý trường tùy chỉnh</h1>
            </div>
            <p className="text-sm text-[#6B6B70] mt-1">
              Thêm, sửa và quản lý các trường thông tin chi tiết cho công việc (ví dụ: Sprint, Module, Release,...) trong dự án{' '}
              <span className="font-semibold text-[#1A1A1A]">{currentProject.name}</span> ({currentProject.key})
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadFields}
              className="p-2 border border-[#E5E5E7] text-[#6B6B70] rounded-lg hover:bg-[#F7F7F8] transition-colors"
              title="Làm mới danh sách"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            {canEdit && (
              <button
                type="button"
                onClick={openCreateModal}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#E53E3E] hover:bg-[#C53030] text-white text-xs font-medium rounded-lg transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm trường mới</span>
              </button>
            )}
          </div>
        </div>

        {/* Notifications */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-green-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Table or Empty State */}
        {loading ? (
          <div className="flex items-center justify-center py-16 text-xs text-[#9B9B9F] gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Đang tải danh sách trường tùy chỉnh…</span>
          </div>
        ) : fields.length === 0 ? (
          <div className="py-16 px-4 text-center border-2 border-dashed border-[#E5E5E7] rounded-xl bg-[#FAF9F8]">
            <Sliders className="w-10 h-10 text-[#C5C5C8] mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-[#1A1A1A] mb-1">
              Chưa có trường tùy chỉnh nào
            </h3>
            <p className="text-xs text-[#6B6B70] max-w-md mx-auto mb-4">
              Bạn có thể tạo các trường dữ liệu riêng biệt cho dự án này như Sprint, Module, Release, Mức độ ưu tiên nâng cao,...
            </p>
            {canEdit && (
              <button
                type="button"
                onClick={openCreateModal}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1A1A1A] text-white text-xs font-medium rounded-lg hover:bg-black transition-colors shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tạo trường đầu tiên (ví dụ: Sprint)</span>
              </button>
            )}
          </div>
        ) : (
          <div className="border border-[#E5E5E7] rounded-xl overflow-hidden shadow-sm bg-white">
            <div className="px-5 py-3.5 bg-[#FAF9F8] border-b border-[#E5E5E7] flex items-center justify-between">
              <span className="text-xs font-semibold text-[#1A1A1A]">
                Danh sách trường dữ liệu ({fields.length})
              </span>
              <span className="text-[11px] text-[#9B9B9F]">
                Tự động hiển thị trong chi tiết công việc và màn tạo công việc
              </span>
            </div>

            <div className="divide-y divide-[#F0F0F1]">
              {fields.map((f) => (
                <div
                  key={f.id}
                  className="p-4 flex items-center justify-between hover:bg-[#FAF9F8] transition-colors"
                >
                  <div className="space-y-1.5 min-w-0 pr-4 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-[#1A1A1A]">{f.name}</span>
                      <code className="text-[10px] font-mono bg-[#F0F0F1] px-2 py-0.5 rounded text-[#6B6B70] border border-[#E5E5E7]">
                        {f.fieldKey}
                      </code>
                      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        {getTypeIcon(f.type)}
                        <span>{getTypeLabel(f.type)}</span>
                      </span>
                      {f.required ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-50 text-red-600 font-medium border border-red-200">
                          Bắt buộc
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-50 text-gray-500 border border-gray-200">
                          Tùy chọn
                        </span>
                      )}
                    </div>

                    {f.type === 'DROPDOWN' && f.options && (
                      <p className="text-xs text-[#6B6B70]">
                        <span className="font-medium text-[#1A1A1A]">Các lựa chọn:</span>{' '}
                        {f.options.split(',').map((opt, i) => (
                          <span
                            key={i}
                            className="inline-block bg-[#F7F7F8] border border-[#E5E5E7] text-[11px] text-[#1A1A1A] px-1.5 py-0.5 rounded mr-1.5 mt-0.5"
                          >
                            {opt.trim()}
                          </span>
                        ))}
                      </p>
                    )}

                    {f.defaultValue && (
                      <p className="text-xs text-[#6B6B70]">
                        <span className="font-medium text-[#1A1A1A]">Mặc định:</span>{' '}
                        <span className="font-mono text-[11px] bg-[#F7F7F8] px-1.5 py-0.5 rounded">
                          {f.defaultValue}
                        </span>
                      </p>
                    )}

                    {f.description && (
                      <p className="text-xs text-[#9B9B9F] italic">{f.description}</p>
                    )}
                  </div>

                  {canEdit && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => openEditModal(f)}
                        className="p-2 text-[#6B6B70] hover:text-[#1A1A1A] hover:bg-[#F0F0F1] rounded-lg transition-colors"
                        title="Chỉnh sửa trường"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(f)}
                        className="p-2 text-[#6B6B70] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Xoá trường"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal Add / Edit Custom Field */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E5E7]">
                <h3 className="text-sm font-semibold text-[#1A1A1A]">
                  {editingFieldId !== null ? 'Chỉnh sửa trường tùy chỉnh' : 'Thêm trường tùy chỉnh mới'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="text-[#9B9B9F] hover:text-[#1A1A1A] p-1 rounded-md"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-5 space-y-4">
                {error && (
                  <div className="p-2.5 bg-red-50 border border-red-200 text-red-600 rounded-lg text-xs">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-[#1A1A1A] mb-1">
                    Tên trường <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Sprint, Module, Release, Mức độ tác động..."
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="w-full px-3 py-2 border border-[#E5E5E7] rounded-lg text-xs text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#1A1A1A] mb-1">
                    Mã trường (Field Key) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    disabled={editingFieldId !== null}
                    placeholder="sprint, module_name, release_ver..."
                    value={formData.fieldKey}
                    onChange={(e) =>
                      setFormData((f) => ({
                        ...f,
                        fieldKey: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''),
                      }))
                    }
                    className="w-full px-3 py-2 border border-[#E5E5E7] rounded-lg text-xs font-mono text-[#1A1A1A] bg-white disabled:bg-[#F7F7F8] disabled:text-[#9B9B9F] focus:outline-none focus:border-[#1A1A1A]"
                  />
                  <p className="text-[10px] text-[#9B9B9F] mt-1">
                    Mã dùng trong API và định danh duy nhất trong dự án (chỉ gồm chữ thường, số, dấu gạch dưới).
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[#1A1A1A] mb-1">
                      Kiểu dữ liệu <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) =>
                        setFormData((f) => ({ ...f, type: e.target.value as CustomFieldType }))
                      }
                      className="w-full px-3 py-2 border border-[#E5E5E7] rounded-lg text-xs text-[#1A1A1A] bg-white focus:outline-none focus:border-[#1A1A1A]"
                    >
                      <option value="DROPDOWN">Danh sách chọn (Dropdown)</option>
                      <option value="TEXT">Văn bản ngắn (Text)</option>
                      <option value="NUMBER">Số (Number)</option>
                      <option value="DATE">Ngày tháng (Date)</option>
                      <option value="CHECKBOX">Hộp kiểm (Checkbox)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#1A1A1A] mb-1">
                      Quy tắc bắt buộc
                    </label>
                    <label className="flex items-center gap-2 mt-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.required}
                        onChange={(e) =>
                          setFormData((f) => ({ ...f, required: e.target.checked }))
                        }
                        className="rounded border-[#C5C5C8] text-[#1A1A1A] focus:ring-0"
                      />
                      <span className="text-xs text-[#1A1A1A]">Bắt buộc nhập</span>
                    </label>
                  </div>
                </div>

                {formData.type === 'DROPDOWN' && (
                  <div className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-lg">
                    <label className="block text-xs font-medium text-[#1A1A1A] mb-1">
                      Danh sách các lựa chọn (Options) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Sprint 1, Sprint 2, Sprint 3"
                      value={formData.options}
                      onChange={(e) => setFormData((f) => ({ ...f, options: e.target.value }))}
                      className="w-full px-3 py-2 bg-white border border-[#E5E5E7] rounded-lg text-xs text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A]"
                    />
                    <p className="text-[10px] text-amber-700 mt-1">
                      Nhập các giá trị cách nhau bằng dấu phẩy (,). Ví dụ: Sprint 1, Sprint 2, Sprint 3
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-[#1A1A1A] mb-1">
                    Giá trị mặc định (tùy chọn)
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Sprint 1"
                    value={formData.defaultValue}
                    onChange={(e) => setFormData((f) => ({ ...f, defaultValue: e.target.value }))}
                    className="w-full px-3 py-2 border border-[#E5E5E7] rounded-lg text-xs text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#1A1A1A] mb-1">
                    Mô tả / Hướng dẫn điền (tùy chọn)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Ghi chú hướng dẫn cho thành viên khi nhập trường này..."
                    value={formData.description}
                    onChange={(e) => setFormData((f) => ({ ...f, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-[#E5E5E7] rounded-lg text-xs text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A]"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E5E5E7]">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-3 py-1.5 border border-[#E5E5E7] rounded-lg text-xs text-[#6B6B70] hover:text-[#1A1A1A] hover:bg-[#F7F7F8] transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-[#E53E3E] hover:bg-[#C53030] disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors shadow-sm"
                  >
                    {saving && <Loader2 className="w-3 h-3 animate-spin" />}
                    <span>{editingFieldId !== null ? 'Lưu thay đổi' : 'Tạo trường'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
