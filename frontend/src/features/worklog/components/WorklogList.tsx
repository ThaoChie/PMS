import React from 'react';
import type { Worklog } from '../../../types';
import UserAvatar from '../../../components/common/UserAvatar';
import { formatDate } from '../../../utils/date';
import { Clock } from 'lucide-react';

interface WorklogListProps {
  worklogs: Worklog[];
}

export default function WorklogList({ worklogs }: WorklogListProps) {
  if (worklogs.length === 0) {
    return <p className="text-xs text-[#9B9B9F] text-center py-4">Chưa có bản ghi thời gian nào</p>;
  }

  return (
    <div className="border border-[#E5E5E7] rounded-xl overflow-hidden divide-y divide-[#F0F0F1] bg-white">
      {worklogs.map((w) => (
        <div key={w.id} className="p-3 flex items-start gap-3 hover:bg-[#F7F7F8] transition-colors">
          <UserAvatar initials={w.author.initials} size="xs" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-[#1A1A1A]">{w.author.name}</span>
              <span className="text-[10px] text-[#9B9B9F]">{formatDate(w.date)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#E53E3E] font-medium mb-1">
              <Clock className="w-3 h-3" />
              <span>{w.timeSpent}</span>
            </div>
            {w.comment && <p className="text-xs text-[#6B6B70] leading-relaxed">{w.comment}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}
