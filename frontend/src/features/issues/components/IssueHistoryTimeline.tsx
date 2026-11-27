import React, { useEffect, useState, useCallback } from 'react';
import { History, ArrowRight, ShieldAlert, CheckCircle2, AlertCircle } from 'lucide-react';
import { issueService } from '../../../services/issueService';
import type { IssueStatusHistoryItem } from '../../../types';
import UserAvatar from '../../../components/common/UserAvatar';
import { formatDateTime } from '../../../utils/date';
import LoadingSkeleton from '../../../components/common/LoadingSkeleton';

interface IssueHistoryTimelineProps {
  issueKey: string;
  refreshTrigger?: number;
}

export default function IssueHistoryTimeline({ issueKey, refreshTrigger }: IssueHistoryTimelineProps) {
  const [history, setHistory] = useState<IssueStatusHistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!issueKey) return;
    setLoading(true);
    setError(null);
    try {
      const res = await issueService.getIssueHistory(issueKey);
      const list = res?.data || [];
      // Sort newest first for convenient timeline viewing
      setHistory(Array.isArray(list) ? [...list].reverse() : []);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Không thể tải lịch sử chuyển trạng thái');
    } finally {
      setLoading(false);
    }
  }, [issueKey]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory, refreshTrigger]);

  if (loading) {
    return <LoadingSkeleton lines={3} className="py-2" />;
  }

  if (error) {
    return (
      <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
        <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
        <span>{error}</span>
        <button
          type="button"
          onClick={fetchHistory}
          className="ml-auto underline font-medium hover:text-red-900"
        >
          Thử lại
        </button>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="py-8 text-center text-xs text-[#9B9B9F] border border-dashed border-[#E5E5E7] rounded-lg bg-[#FAF9F8]">
        <History className="w-5 h-5 mx-auto mb-1.5 text-[#C5C5C8]" />
        Chưa có lịch sử chuyển trạng thái nào
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {history.map((item) => {
        const authorName = item.changedBy?.fullName || item.changedBy?.name || item.changedBy?.email || 'Hệ thống';
        const initials = item.changedBy?.initials || authorName.slice(0, 2).toUpperCase();
        const fromStatus = item.fromStatus || 'Khởi tạo';
        const toStatus = item.toStatus;

        // Parse comments/fields lines
        const commentLines = item.comment ? item.comment.split('\n').filter(Boolean) : [];

        return (
          <div
            key={item.id}
            className="p-3 bg-white border border-[#E5E5E7] rounded-lg shadow-sm hover:border-[#C5C5C8] transition-colors"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <UserAvatar initials={initials} size="xs" />
                <div>
                  <span className="text-xs font-semibold text-[#1A1A1A]">{authorName}</span>
                  <div className="text-[10px] text-[#9B9B9F]">{formatDateTime(item.changedAt)}</div>
                </div>
              </div>

              {/* Status Transition Badge */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="px-2 py-0.5 bg-[#F7F7F8] border border-[#E5E5E7] rounded text-[#6B6B70] text-[11px] font-medium">
                  {fromStatus}
                </span>
                <ArrowRight className="w-3 h-3 text-[#9B9B9F]" />
                <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 rounded text-emerald-800 text-[11px] font-semibold">
                  {toStatus}
                </span>
              </div>
            </div>

            {/* Required Fields & Comment Details */}
            {commentLines.length > 0 && (
              <div className="mt-2.5 pt-2 border-t border-[#F0F0F1] space-y-1.5">
                {commentLines.map((line, idx) => {
                  const colonIndex = line.indexOf(':');
                  if (colonIndex > 0) {
                    const label = line.slice(0, colonIndex).trim();
                    const val = line.slice(colonIndex + 1).trim();
                    const isReject = label.toLowerCase().includes('từ chối') || label.toLowerCase().includes('reject');

                    return (
                      <div
                        key={idx}
                        className={`text-xs px-2.5 py-1.5 rounded-md flex items-start gap-1.5 ${
                          isReject
                            ? 'bg-red-50 border border-red-200 text-red-900'
                            : 'bg-[#F7F7F8] border border-[#E5E5E7] text-[#1A1A1A]'
                        }`}
                      >
                        {isReject ? (
                          <ShieldAlert className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#6B6B70] shrink-0 mt-0.5" />
                        )}
                        <div>
                          <strong className="font-semibold">{label}:</strong>{' '}
                          <span className="whitespace-pre-wrap">{val}</span>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <p key={idx} className="text-xs text-[#4A4A4F] whitespace-pre-wrap pl-1">
                      {line}
                    </p>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
