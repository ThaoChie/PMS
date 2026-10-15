import React from 'react';

interface RichTextEditorProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
}

export default function RichTextEditor({
  value = '',
  onChange,
  placeholder = 'Nhập nội dung mô tả chi tiết...',
  rows = 4,
  className = '',
}: RichTextEditorProps) {
  return (
    <div className={`border border-[#E5E5E7] rounded-lg overflow-hidden bg-white ${className}`}>
      <div className="flex items-center gap-1 px-3 py-1.5 border-b border-[#E5E5E7] bg-[#F7F7F8] text-[11px] text-[#6B6B70]">
        <button
          type="button"
          className="font-bold px-1.5 py-0.5 rounded hover:bg-[#E5E5E7]"
          title="Bold"
          onClick={() => onChange(value + '**in đậm**')}
        >
          B
        </button>
        <button
          type="button"
          className="italic px-1.5 py-0.5 rounded hover:bg-[#E5E5E7]"
          title="Italic"
          onClick={() => onChange(value + '_in nghiêng_')}
        >
          I
        </button>
        <button
          type="button"
          className="font-mono px-1.5 py-0.5 rounded hover:bg-[#E5E5E7]"
          title="Code"
          onClick={() => onChange(value + '`code`')}
        >
          &lt;/&gt;
        </button>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full p-3 text-xs focus:outline-none resize-y"
      />
    </div>
  );
}
