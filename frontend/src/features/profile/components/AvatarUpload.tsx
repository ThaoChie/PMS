import React, { useRef, useState } from 'react';
import { Camera, Sparkles, X, Check } from 'lucide-react';
import type { User } from '../../../types';
import { PRESET_AVATARS } from '../constants/presetAvatars';

interface AvatarUploadProps {
  user: User;
  onUpload?: (file: File) => void;
  onSelectPreset?: (avatarUrl: string) => void;
}

export default function AvatarUpload({ user, onUpload, onSelectPreset }: AvatarUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showPresetModal, setShowPresetModal] = useState(false);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0] && onUpload) {
      onUpload(e.target.files[0]);
    }
  }

  function handleSelect(url: string) {
    if (onSelectPreset) {
      onSelectPreset(url);
    }
    setShowPresetModal(false);
  }

  return (
    <div className="mb-6">
      <div className="flex items-center gap-5">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />
        <div className="relative">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="w-[72px] h-[72px] rounded-full object-cover border border-[#E5E5E7] shadow-xs"
            />
          ) : (
            <div className="w-[72px] h-[72px] rounded-full bg-[#1A1A1A] flex items-center justify-center text-white text-xl font-semibold shadow-xs">
              {user.initials}
            </div>
          )}
          <button
            type="button"
            title="Đổi ảnh đại diện"
            onClick={() => fileInputRef.current?.click()}
            className="absolute -bottom-1 -right-1 w-7 h-7 bg-white border border-[#E5E5E7] rounded-full flex items-center justify-center hover:bg-[#F7F7F8] transition-colors shadow-xs"
          >
            <Camera className="w-3.5 h-3.5 text-[#6B6B70]" />
          </button>
        </div>
        <div>
          <p className="text-sm font-semibold text-[#1A1A1A]">{user.name}</p>
          <p className="text-xs text-[#6B6B70] mt-0.5">{user.email}</p>
          <div className="flex items-center gap-3 mt-2.5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs text-[#E53E3E] hover:text-[#C53030] font-medium transition-colors"
            >
              Tải ảnh mới lên
            </button>
            <span className="text-[#D1D5DB] text-xs">•</span>
            <button
              type="button"
              onClick={() => setShowPresetModal(true)}
              className="inline-flex items-center gap-1 text-xs text-[#2563EB] hover:text-[#1D4ED8] font-medium transition-colors"
            >
              <Sparkles className="w-3 h-3" /> Chọn ảnh mẫu
            </button>
          </div>
        </div>
      </div>

      {/* Preset Avatars Modal */}
      {showPresetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#E2E8F0] animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9] mb-4">
              <div>
                <h3 className="text-base font-semibold text-[#1E293B]">Chọn ảnh đại diện mẫu</h3>
                <p className="text-xs text-[#64748B] mt-0.5">Chọn một hình đại diện phù hợp với bạn</p>
              </div>
              <button
                type="button"
                onClick={() => setShowPresetModal(false)}
                className="text-[#94A3B8] hover:text-[#475569] p-1 rounded-lg hover:bg-[#F1F5F9] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-3 py-2">
              {PRESET_AVATARS.map((preset) => {
                const isSelected = user.avatarUrl === preset.url;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelect(preset.url)}
                    className={`group relative flex flex-col items-center p-2 rounded-xl border transition-all text-center ${
                      isSelected
                        ? 'border-[#2563EB] bg-[#EFF6FF] ring-2 ring-[#2563EB]/20'
                        : 'border-[#E2E8F0] hover:border-[#94A3B8] hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <img
                      src={preset.url}
                      alt={preset.name}
                      className="w-14 h-14 rounded-full object-cover transition-transform group-hover:scale-105"
                    />
                    <span className="text-[11px] font-medium text-[#475569] mt-1.5 line-clamp-1">
                      {preset.name}
                    </span>
                    {isSelected && (
                      <span className="absolute top-1.5 right-1.5 bg-[#2563EB] text-white rounded-full p-0.5">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-5 pt-3 border-t border-[#F1F5F9] flex justify-end">
              <button
                type="button"
                onClick={() => setShowPresetModal(false)}
                className="px-4 py-2 border border-[#CBD5E1] text-xs font-medium text-[#475569] rounded-lg hover:bg-[#F8FAFC] transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
