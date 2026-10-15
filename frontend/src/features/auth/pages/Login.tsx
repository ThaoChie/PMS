import React, { useState } from 'react';
import GoogleLoginButton from '../components/GoogleLoginButton';
import EmailLoginForm from '../components/EmailLoginForm';
import { authService } from '../../../services/authService';
import { userService } from '../../../services/userService';
import { useAuthStore, mapUserResponseToUser } from '../../../store/authStore';

interface LoginProps {
  onLogin: () => void;
  onRegister: () => void;
  onForgotPassword?: () => void;
}

export default function Login({ onLogin, onRegister, onForgotPassword }: LoginProps) {
  const [loading, setLoading] = useState(false);
  const [showGoogle, setShowGoogle] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleEmailSubmit(email: string, password: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await authService.login(email, password);
      if (res?.success || res?.data?.accessToken) {
        let userObj = res.data?.user ? mapUserResponseToUser(res.data.user) : null;
        if (!userObj) {
          try {
            const meRes = await userService.getMe();
            if (meRes?.data) {
              userObj = mapUserResponseToUser(meRes.data);
            }
          } catch {
            // fallback if getMe fails
          }
        }
        if (!userObj) {
          userObj = {
            id: '1',
            name: email.split('@')[0],
            email,
            initials: email.slice(0, 2).toUpperCase(),
            role: 'member',
            status: 'Active',
          };
        }
        useAuthStore.getState().login(userObj, res.data.accessToken);
        onLogin();
      } else {
        setError(res?.message || 'Email và/hoặc mật khẩu chưa đúng');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Email và/hoặc mật khẩu chưa đúng';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

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

        {/* Header Title & Subtitle */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-[26px] font-bold text-[#1E293B] tracking-tight">
            Đăng nhập
          </h1>
          <p className="text-sm sm:text-[15px] text-[#64748B] mt-1 font-normal">
            Hệ thống quản lý dự án doanh nghiệp
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs sm:text-sm font-medium">
            {error}
          </div>
        )}

        {/* Email & Password Login Form */}
        <EmailLoginForm
          onSubmit={handleEmailSubmit}
          onForgotPassword={onForgotPassword}
          loading={loading}
        />

        {/* Additional Auth Options */}
        <div className="mt-4 pt-3 border-t border-[#F1F5F9] space-y-3">
          {!showGoogle ? (
            <button
              type="button"
              onClick={() => setShowGoogle(true)}
              className="w-full text-center text-xs text-[#64748B] hover:text-[#1E293B] transition-colors py-1"
            >
              Hoặc đăng nhập bằng phương thức khác
            </button>
          ) : (
            <GoogleLoginButton onSuccess={onLogin} />
          )}

          <p className="text-center text-xs text-[#64748B]">
            Chưa có tài khoản?{' '}
            <button
              type="button"
              onClick={onRegister}
              className="text-[#C5221F] font-semibold hover:underline transition-all"
            >
              Đăng ký ngay
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
