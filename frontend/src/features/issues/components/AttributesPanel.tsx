import React from 'react';
import type { Issue } from '../../../types';
import UserAvatar from '../../../components/common/UserAvatar';
import PriorityTag from '../../../components/common/PriorityTag';
import { Paperclip } from 'lucide-react';

interface AttributesPanelProps {
  issue: Issue;
}

export default function AttributesPanel({ issue }: AttributesPanelProps) {
  function AttrRow({ label, children }: { label: string; children: React.ReactNode }) {
    return (
      <div className="flex items-start gap-3 py-2 border-b border-[#F0F0F1] last:border-0">
        <span className="text-xs text-[#9B9B9F] w-24 shrink-0 mt-0.5">{label}</span>
        <div className="flex-1 text-xs text-[#1A1A1A]">{children}</div>
      </div>
    );
  }

  return (
    <div className="border border-[#E5E5E7] rounded-lg overflow-hidden bg-white">
      <AttrRow label="Người thực hiện">
        {issue.assignee ? (
          <div className="flex items-center gap-2">
            <UserAvatar initials={issue.assignee.initials} size="xs" />
            <span>{issue.assignee.name}</span>
          </div>
        ) : (
          <span className="text-[#9B9B9F]">Chưa phân công</span>
        )}
      </AttrRow>

      <AttrRow label="Người báo cáo">
        <div className="flex items-center gap-2">
          <UserAvatar initials={issue.reporter.initials} size="xs" />
          <span>{issue.reporter.name}</span>
        </div>
      </AttrRow>

      <AttrRow label="Độ ưu tiên">
        <PriorityTag priority={issue.priority} />
      </AttrRow>

      {issue.labels && issue.labels.length > 0 && (
        <AttrRow label="Nhãn">
          <div className="flex flex-wrap gap-1">
            {issue.labels.map((l) => (
              <span
                key={l}
                className="text-[10px] px-1.5 py-0.5 rounded bg-[#F7F7F8] border border-[#E5E5E7] text-[#6B6B70]"
              >
                {l}
              </span>
            ))}
          </div>
        </AttrRow>
      )}

      {issue.estimates && (
        <AttrRow label="Ước tính">
          <span>{issue.estimates}</span>
        </AttrRow>
      )}

      {issue.dueDate && (
        <AttrRow label="Hạn chót">
          <span
            className={
              new Date(issue.dueDate) < new Date() ? 'text-[#E53E3E] font-medium' : ''
            }
          >
            {issue.dueDate}
          </span>
        </AttrRow>
      )}

      {issue.environment && (
        <AttrRow label="Môi trường">
          <span>{issue.environment}</span>
        </AttrRow>
      )}

      {issue.epicLink && (
        <AttrRow label="Liên kết Epic">
          <span className="font-mono text-[11px] text-[#6B6B70]">{issue.epicLink}</span>
        </AttrRow>
      )}

      {issue.attachments && issue.attachments.length > 0 && (
        <AttrRow label="Tệp đính kèm">
          <div className="space-y-1">
            {issue.attachments.map((a) => (
              <div
                key={a}
                className="flex items-center gap-1.5 text-[#6B6B70] hover:text-[#1A1A1A] cursor-pointer"
              >
                <Paperclip className="w-3 h-3" />
                <span className="text-[11px]">{a}</span>
              </div>
            ))}
          </div>
        </AttrRow>
      )}
    </div>
  );
}
