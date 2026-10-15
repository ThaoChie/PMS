import React, { useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';

interface EmailLoginFormProps {
  onSubmit: (email: string, password: string) => void;
  onForgotPassword?: () => void;
  loading?: boolean;
}

export default function EmailLoginForm({
  onSubmit,
  onForgotPassword,
  loading = false,
}: EmailLoginFormProps) {
  const [email, setEmail] = useState('admin@drl.edu.vn');
  const [password, setPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit(email, password);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs sm:text-sm font-medium text-[#334155] mb-1.5">
          Email <span className="text-[#C5221F] font-bold">*</span>
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@drl.edu.vn"
          className="w-full px-4 py-2.5 sm:py-3 border border-[#E2E8F0] rounded-xl text-sm text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#C5221F] focus:ring-1 focus:ring-[#C5221F] transition-all bg-white"
          required
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs sm:text-sm font-medium text-[#334155]">
            Mật khẩu <span className="text-[#C5221F] font-bold">*</span>
          </label>
          {onForgotPassword && (
            <button
              type="button"
              onClick={onForgotPassword}
              className="text-xs text-[#64748B] hover:text-[#C5221F] transition-colors"
            >
              Quên mật khẩu?
            </button>
          )}
        </div>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Nhập mật khẩu"
            className="w-full px-4 py-2.5 sm:py-3 pr-11 border border-[#E2E8F0] rounded-xl text-sm text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#C5221F] focus:ring-1 focus:ring-[#C5221F] transition-all bg-white"
            required
          />
          <button
            type="button"
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#475569] transition-colors p-1"
            onClick={() => setShowPassword((s) => !s)}
            tabIndex={-1}
            aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
          >
            {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 sm:py-3 bg-[#C5221F] hover:bg-[#AA1D1B] active:bg-[#941917] text-white text-sm sm:text-base font-semibold rounded-xl shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 disabled:opacity-60 mt-2"
      >
        <Lock className="w-4 h-4" />
        <span>{loading ? 'Đang đăng nhập…' : 'Đăng nhập'}</span>
      </button>
    </form>
  );
}
