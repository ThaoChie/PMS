import React, { useState } from 'react';
import { Eye, EyeOff, ArrowLeft, UserPlus } from 'lucide-react';
import { authService } from '../../../services/authService';
import { userService } from '../../../services/userService';
import { useAuthStore, mapUserResponseToUser } from '../../../store/authStore';

interface RegisterProps {
  onLogin: () => void;
  onBack: () => void;
}

export default function Register({ onLogin, onBack }: RegisterProps) {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Vui lòng nhập họ và tên';
    if (!form.email.includes('@')) e.email = 'Vui lòng nhập email hợp lệ';
    if (form.password.length < 6) e.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    if (form.password !== form.confirm) e.confirm = 'Mật khẩu xác nhận không khớp';
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setLoading(true);
    setErrors({});
    try {
      const res = await authService.register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      if (res?.success || res?.data) {
        // Auto-login or navigate to login
        try {
          const loginRes = await authService.login(form.email.trim(), form.password);
          if (loginRes?.data?.accessToken) {
            const meRes = await userService.getMe();
            if (meRes?.data) {
              useAuthStore.getState().login(mapUserResponseToUser(meRes.data), loginRes.data.accessToken);
            }
            onLogin();
            return;
          }
        } catch {
          // If auto login fails, go back to login screen
          onBack();
        }
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Đăng ký không thành công. Vui lòng thử lại.';
      setErrors({ form: msg });
    } finally {
      setLoading(false);
    }
  }

  const field = (key: keyof typeof form, label: string, type = 'text', placeholder = '') => (
    <div>
      <label className="block text-xs sm:text-sm font-medium text-[#334155] mb-1.5">
        {label} <span className="text-[#C5221F] font-bold">*</span>
      </label>
      <input
        type={type === 'password' ? (showPassword ? 'text' : 'password') : type}
        value={form[key]}
        onChange={(e) => {
          setForm((f) => ({ ...f, [key]: e.target.value }));
          setErrors((er) => ({ ...er, [key]: '' }));
        }}
        placeholder={placeholder}
        className={`w-full px-4 py-2.5 sm:py-3 border rounded-xl text-sm text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none transition-all bg-white ${
          errors[key]
            ? 'border-[#C5221F] bg-[#FDF2F2]'
            : 'border-[#E2E8F0] focus:border-[#C5221F] focus:ring-1 focus:ring-[#C5221F]'
        }`}
      />
      {errors[key] && <p className="mt-1 text-xs text-[#C5221F]">{errors[key]}</p>}
    </div>
  );

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-10 selection:bg-[#FDF2F2] selection:text-[#C5221F]">
      <div className="w-full max-w-[420px] mx-auto">
        {/* Logo VJU */}
        <div className="flex justify-center mb-4">
          <img
            src="/logoVJU.png"
            alt="Vietnam Japan University"
            className="w-20 h-20 sm:w-22 sm:h-22 object-contain select-none transition-transform hover:scale-105 duration-200"
          />
        </div>

        {/* Title */}
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-[26px] font-bold text-[#1E293B] tracking-tight">
            Đăng ký tài khoản
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
            Hệ thống quản lý dự án doanh nghiệp
          </p>
        </div>

        {errors.form && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs sm:text-sm font-medium">
            {errors.form}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {field('name', 'Họ và tên', 'text', 'Nguyễn Văn A')}
          {field('email', 'Email', 'email', 'student@drl.edu.vn')}

          <div>
            <label className="block text-xs sm:text-sm font-medium text-[#334155] mb-1.5">
              Mật khẩu <span className="text-[#C5221F] font-bold">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => {
                  setForm((f) => ({ ...f, password: e.target.value }));
                  setErrors((er) => ({ ...er, password: '' }));
                }}
                placeholder="Tối thiểu 6 ký tự"
                className={`w-full px-4 py-2.5 sm:py-3 pr-11 border rounded-xl text-sm text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none transition-all bg-white ${
                  errors.password
                    ? 'border-[#C5221F] bg-[#FDF2F2]'
                    : 'border-[#E2E8F0] focus:border-[#C5221F] focus:ring-1 focus:ring-[#C5221F]'
                }`}
              />
              <button
                type="button"
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#475569] transition-colors p-1"
                onClick={() => setShowPassword((s) => !s)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
              </button>
            </div>
            {errors.password && <p className="mt-1 text-xs text-[#C5221F]">{errors.password}</p>}
          </div>

          {field('confirm', 'Xác nhận mật khẩu', 'password', 'Nhập lại mật khẩu')}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 sm:py-3 bg-[#C5221F] hover:bg-[#AA1D1B] active:bg-[#941917] text-white text-sm sm:text-base font-semibold rounded-xl shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 disabled:opacity-60 mt-4"
          >
            <UserPlus className="w-4 h-4" />
            <span>{loading ? 'Đang tạo tài khoản…' : 'Đăng ký'}</span>
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs text-[#64748B] hover:text-[#1E293B] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Quay lại đăng nhập
          </button>
        </div>
      </div>
    </div>
  );
}
