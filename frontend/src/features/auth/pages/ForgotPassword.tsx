import React, { useState } from 'react';
import { ArrowLeft, Send } from 'lucide-react';
import { MESSAGES } from '../../../constants/messages';
import { authService } from '../../../services/authService';

interface ForgotPasswordProps {
  onBack: () => void;
}

export default function ForgotPassword({ onBack }: ForgotPasswordProps) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await authService.forgotPassword(email);
      setSubmitted(true);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-10 selection:bg-[#FDF2F2] selection:text-[#C5221F]">
      <div className="w-full max-w-[420px] mx-auto">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs text-[#64748B] hover:text-[#1E293B] mb-6 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Quay lại đăng nhập
        </button>

        {/* Logo VJU */}
        <div className="flex justify-center mb-4">
          <img
            src="/logoVJU.png"
            alt="Vietnam Japan University"
            className="w-20 h-20 sm:w-22 sm:h-22 object-contain select-none"
          />
        </div>

        <div className="text-center mb-6">
          <h2 className="text-2xl sm:text-[26px] font-bold text-[#1E293B] tracking-tight">
            Quên mật khẩu
          </h2>
          <p className="text-sm text-[#64748B] mt-1">
            Nhập email của bạn để nhận liên kết đặt lại mật khẩu
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs sm:text-sm font-medium">
            {error}
          </div>
        )}

        {submitted ? (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 text-center space-y-2">
            <p className="font-semibold text-emerald-900">Đã gửi yêu cầu thành công!</p>
            <p>{MESSAGES.AUTH.FORGOT_PASSWORD_SENT}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-[#334155] mb-1.5">
                Email đã đăng ký <span className="text-[#C5221F] font-bold">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ten@congty.com"
                className="w-full px-4 py-2.5 sm:py-3 border border-[#E2E8F0] rounded-xl text-sm text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#C5221F] focus:ring-1 focus:ring-[#C5221F] transition-all bg-white"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 sm:py-3 bg-[#C5221F] hover:bg-[#AA1D1B] text-white text-sm sm:text-base font-semibold rounded-xl shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <Send className="w-4 h-4" />
              <span>{loading ? 'Đang gửi...' : 'Gửi liên kết'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
