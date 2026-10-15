import React, { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import AvatarUpload from '../components/AvatarUpload';
import ChangePasswordForm from '../components/ChangePasswordForm';
import { useAuthStore, mapUserResponseToUser } from '../../../store/authStore';
import { userService } from '../../../services/userService';

export default function Profile() {
  const { user, updateUser } = useAuthStore();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }
  }, [user]);

  const isGoogleAccount = user?.isGoogleAccount;

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await userService.updateMe({ name });
      if (res?.data) {
        const mapped = mapUserResponseToUser(res.data);
        updateUser(mapped);
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Không thể lưu thông tin hồ sơ');
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatarUpload(file: File) {
    try {
      const res = await userService.updateAvatar(file);
      if (res?.data?.avatarUrl) {
        updateUser({ avatarUrl: res.data.avatarUrl });
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Không thể tải lên ảnh đại diện');
    }
  }

  const currentUser = user || {
    id: '',
    name: name || 'Người dùng',
    email: email || '',
    initials: (name || 'U').slice(0, 2).toUpperCase(),
    role: 'member' as const,
    status: 'Active' as const,
  };

  return (
    <div className="h-full overflow-y-auto bg-white">
      <div className="max-w-2xl mx-auto px-8 py-10">
        <div className="mb-8">
          <h1 className="text-xl font-bold text-[#1A1A1A]">Hồ sơ cá nhân</h1>
          <p className="text-sm text-[#6B6B70] mt-0.5">
            Quản lý thông tin cá nhân và cài đặt tài khoản của bạn
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs sm:text-sm font-medium">
            {error}
          </div>
        )}

        {/* Profile section */}
        <div className="bg-white border border-[#E5E5E7] rounded-xl p-6 mb-5">
          <h2 className="text-sm font-semibold text-[#1A1A1A] mb-5">Thông tin tài khoản</h2>

          <AvatarUpload user={currentUser} onUpload={handleAvatarUpload} />

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#1A1A1A] mb-1.5">
                  Tên hiển thị
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2.5 border border-[#E5E5E7] rounded-lg text-sm text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#1A1A1A] mb-1.5">
                  Địa chỉ email
                </label>
                <input
                  value={email}
                  disabled
                  className="w-full px-3 py-2.5 border border-[#E5E5E7] rounded-lg text-sm text-[#9B9B9F] bg-[#F7F7F8] cursor-not-allowed"
                />
              </div>
            </div>
            <div className="flex items-center gap-3 pt-1">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-[#E53E3E] text-white text-xs font-medium rounded-lg hover:bg-[#C53030] disabled:opacity-60 transition-colors"
              >
                {saving ? 'Đang lưu…' : 'Lưu thay đổi'}
              </button>
              {saved && (
                <span className="flex items-center gap-1.5 text-xs text-[#1A1A1A]">
                  <Check className="w-3.5 h-3.5" /> Đã lưu ✓
                </span>
              )}
            </div>
          </form>
        </div>

        {/* Change password section */}
        {!isGoogleAccount ? (
          <ChangePasswordForm />
        ) : (
          <div className="bg-[#F7F7F8] border border-[#E5E5E7] rounded-xl p-5">
            <p className="text-xs text-[#6B6B70]">
              Tài khoản của bạn được liên kết qua Google. Quản lý mật khẩu được xử lý thông qua tài khoản Google của bạn.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
