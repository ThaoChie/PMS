import React from 'react';
import { CheckSquare } from 'lucide-react';
import type { SubTask } from '../../../types';
import UserAvatar from '../../../components/common/UserAvatar';

interface SubtaskSectionProps {
  subtasks: SubTask[];
  onSelectSubtask?: (key: string) => void;
}

export default function SubtaskSection({ subtasks, onSelectSubtask }: SubtaskSectionProps) {
  if (!subtasks || subtasks.length === 0) return null;

  return (
    <div className="mb-5">
      <h4 className="text-[10px] font-semibold text-[#9B9B9F] uppercase tracking-wider mb-2">
        Sub-tasks ({subtasks.length})
      </h4>
      <div className="border border-[#E5E5E7] rounded-lg overflow-hidden divide-y divide-[#F0F0F1] bg-white">
        {subtasks.map((st) => (
          <div
            key={st.id}
            onClick={() => onSelectSubtask?.(st.key)}
            className="flex items-center gap-3 px-3 py-2.5 hover:bg-[#F7F7F8] cursor-pointer transition-colors"
          >
            <CheckSquare
              className={`w-3.5 h-3.5 shrink-0 ${
                st.status === 'Done' ? 'text-[#6B6B70]' : 'text-[#C5C5C8]'
              }`}
            />
            <span className="text-[11px] font-mono text-[#9B9B9F]">{st.key}</span>
            <span
              className={`text-xs flex-1 truncate ${
                st.status === 'Done' ? 'text-[#9B9B9F] line-through' : 'text-[#1A1A1A]'
              }`}
            >
              {st.summary}
            </span>
            {st.assignee && <UserAvatar initials={st.assignee.initials} size="xs" />}
          </div>
        ))}
      </div>
    </div>
  );
}
