import React, { useRef } from 'react';
import { Camera } from 'lucide-react';
import type { User } from '../../../types';

interface AvatarUploadProps {
  user: User;
  onUpload?: (file: File) => void;
}

export default function AvatarUpload({ user, onUpload }: AvatarUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0] && onUpload) {
      onUpload(e.target.files[0]);
    }
  }

  return (
    <div className="flex items-center gap-5 mb-6">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
      <div className="relative">
        <div className="w-[72px] h-[72px] rounded-full bg-[#1A1A1A] flex items-center justify-center text-white text-xl font-semibold">
          {user.initials}
        </div>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="absolute -bottom-1 -right-1 w-7 h-7 bg-white border border-[#E5E5E7] rounded-full flex items-center justify-center hover:bg-[#F7F7F8] transition-colors"
        >
          <Camera className="w-3.5 h-3.5 text-[#6B6B70]" />
        </button>
      </div>
      <div>
        <p className="text-sm font-medium text-[#1A1A1A]">{user.name}</p>
        <p className="text-xs text-[#6B6B70] mt-0.5">{user.email}</p>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="mt-2 text-xs text-[#E53E3E] hover:text-[#C53030] font-medium transition-colors"
        >
          Upload new photo
        </button>
      </div>
    </div>
  );
}
