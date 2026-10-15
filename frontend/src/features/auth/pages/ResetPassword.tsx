import React, { useState } from 'react';
import { KanbanSquare, Eye, EyeOff } from 'lucide-react';
import { MESSAGES } from '../../../constants/messages';
import { authService } from '../../../services/authService';

interface ResetPasswordProps {
  token?: string;
  onSuccess: () => void;
}

export default function ResetPassword({ token: propToken, onSuccess }: ResetPasswordProps) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const token =
    propToken ||
    (typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('token') || ''
      : '');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!token) {
      setError('Token đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.');
      return;
    }
    if (password.length < 8) {
      setError('Mật khẩu tối thiểu 8 ký tự');
      return;
    }
    if (password !== confirm) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    setLoading(true);
    try {
      await authService.resetPassword(token, password);
      setSuccessMsg('Đặt lại mật khẩu thành công! Bạn có thể đăng nhập ngay.');
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err: any) {
      const rawMsg = err?.response?.data?.message || err?.message || '';
      let msg = 'Không thể đặt lại mật khẩu. Token có thể đã hết hạn.';
      if (err?.code === 'ECONNABORTED' || (typeof rawMsg === 'string' && rawMsg.toLowerCase().includes('timeout'))) {
        msg = 'Máy chủ đang khởi động lại (Render Cold Start mất khoảng 30–45s). Hệ thống đã được đánh thức, bạn vui lòng bấm lại nhé!';
      } else if (rawMsg) {
        msg = rawMsg;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-white">
      <div className="w-full max-w-[360px]">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-xl bg-[#E53E3E] flex items-center justify-center">
            <KanbanSquare className="w-5 h-5 text-white" />
          </div>
          <span className="text-[#1A1A1A] font-semibold text-lg tracking-tight">EPMS</span>
        </div>

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-[#1A1A1A] mb-1">Set new password</h2>
          <p className="text-sm text-[#6B6B70]">Enter your new password below</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-[#FDECEC] border border-[#FBD5D5] rounded-lg text-xs text-[#E53E3E]">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#1A1A1A] mb-1.5">New password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                placeholder="Min. 8 characters"
                className="w-full px-3 py-2.5 pr-10 border border-[#E5E5E7] rounded-lg text-sm text-[#1A1A1A] placeholder:text-[#9B9B9F] focus:outline-none focus:border-[#1A1A1A] transition-colors"
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6B70] hover:text-[#1A1A1A]"
                onClick={() => setShowPassword((s) => !s)}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#1A1A1A] mb-1.5">
              Confirm new password
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirm}
              onChange={(e) => {
                setConfirm(e.target.value);
                setError('');
              }}
              placeholder="Confirm new password"
              className="w-full px-3 py-2.5 border border-[#E5E5E7] rounded-lg text-sm text-[#1A1A1A] placeholder:text-[#9B9B9F] focus:outline-none focus:border-[#1A1A1A] transition-colors"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-[#E53E3E] text-white text-sm font-medium rounded-lg hover:bg-[#C53030] disabled:opacity-60 transition-colors"
          >
            {loading ? 'Updating…' : 'Update password'}
          </button>
        </form>
      </div>
    </div>
  );
}
