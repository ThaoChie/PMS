import React, { useState, useEffect } from 'react';
import { parseDuration, formatDuration } from '../../utils/duration';

interface DurationInputProps {
  value?: string;
  onChange: (value: string, minutes: number) => void;
  placeholder?: string;
  className?: string;
}

export default function DurationInput({
  value = '',
  onChange,
  placeholder = 'VD: 2h30m, 1d 4h, 45m',
  className = '',
}: DurationInputProps) {
  const [text, setText] = useState(value);
  const minutes = parseDuration(text);

  useEffect(() => {
    setText(value);
  }, [value]);

  function handleChange(val: string) {
    setText(val);
    const parsed = parseDuration(val);
    onChange(val, parsed);
  }

  return (
    <div className={`space-y-1 ${className}`}>
      <input
        type="text"
        value={text}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        className="w-full text-xs border border-[#E5E5E7] rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-[#1A1A1A]"
      />
      {text.trim() && (
        <p className="text-[10px] text-[#6B6B70]">
          Quy đổi: <span className="font-medium text-[#1A1A1A]">{formatDuration(minutes)}</span>{' '}
          ({minutes} phút)
        </p>
      )}
    </div>
  );
}
