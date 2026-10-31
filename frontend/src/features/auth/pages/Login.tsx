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
  const [googleLoading, setGoogleLoading] = useState(false);
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
            // Error fetching me
          }
        }
        if (!userObj) {
          setError('Không thể tải thông tin tài khoản người dùng từ máy chủ. Vui lòng thử lại.');
          return;
        }
        useAuthStore.getState().login(userObj, res.data.accessToken);
        onLogin();
      } else {
        setError(res?.message || 'Email và/hoặc mật khẩu chưa đúng');
      }
    } catch (err: any) {
      const rawMsg = err?.response?.data?.message || err?.message || '';
      let msg = 'Email và/hoặc mật khẩu chưa đúng';
      if (err?.code === 'ECONNABORTED' || (typeof rawMsg === 'string' && rawMsg.toLowerCase().includes('timeout'))) {
        msg = 'Máy chủ đang khởi động lại (Render Cold Start mất khoảng 30–45s). Hệ thống đã được đánh thức, bạn vui lòng nhấn "Đăng nhập" lại một lần nữa nhé!';
      } else if (rawMsg === 'Network Error' || (err?.isAxiosError && !err.response)) {
        msg = 'Không thể kết nối đến máy chủ backend (máy chủ Render đang khởi động). Vui lòng thử lại sau giây lát.';
      } else if (rawMsg) {
        msg = rawMsg;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleTokenReceived(idToken: string) {
    setGoogleLoading(true);
    setError(null);
    try {
      const res = await authService.googleLogin(idToken);
      if (res?.success || res?.data?.accessToken) {
        let userObj = res.data?.user ? mapUserResponseToUser(res.data.user) : null;
        if (!userObj) {
          try {
            const meRes = await userService.getMe();
            if (meRes?.data) {
              userObj = mapUserResponseToUser(meRes.data);
            }
          } catch {
            // Error fetching me
          }
        }
        if (!userObj) {
          setError('Không thể tải thông tin tài khoản Google từ máy chủ.');
          return;
        }
        useAuthStore.getState().login(userObj, res.data.accessToken);
        onLogin();
      } else {
        setError(res?.message || 'Đăng nhập bằng Google không thành công');
      }
    } catch (err: any) {
      const rawMsg = err?.response?.data?.message || err?.message || '';
      setError(rawMsg || 'Xác thực tài khoản Google thất bại. Vui lòng kiểm tra lại ID Token.');
    } finally {
      setGoogleLoading(false);
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
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs sm:text-sm font-medium leading-relaxed">
            {error}
          </div>
        )}

        {/* Email & Password Login Form */}
        <EmailLoginForm
          onSubmit={handleEmailSubmit}
          onForgotPassword={onForgotPassword}
          loading={loading}
        />

        {/* Divider Hoặc */}
        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#E2E8F0]" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-3 text-[#64748B] font-medium tracking-wide">
              Hoặc tiếp tục với
            </span>
          </div>
        </div>

        {/* Google Official Login Button */}
        <GoogleLoginButton
          onTokenReceived={handleGoogleTokenReceived}
          onError={(msg) => setError(msg)}
          loading={googleLoading}
        />

        {/* Footer Link */}
        <div className="mt-5 text-center text-xs text-[#64748B]">
          Chưa có tài khoản?{' '}
          <button
            type="button"
            onClick={onRegister}
            className="text-[#C5221F] font-semibold hover:underline transition-all cursor-pointer"
          >
            Đăng ký ngay
          </button>
        </div>
      </div>
    </div>
  );
}
