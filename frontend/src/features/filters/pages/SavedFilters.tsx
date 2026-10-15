import React, { useState } from 'react';
import { Mail, Users, Trash2, ChevronDown } from 'lucide-react';
import { savedFilters } from '../../../data/mockData';
import UserAvatar from '../../../components/common/UserAvatar';
import type { SavedFilter } from '../../../types';

export default function SavedFilters() {
  const [filters, setFilters] = useState<SavedFilter[]>(savedFilters.map((f) => ({ ...f } as any)));

  function toggleSub(id: string) {
    setFilters((fs) =>
      fs.map((f) =>
        f.id === id ? { ...f, emailSubscription: !f.emailSubscription } : f,
      ),
    );
  }

  function setFreq(id: string, freq: 'daily' | 'weekly') {
    setFilters((fs) => fs.map((f) => (f.id === id ? { ...f, frequency: freq } : f)));
  }

  return (
    <div className="h-full overflow-y-auto bg-white">
      <div className="max-w-3xl mx-auto px-8 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-bold text-[#1A1A1A]">Bộ lọc đã lưu</h1>
            <p className="text-sm text-[#6B6B70] mt-0.5">
              Quản lý các bộ lọc tìm kiếm và đăng ký thông báo qua email
            </p>
          </div>
        </div>

        {filters.length === 0 ? (
          <div className="flex flex-col items-center py-24 text-center">
            <div className="w-12 h-12 mb-4 text-[#E5E5E7]">
              <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="22" cy="20" r="10" strokeLinecap="round" />
                <path d="m30 30 8 8M18 15h8M18 20h5" strokeLinecap="round" />
              </svg>
            </div>
            <p className="text-sm font-medium text-[#1A1A1A] mb-1">Chưa có bộ lọc nào được lưu</p>
            <p className="text-xs text-[#6B6B70]">
              Lưu một bộ lọc từ trang Danh sách công việc để xem tại đây
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filters.map((f) => (
              <div
                key={f.id}
                className="bg-white border border-[#E5E5E7] rounded-xl p-5 hover:border-[#C5C5C8] transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-[#1A1A1A] mb-1">{f.name}</h3>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {f.filters.type?.map((t) => (
                        <span
                          key={t}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-[#F7F7F8] border border-[#E5E5E7] text-[#6B6B70]"
                        >
                          loại:{t}
                        </span>
                      ))}
                      {f.filters.status?.map((s) => (
                        <span
                          key={s}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-[#F7F7F8] border border-[#E5E5E7] text-[#6B6B70]"
                        >
                          trạng thái:{s}
                        </span>
                      ))}
                      {f.filters.priority?.map((p) => (
                        <span
                          key={p}
                          className={`text-[10px] px-1.5 py-0.5 rounded border ${
                            p === 'Critical'
                              ? 'bg-[#FDECEC] border-[#E53E3E]/20 text-[#E53E3E]'
                              : 'bg-[#F7F7F8] border-[#E5E5E7] text-[#6B6B70]'
                          }`}
                        >
                          ưu tiên:{p}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Owner */}
                      <div className="flex items-center gap-1.5">
                        <UserAvatar initials={f.owner.initials} size="xs" />
                        <span className="text-xs text-[#6B6B70]">{f.owner.name}</span>
                      </div>

                      {/* Shared with */}
                      {f.sharedWith.length > 0 && (
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-[#9B9B9F]" />
                          <div className="flex -space-x-1.5">
                            {f.sharedWith.slice(0, 3).map((u) => (
                              <div key={u.id} className="ring-1 ring-white rounded-full">
                                <UserAvatar initials={u.initials} size="xs" />
                              </div>
                            ))}
                          </div>
                          <span className="text-xs text-[#6B6B70]">
                            {f.sharedWith.length} người
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: email subscription */}
                  <div className="flex flex-col items-end gap-3 shrink-0">
                    <button
                      type="button"
                      onClick={() => toggleSub(f.id)}
                      className="flex items-center gap-1.5"
                    >
                      <div
                        className={`w-8 h-4 rounded-full transition-colors relative ${
                          f.emailSubscription ? 'bg-[#1A1A1A]' : 'bg-[#E5E5E7]'
                        }`}
                      >
                        <div
                          className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${
                            f.emailSubscription ? 'translate-x-4' : 'translate-x-0.5'
                          }`}
                        />
                      </div>
                      <div className="flex items-center gap-1 text-xs text-[#6B6B70]">
                        <Mail className="w-3 h-3" />
                        {f.emailSubscription ? 'Đã đăng ký nhận tin' : 'Đăng ký nhận tin'}
                      </div>
                    </button>

                    {f.emailSubscription && (
                      <div className="relative">
                        <select
                          value={f.frequency ?? 'weekly'}
                          onChange={(e) =>
                            setFreq(f.id, e.target.value as 'daily' | 'weekly')
                          }
                          className="text-[10px] text-[#6B6B70] bg-[#F7F7F8] border border-[#E5E5E7] rounded-lg px-2 py-1 focus:outline-none appearance-none pr-5"
                        >
                          <option value="daily">Bản tin hàng ngày</option>
                          <option value="weekly">Bản tin hàng tuần</option>
                        </select>
                        <ChevronDown className="w-2.5 h-2.5 text-[#9B9B9F] absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    )}

                    <button
                      type="button"
                      className="text-[#9B9B9F] hover:text-[#E53E3E] transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
