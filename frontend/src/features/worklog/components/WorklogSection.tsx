import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Clock, Plus } from 'lucide-react';
import type { Role, Worklog } from '../../../types';
import { worklogService } from '../../../services/worklogService';
import { mapUserResponseToUser, useAuthStore } from '../../../store/authStore';
import { toast } from '../../../store/toastStore';
import { MESSAGES } from '../../../constants/messages';
import { formatDuration, parseDuration } from '../../../utils/duration';
import LoadingSkeleton from '../../../components/common/LoadingSkeleton';
import ErrorState from '../../../components/common/ErrorState';
import LogWorkModal from './LogWorkModal';
import WorklogList from './WorklogList';

interface WorklogSectionProps {
  /** Mã công việc, ví dụ "EPMS-12" */
  issueKey: string;
  /** Ước lượng ban đầu dạng chuỗi, ví dụ "2h30m" */
  estimates?: string;
  /** Id người được phân công — chỉ người này được ghi nhận thời gian (UC008) */
  assigneeId?: string;
  /** @deprecated Không còn dùng để phân quyền (chỉ Assignee được log work) — giữ để không phải sửa nơi gọi */
  role?: Role;
  /** Gọi lại sau khi ghi nhận thời gian (để cha tải lại Issue vì remaining estimate đã đổi) */
  onChanged?: () => void;
}

