import React, { useState } from 'react';
import { Eye, EyeOff, Check } from 'lucide-react';

import { userService } from '../../../services/userService';

interface ChangePasswordFormProps {
  onSuccess?: () => void;
}

export default function ChangePasswordForm({ onSuccess }: ChangePasswordFormProps) {
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [showPw, setShowPw] = useState({ current: false, next: false, confirm: false });
  const [pwSaved, setPwSaved] = useState(false);
  const [pwError, setPwError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSavePw(e: React.FormEvent) {
    e.preventDefault();
    setPwError('');
    if (!pwForm.current) {
      setPwError('Vui lòng nhập mật khẩu hiện tại');
      return;
    }
    if (pwForm.next.length < 6) {
      setPwError('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }
    if (pwForm.next !== pwForm.confirm) {
      setPwError('Mật khẩu xác nhận không khớp');
      return;
    }
    setLoading(true);
    try {
      await userService.changePassword(pwForm.current, pwForm.next);
      setPwSaved(true);
      setPwForm({ current: '', next: '', confirm: '' });
      setTimeout(() => setPwSaved(false), 2500);
      onSuccess?.();
    } catch (err: any) {
      setPwError(err?.response?.data?.message || err?.message || 'Không thể đổi mật khẩu');
    } finally {
      setLoading(false);
    }
  }

  function PwField({ k, label }: { k: keyof typeof pwForm; label: string }) {
    return (
      <div>
        <label className="block text-xs font-medium text-[#1A1A1A] mb-1.5">{label}</label>
        <div className="relative">
          <input
            type={showPw[k] ? 'text' : 'password'}
            value={pwForm[k]}
            onChange={(e) => setPwForm((f) => ({ ...f, [k]: e.target.value }))}
            className="w-full px-3 py-2.5 pr-10 border border-[#E5E5E7] rounded-lg text-sm text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] transition-colors"
            placeholder="••••••••"
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6B70] hover:text-[#1A1A1A]"
            onClick={() => setShowPw((s) => ({ ...s, [k]: !s[k] }))}
          >
            {showPw[k] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#E5E5E7] rounded-xl p-6">
      <h2 className="text-sm font-semibold text-[#1A1A1A] mb-1">Change password</h2>
      <p className="text-xs text-[#6B6B70] mb-5">Choose a password at least 8 characters long.</p>
      <form onSubmit={handleSavePw} className="space-y-4 max-w-sm">
        <PwField k="current" label="Current password" />
        <PwField k="next" label="New password" />
        <PwField k="confirm" label="Confirm new password" />
        {pwError && (
          <div className="bg-[#FDECEC] border border-[#E53E3E]/20 rounded-lg px-3 py-2">
            <p className="text-xs text-[#E53E3E]">{pwError}</p>
          </div>
        )}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-[#1A1A1A] text-white text-xs font-medium rounded-lg hover:bg-[#333] disabled:opacity-60 transition-colors"
          >
            {loading ? 'Updating…' : 'Update password'}
          </button>
          {pwSaved && (
            <span className="flex items-center gap-1.5 text-xs text-[#1A1A1A]">
              <Check className="w-3.5 h-3.5" /> Updated
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
