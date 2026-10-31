import React, { useState } from 'react';
import { Check } from 'lucide-react';
import type { Project } from '../../../types';
import ProjectBadge from './ProjectBadge';
import { PROJECT_COLORS, PROJECT_ICONS } from '../constants/projectBranding';

interface EditProjectFormProps {
  project: Project;
  canEdit: boolean;
  onSave?: (name: string, description: string, color: string, icon: string) => void;
}

export default function EditProjectForm({ project, canEdit, onSave }: EditProjectFormProps) {
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description);
  const [color, setColor] = useState(project.color || '#1A1A1A');
  const [icon, setIcon] = useState(project.icon || 'folder');
  const [saved, setSaved] = useState(false);

  React.useEffect(() => {
    setName(project.name);
    setDescription(project.description);
    setColor(project.color || '#1A1A1A');
    setIcon(project.icon || 'folder');
  }, [project]);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaved(true);
    onSave?.(name, description, color, icon);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="bg-white border border-[#E5E5E7] rounded-xl p-6 mb-5">
      <h2 className="text-sm font-semibold text-[#1A1A1A] mb-5">Thông tin chung & Nhận diện</h2>
      <form onSubmit={handleSave} className="space-y-5">
        {/* Live Preview */}
        <div className="p-4 bg-[#FBFBFC] border border-[#E5E5E7] rounded-xl flex items-center gap-3.5">
          <ProjectBadge
            color={color}
            icon={icon}
            projectKey={project.key}
            size="lg"
          />
          <div>
            <div className="text-xs text-[#9B9B9F] font-medium">Xem trước huy hiệu dự án</div>
            <div className="text-sm font-semibold text-[#1A1A1A] mt-0.5">{name || 'Tên dự án'}</div>
            <div className="text-[10px] font-mono text-[#6B6B70]">{project.key}</div>
          </div>
        </div>

        {/* Color Palette Picker */}
        <div>
          <label className="block text-xs font-medium text-[#1A1A1A] mb-2">
            Màu sắc nhận diện
          </label>
          <div className="flex flex-wrap items-center gap-2">
            {PROJECT_COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                disabled={!canEdit}
                title={c.label}
                onClick={() => setColor(c.value)}
                style={{ backgroundColor: c.value }}
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform ${
                  color === c.value
                    ? 'ring-2 ring-offset-2 ring-[#1A1A1A] scale-110'
                    : 'hover:scale-105 opacity-90 hover:opacity-100'
                } disabled:cursor-not-allowed`}
              >
                {color === c.value && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
              </button>
            ))}
          </div>
        </div>

        {/* Icon Picker */}
        <div>
          <label className="block text-xs font-medium text-[#1A1A1A] mb-2">
            Biểu tượng dự án (Icon)
          </label>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {PROJECT_ICONS.map((item) => {
              const IconComp = item.icon;
              const isSelected = icon === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={!canEdit}
                  onClick={() => setIcon(item.id)}
                  className={`flex flex-col items-center gap-1.5 p-2 rounded-lg border text-xs transition-all ${
                    isSelected
                      ? 'border-[#1A1A1A] bg-[#1A1A1A] text-white shadow-xs'
                      : 'border-[#E5E5E7] bg-white text-[#6B6B70] hover:border-[#C5C5C8] hover:text-[#1A1A1A]'
                  } disabled:cursor-not-allowed`}
                >
                  <IconComp className="w-4 h-4" />
                  <span className="text-[10px] truncate max-w-full">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-[#1A1A1A] mb-1.5">
            Tên dự án <span className="text-[#E53E3E] font-bold">*</span>
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={!canEdit}
            required
            className="w-full px-3 py-2.5 border border-[#E5E5E7] rounded-lg text-sm text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] disabled:bg-[#F7F7F8] disabled:text-[#9B9B9F] disabled:cursor-not-allowed transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[#1A1A1A] mb-1.5">Mã dự án (Key)</label>
          <input
            value={project.key}
            disabled
            className="w-full px-3 py-2.5 border border-[#E5E5E7] rounded-lg text-sm text-[#9B9B9F] bg-[#F7F7F8] cursor-not-allowed font-mono"
          />
          <p className="text-[10px] text-[#9B9B9F] mt-1">
            Mã dự án không thể thay đổi sau khi tạo để bảo toàn tính toàn vẹn của mã công việc (ví dụ: {project.key}-1).
          </p>
        </div>

        <div>
          <label className="block text-xs font-medium text-[#1A1A1A] mb-1.5">Mô tả dự án</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={!canEdit}
            rows={3}
            className="w-full px-3 py-2.5 border border-[#E5E5E7] rounded-lg text-sm text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] resize-none disabled:bg-[#F7F7F8] disabled:text-[#9B9B9F] disabled:cursor-not-allowed transition-colors"
          />
        </div>

        {canEdit && (
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              className="px-4 py-2 bg-[#E53E3E] text-white text-xs font-medium rounded-lg hover:bg-[#C53030] transition-colors"
            >
              Lưu thay đổi
            </button>
            {saved && <span className="text-xs text-[#1A1A1A]">Đã lưu ✓</span>}
          </div>
        )}
      </form>
    </div>
  );
}
