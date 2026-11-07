import React, { useCallback, useEffect, useState } from 'react';
import { Mail, Users, Trash2, Share2, Bookmark, Filter as FilterIcon } from 'lucide-react';
import UserAvatar from '../../../components/common/UserAvatar';
import LoadingSkeleton from '../../../components/common/LoadingSkeleton';
import EmptyState from '../../../components/common/EmptyState';
import ErrorState from '../../../components/common/ErrorState';
import ConfirmModal from '../../../components/common/ConfirmModal';
import type { SavedFilter, SavedFilterCriteria, User } from '../../../types';
import { filterService } from '../../../services/filterService';
import { memberService } from '../../../services/memberService';
import { mapUserResponseToUser, useAuthStore } from '../../../store/authStore';
import { useProjectStore } from '../../../store/projectStore';
import { toast } from '../../../store/toastStore';
import { MESSAGES } from '../../../constants/messages';
import ShareFilterModal from '../components/ShareFilterModal';
import SubscribeModal from '../components/SubscribeModal';

function mapSavedFilter(raw: any): SavedFilter {
  let criteria: SavedFilterCriteria = {};
  if (raw?.filters && typeof raw.filters === 'object') {
    criteria = raw.filters as SavedFilterCriteria;
  } else if (typeof raw?.criteria === 'string' && raw.criteria.trim()) {
    try {
      criteria = JSON.parse(raw.criteria);
    } catch {
      criteria = {};
    }
  }

  const freq = String(raw?.frequency || '').toLowerCase();

  return {
    id: String(raw?.id ?? ''),
    name: raw?.name || '',
    owner: mapUserResponseToUser(raw?.owner),
    sharedWith: Array.isArray(raw?.sharedWith)
      ? raw.sharedWith.map((u: any) => mapUserResponseToUser(u))
      : [],
    emailSubscription: !!raw?.emailSubscription,
    frequency: freq === 'daily' ? 'daily' : freq === 'weekly' ? 'weekly' : undefined,
    filters: criteria || {},
    isShared: !!raw?.isShared,
  };
}

/** Gom tiêu chí của bộ lọc thành danh sách chip để hiển thị */
function criteriaChips(c: SavedFilterCriteria): string[] {
  const chips: string[] = [];
  if (c.keyword) chips.push(`từ khóa: ${c.keyword}`);
  (c.types || c.type || []).forEach((t) => chips.push(`loại: ${t}`));
  (c.statuses || c.status || []).forEach((s) => chips.push(`trạng thái: ${s}`));
  (c.priorities || c.priority || []).forEach((p) => chips.push(`ưu tiên: ${p}`));
  (c.labels || []).forEach((l) => chips.push(`nhãn: ${l}`));
  if ((c.assigneeIds || c.assignee || []).length > 0) {
    chips.push(`người thực hiện: ${(c.assigneeIds || c.assignee || []).length} người`);
  }
  if (c.fromDate) chips.push(`từ ngày: ${c.fromDate}`);
  if (c.toDate) chips.push(`đến ngày: ${c.toDate}`);
  if (c.quick) chips.push(`lọc nhanh: ${c.quick}`);
  return chips;
}