function mapWorklog(raw: any): Worklog {
  const minutes = Number(raw?.timeSpentMinutes ?? 0) || parseDuration(raw?.timeSpent);
  return {
    id: String(raw?.id ?? ''),
    author: mapUserResponseToUser(raw?.author),
    timeSpent: raw?.timeSpent || formatDuration(minutes),
    timeSpentMinutes: minutes,
    date: raw?.date || '',
    comment: raw?.comment || undefined,
    createdAt: raw?.createdAt || '',
  };
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function WorklogSection({
  issueKey,
  estimates,
  assigneeId,
  role,
  onChanged,
}: WorklogSectionProps) {
  const currentUser = useAuthStore((s) => s.user);

  const [worklogs, setWorklogs] = useState<Worklog[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const fetchWorklogs = useCallback(async () => {
    if (!issueKey) return;
    setLoading(true);
    setLoadFailed(false);
    try {
      const res = await worklogService.getWorklogs(issueKey);
      const raw: any = res?.data;
      const list: any[] = Array.isArray(raw) ? raw : raw?.content || [];
      setWorklogs(list.map(mapWorklog));
    } catch {
      setLoadFailed(true);
    } finally {
      setLoading(false);
    }
  }, [issueKey]);

  useEffect(() => {
    fetchWorklogs();
  }, [fetchWorklogs]);

  const estimateMinutes = useMemo(() => parseDuration(estimates), [estimates]);
  const spentMinutes = useMemo(
    () => worklogs.reduce((sum, w) => sum + (w.timeSpentMinutes || 0), 0),
    [worklogs],
  );
  const remainingMinutes = Math.max(0, estimateMinutes - spentMinutes);
  const percent =
    estimateMinutes > 0 ? Math.min(100, Math.round((spentMinutes / estimateMinutes) * 100)) : 0;
  const isOverBudget = estimateMinutes > 0 && spentMinutes > estimateMinutes;

  // UC008 / BR-COL-04: Người được phân công (Assignee), PM của dự án, hoặc Admin được ghi nhận thời gian
  const isAssignee = !!currentUser?.id && !!assigneeId && String(currentUser.id) === String(assigneeId);
  // Luu y: authStore.mapUserResponseToUser chuan hoa role ve CHU THUONG
  // ('admin' | 'pm' | 'member'). So sanh voi 'ADMIN' chu hoa luon sai,
  // va 'systemRole' khong ton tai -> truoc day Admin khong bao gio ghi nhan duoc thoi gian.
  const isPmOrAdmin = role === 'pm' || role === 'admin' || currentUser?.role === 'admin';
  const canLog = isAssignee || isPmOrAdmin;

  async function handleLogWork(timeSpent: string, date: string, comment?: string) {
    const minutes = parseDuration(timeSpent);
    if (minutes <= 0) {
      toast.error(MESSAGES.WORKLOG.TIME_INVALID);
      throw new Error(MESSAGES.WORKLOG.TIME_INVALID);
    }
    if (date > todayIso()) {
      toast.error(MESSAGES.WORKLOG.DATE_IN_FUTURE);
      throw new Error(MESSAGES.WORKLOG.DATE_IN_FUTURE);
    }
    try {
      await worklogService.createWorklog(issueKey, { timeSpent, date, comment });
      toast.success(MESSAGES.WORKLOG.CREATE_SUCCESS);
      await fetchWorklogs();
      onChanged?.();
    } catch (err: any) {
      const errMsg =
        err?.response?.data?.message ||
        err?.data?.message ||
        err?.message ||
        (typeof err === 'string' ? err : null) ||
        MESSAGES.COMMON.ACTION_FAILED;
      toast.error(errMsg);
      throw new Error(errMsg);
    }
  }

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-[#6B6B70]" />
          <h4 className="text-[10px] font-semibold text-[#9B9B9F] uppercase tracking-wider">
            {MESSAGES.WORKLOG.SECTION_TITLE}
          </h4>
        </div>
        {canLog && (
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1 px-2.5 py-1 border border-[#E5E5E7] text-[10px] font-medium text-[#1A1A1A] rounded-lg hover:bg-[#F7F7F8] transition-colors"
          >
            <Plus className="w-3 h-3" /> {MESSAGES.WORKLOG.LOG_BUTTON}
          </button>
        )}
      </div>

      {/* Thanh tiến độ thời gian: Ước lượng vs Đã dành */}
      <div className="border border-[#E5E5E7] rounded-xl p-3 mb-3 bg-white">
        {estimateMinutes > 0 ? (
          <>
            <div className="h-1.5 w-full bg-[#F0F0F1] rounded-full overflow-hidden mb-2">
              <div
                className={`h-full rounded-full ${isOverBudget ? 'bg-[#E53E3E]' : 'bg-[#1A1A1A]'}`}
                style={{ width: `${Math.max(percent, spentMinutes > 0 ? 4 : 0)}%` }}
              />
            </div>
            <div className="grid grid-cols-3 gap-2 text-[10px]">
              <div>
                <p className="text-[#9B9B9F]">{MESSAGES.WORKLOG.ESTIMATE_LABEL}</p>
                <p className="text-[#1A1A1A] font-medium">{formatDuration(estimateMinutes)}</p>
              </div>
              <div>
                <p className="text-[#9B9B9F]">{MESSAGES.WORKLOG.SPENT_LABEL}</p>
                <p className={`font-medium ${isOverBudget ? 'text-[#E53E3E]' : 'text-[#1A1A1A]'}`}>
                  {formatDuration(spentMinutes)}
                </p>
              </div>
              <div>
                <p className="text-[#9B9B9F]">{MESSAGES.WORKLOG.REMAINING_LABEL}</p>
                <p className="text-[#1A1A1A] font-medium">{formatDuration(remainingMinutes)}</p>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-[#9B9B9F]">{MESSAGES.WORKLOG.NO_ESTIMATE}</span>
            <span className="text-[#1A1A1A] font-medium">
              {MESSAGES.WORKLOG.SPENT_LABEL}: {formatDuration(spentMinutes)}
            </span>
          </div>
        )}
      </div>

      {loading && <LoadingSkeleton lines={2} className="mb-3" />}

      {!loading && loadFailed && (
        <ErrorState
          title={MESSAGES.WORKLOG.LOAD_FAILED}
          message={MESSAGES.COMMON.NETWORK_ERROR}
          onRetry={fetchWorklogs}
          className="mb-3"
        />
      )}

      {!loading && !loadFailed && <WorklogList worklogs={worklogs} />}

      {!canLog && (
        <p className="text-[10px] text-[#9B9B9F] mt-2">{MESSAGES.WORKLOG.ONLY_ASSIGNEE}</p>
      )}

      <LogWorkModal
        isOpen={showModal}
        issueKey={issueKey}
        onClose={() => setShowModal(false)}
        onLogWork={handleLogWork}
      />
    </div>
  );
}
