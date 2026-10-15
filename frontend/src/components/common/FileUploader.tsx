import React, { useRef } from 'react';
import { Paperclip, UploadCloud } from 'lucide-react';

interface FileUploaderProps {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  className?: string;
}

export default function FileUploader({
  onFilesSelected,
  accept,
  multiple = true,
  className = '',
}: FileUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      onFilesSelected(Array.from(e.target.files));
    }
  }

  return (
    <div className={className}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={accept}
        multiple={multiple}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="flex items-center gap-2 px-3 py-2 border border-dashed border-[#E5E5E7] rounded-lg text-xs text-[#6B6B70] hover:border-[#1A1A1A] hover:text-[#1A1A1A] transition-colors w-full justify-center"
      >
        <UploadCloud className="w-4 h-4 text-[#9B9B9F]" />
        <span>Kéo thả tệp hoặc bấm để tải lên</span>
      </button>
    </div>
  );
}