export default function SavedFilters() {
  const currentUser = useAuthStore((s) => s.user);
  const currentProject = useProjectStore((s) => s.currentProject);

  const [filters, setFilters] = useState<SavedFilter[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [sharingFilter, setSharingFilter] = useState<SavedFilter | null>(null);
  const [subscribingFilter, setSubscribingFilter] = useState<SavedFilter | null>(null);

  const fetchFilters = useCallback(async () => {
    setLoading(true);
    setLoadFailed(false);
    try {
      const res = await filterService.getSavedFilters();
      const raw: any = res?.data;
      const list: any[] = Array.isArray(raw) ? raw : raw?.content || [];
      setFilters(list.map(mapSavedFilter));
    } catch {
      setLoadFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFilters();
  }, [fetchFilters]);

  useEffect(() => {
    if (!currentProject?.id) {
      setMembers([]);
      return;
    }
    let active = true;
    memberService
      .getMembers(currentProject.id)
      .then((res) => {
        if (!active) return;
        const raw: any = res?.data;
        const list: any[] = Array.isArray(raw) ? raw : raw?.content || [];
        setMembers(list.map((m: any) => mapUserResponseToUser(m?.user || m)));
      })
      .catch(() => {
        if (active) setMembers([]);
      });
    return () => {
      active = false;
    };
  }, [currentProject?.id]);

  function isOwner(f: SavedFilter): boolean {
    return !!currentUser?.id && String(f.owner?.id) === String(currentUser.id);
  }

  async function handleDelete() {
    if (!deletingId) return;
    setBusyId(deletingId);
    try {
      await filterService.deleteFilter(deletingId);
      toast.success(MESSAGES.FILTER.DELETE_SUCCESS);
      setDeletingId(null);
      await fetchFilters();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || MESSAGES.COMMON.ACTION_FAILED);
    } finally {
      setBusyId(null);
    }
  }

  async function handleShare(userIds: string[]) {
    if (!sharingFilter) return;
    setBusyId(sharingFilter.id);
    try {
      await filterService.shareFilter(sharingFilter.id, userIds);
      toast.success(MESSAGES.FILTER.SHARE_SUCCESS);
      await fetchFilters();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || MESSAGES.COMMON.ACTION_FAILED);
    } finally {
      setBusyId(null);
      setSharingFilter(null);
    }
  }

  async function handleSubscribe(frequency: 'daily' | 'weekly') {
    if (!subscribingFilter) return;
    setBusyId(subscribingFilter.id);
    try {
      await filterService.updateSubscription(subscribingFilter.id, true, frequency);
      toast.success(MESSAGES.FILTER.SUBSCRIBE_SUCCESS);
      await fetchFilters();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || MESSAGES.COMMON.ACTION_FAILED);
    } finally {
      setBusyId(null);
      setSubscribingFilter(null);
    }
  }

  async function handleUnsubscribe(f: SavedFilter) {
    setBusyId(f.id);
    try {
      await filterService.updateSubscription(f.id, false);
      toast.success(MESSAGES.FILTER.UNSUBSCRIBE_SUCCESS);
      await fetchFilters();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || MESSAGES.COMMON.ACTION_FAILED);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="h-full overflow-y-auto bg-white">
      <div className="max-w-3xl mx-auto px-8 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-bold text-[#1A1A1A]">{MESSAGES.FILTER.PAGE_TITLE}</h1>
            <p className="text-sm text-[#6B6B70] mt-0.5">
              Quản lý các bộ lọc tìm kiếm, chia sẻ cho thành viên và đăng ký nhận email định kỳ
            </p>
          </div>
        </div>

        {loading && <LoadingSkeleton lines={4} />}

        {!loading && loadFailed && (
          <ErrorState
            title={MESSAGES.FILTER.LOAD_FAILED}
            message={MESSAGES.COMMON.NETWORK_ERROR}
            onRetry={fetchFilters}
          />
        )}

        {!loading && !loadFailed && filters.length === 0 && (
          <EmptyState
            icon={<FilterIcon className="w-6 h-6 text-[#9B9B9F]" />}
            title="Chưa có bộ lọc nào được lưu"
            description={MESSAGES.FILTER.EMPTY}
          />
        )}

        {!loading && !loadFailed && filters.length > 0 && (
          <div className="space-y-3">
            {filters.map((f) => {
              const chips = criteriaChips(f.filters);
              const owner = isOwner(f);
              const busy = busyId === f.id;

              return (
                <div
                  key={f.id}
                  className="bg-white border border-[#E5E5E7] rounded-xl p-5 hover:border-[#C5C5C8] transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Bookmark className="w-3.5 h-3.5 text-[#6B6B70]" />
                        <h3 className="text-sm font-semibold text-[#1A1A1A]">{f.name}</h3>
                        {!owner && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#F7F7F8] border border-[#E5E5E7] text-[#6B6B70]">
                            được chia sẻ với tôi
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {chips.length === 0 ? (
                          <span className="text-[10px] text-[#9B9B9F]">
                            Bộ lọc không có điều kiện cụ thể
                          </span>
                        ) : (
                          chips.map((chip) => (
                            <span
                              key={chip}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-[#F7F7F8] border border-[#E5E5E7] text-[#6B6B70]"
                            >
                              {chip}
                            </span>
                          ))
                        )}
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                          <UserAvatar
                            initials={f.owner?.initials}
                            name={f.owner?.name}
                            avatarUrl={f.owner?.avatarUrl}
                            size="xs"
                          />
                          <span className="text-xs text-[#6B6B70]">{f.owner?.name}</span>
                        </div>

                        {f.sharedWith.length > 0 && (
                          <div className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-[#9B9B9F]" />
                            <div className="flex -space-x-1.5">
                              {f.sharedWith.slice(0, 3).map((u) => (
                                <div key={u.id} className="ring-1 ring-white rounded-full">
                                  <UserAvatar initials={u.initials} name={u.name} size="xs" />
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

                    <div className="flex flex-col items-end gap-3 shrink-0">
                      <button
                        type="button"
                        disabled={!owner || busy}
                        title={owner ? '' : MESSAGES.FILTER.OWNER_ONLY}
                        onClick={() =>
                          f.emailSubscription ? handleUnsubscribe(f) : setSubscribingFilter(f)
                        }
                        className="flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
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
                          {f.emailSubscription
                            ? `Đã đăng ký (${f.frequency === 'daily' ? 'hàng ngày' : 'hàng tuần'})`
                            : 'Đăng ký nhận email'}
                        </div>
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          title="Áp dụng bộ lọc này để xem công việc"
                          onClick={() => {
                            window.history.pushState({}, '', '/board');
                            window.dispatchEvent(new PopStateEvent('popstate'));
                            toast.success(`Đang mở công việc theo bộ lọc "${f.name}"`);
                          }}
                          className="flex items-center gap-1 px-2.5 py-1 bg-[#1A1A1A] text-white rounded-lg text-xs font-medium hover:bg-black transition-colors"
                        >
                          <FilterIcon className="w-3 h-3" />
                          <span>Áp dụng</span>
                        </button>
                        <button
                          type="button"
                          disabled={!owner || busy}
                          title={owner ? 'Chia sẻ bộ lọc' : MESSAGES.FILTER.OWNER_ONLY}
                          onClick={() => setSharingFilter(f)}
                          className="text-[#9B9B9F] hover:text-[#1A1A1A] transition-colors disabled:opacity-40 disabled:cursor-not-allowed p-1 rounded"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={!owner || busy}
                          title={owner ? 'Xóa bộ lọc' : MESSAGES.FILTER.OWNER_ONLY}
                          onClick={() => setDeletingId(f.id)}
                          className="text-[#9B9B9F] hover:text-[#E53E3E] transition-colors disabled:opacity-40 disabled:cursor-not-allowed p-1 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ShareFilterModal
        isOpen={!!sharingFilter}
        filterName={sharingFilter?.name || ''}
        users={members.filter((m) => String(m.id) !== String(currentUser?.id))}
        onClose={() => setSharingFilter(null)}
        onShare={handleShare}
      />

      <SubscribeModal
        isOpen={!!subscribingFilter}
        filterName={subscribingFilter?.name || ''}
        initialFrequency={subscribingFilter?.frequency || 'weekly'}
        onClose={() => setSubscribingFilter(null)}
        onSubscribe={handleSubscribe}
      />

      <ConfirmModal
        isOpen={!!deletingId}
        title={MESSAGES.FILTER.PAGE_TITLE}
        message={MESSAGES.FILTER.DELETE_CONFIRM}
        confirmLabel="Xóa"
        isDanger
        onConfirm={handleDelete}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
}
