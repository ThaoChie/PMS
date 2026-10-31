import React, { useState } from 'react';
import { Eye, EyeOff, Check } from 'lucide-react';
import { userService } from '../../../services/userService';

interface ChangePasswordFormProps {
  onSuccess?: () => void;
}

function getPasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
  bg: string;
} {
  if (!password) {
    return { score: 0, label: '', color: '', bg: '' };
  }
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) {
    return { score: 1, label: 'Rất yếu', color: 'text-red-500', bg: 'bg-red-500' };
  }
  if (score === 2) {
    return { score: 2, label: 'Yếu', color: 'text-amber-500', bg: 'bg-amber-500' };
  }
  if (score === 3 || score === 4) {
    return { score: 3, label: 'Khá tốt', color: 'text-blue-500', bg: 'bg-blue-500' };
  }
  return { score: 4, label: 'Rất mạnh', color: 'text-emerald-500', bg: 'bg-emerald-500' };
}

interface PwInputRowProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  show: boolean;
  onToggleShow: () => void;
  children?: React.ReactNode;
}

function PwInputRow({
  label,
  value,
  onChange,
  show,
  onToggleShow,
  children,
}: PwInputRowProps) {
  return (
    <div>
      <label className="block text-xs font-medium text-[#1A1A1A] mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2.5 pr-10 border border-[#E5E5E7] rounded-lg text-sm text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] transition-colors"
          placeholder="••••••••"
        />
        <button
          type="button"
          tabIndex={-1}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6B70] hover:text-[#1A1A1A] p-1 cursor-pointer"
          onClick={onToggleShow}
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {children}
    </div>
  );
}

export default function ChangePasswordForm({ onSuccess }: ChangePasswordFormProps) {
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [showPw, setShowPw] = useState({ current: false, next: false, confirm: false });
  const [pwSaved, setPwSaved] = useState(false);
  const [pwError, setPwError] = useState('');
  const [loading, setLoading] = useState(false);

  const strength = getPasswordStrength(pwForm.next);

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

  return (
    <div className="bg-white border border-[#E5E5E7] rounded-xl p-6">
      <h2 className="text-sm font-semibold text-[#1A1A1A] mb-1">Đổi mật khẩu</h2>
      <p className="text-xs text-[#6B6B70] mb-5">
        Mật khẩu mới cần tối thiểu 6 ký tự. Nên kết hợp chữ hoa, chữ thường, số và ký tự đặc biệt.
      </p>
      <form onSubmit={handleSavePw} className="space-y-4 max-w-sm">
        <PwInputRow
          label="Mật khẩu hiện tại"
          value={pwForm.current}
          onChange={(val) => setPwForm((f) => ({ ...f, current: val }))}
          show={showPw.current}
          onToggleShow={() => setShowPw((s) => ({ ...s, current: !s.current }))}
        />

        <PwInputRow
          label="Mật khẩu mới"
          value={pwForm.next}
          onChange={(val) => setPwForm((f) => ({ ...f, next: val }))}
          show={showPw.next}
          onToggleShow={() => setShowPw((s) => ({ ...s, next: !s.next }))}
        >
          {pwForm.next && (
            <div className="mt-2 space-y-1.5">
              <div className="flex gap-1.5">
                {[1, 2, 3, 4].map((step) => (
                  <div
                    key={step}
                    className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                      step <= strength.score ? strength.bg : 'bg-[#E5E5E7]'
                    }`}
                  />
                ))}
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-[#6B6B70]">Độ mạnh mật khẩu:</span>
                <span className={`font-semibold ${strength.color}`}>{strength.label}</span>
              </div>
            </div>
          )}
        </PwInputRow>

        <PwInputRow
          label="Xác nhận mật khẩu mới"
          value={pwForm.confirm}
          onChange={(val) => setPwForm((f) => ({ ...f, confirm: val }))}
          show={showPw.confirm}
          onToggleShow={() => setShowPw((s) => ({ ...s, confirm: !s.confirm }))}
        />

        {pwError && (
          <div className="bg-[#FDECEC] border border-[#E53E3E]/20 rounded-lg px-3 py-2">
            <p className="text-xs text-[#E53E3E]">{pwError}</p>
          </div>
        )}
        <div className="flex items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-[#1A1A1A] text-white text-xs font-medium rounded-lg hover:bg-[#333] disabled:opacity-60 transition-colors cursor-pointer"
          >
            {loading ? 'Đang cập nhật…' : 'Cập nhật mật khẩu'}
          </button>
          {pwSaved && (
            <span className="flex items-center gap-1.5 text-xs text-[#1A1A1A]">
              <Check className="w-3.5 h-3.5" /> Đã cập nhật ✓
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
