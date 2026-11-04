import React from 'react';
import { Bookmark } from 'lucide-react';
import { ISSUE_TYPE_OPTIONS, PRIORITY_OPTIONS } from '../../../constants/enums';
import { MESSAGES } from '../../../constants/messages';

/** Tiêu chí lọc nâng cao — tên field khớp IssueSearchRequest của backend */
export interface AdvancedSearchCriteria {
  keyword: string;
  types: string[];
  statusIds: string[];
  priorities: string[];
  assigneeIds: string[];
  fromDate: string;
  toDate: string;
}

export const EMPTY_CRITERIA: AdvancedSearchCriteria = {
  keyword: '',
  types: [],
  statusIds: [],
  priorities: [],
  assigneeIds: [],
  fromDate: '',
  toDate: '',
};

interface AdvancedSearchPanelProps {
  criteria: AdvancedSearchCriteria;
  onChange: (patch: Partial<AdvancedSearchCriteria>) => void;
  /** Trạng thái lấy từ Workflow của dự án hiện tại (không hard-code) */
  statuses: Array<{ id: string; name: string }>;
  members: Array<{ id: string; name: string }>;
  hasFilters: boolean;
  onClearFilters: () => void;
  onSaveFilter?: () => void;
}

function toggle(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

const LABEL_CLASS =
  'block text-[10px] font-medium text-[#9B9B9F] uppercase tracking-wider mb-2';
const INPUT_CLASS =
  'w-full px-2.5 py-2 border border-[#E5E5E7] rounded-lg text-xs text-[#1A1A1A] placeholder:text-[#9B9B9F] focus:outline-none focus:border-[#1A1A1A] bg-white transition-colors';

export default function AdvancedSearchPanel({
  criteria,
  onChange,
  statuses,
  members,
  hasFilters,
  onClearFilters,
  onSaveFilter,
}: AdvancedSearchPanelProps) {
  return (
    <aside className="w-60 shrink-0 border-r border-[#E5E5E7] flex flex-col overflow-y-auto bg-white">
      <div className="px-4 py-3 border-b border-[#E5E5E7] flex items-center justify-between">
        <span className="text-xs font-semibold text-[#1A1A1A]">{MESSAGES.SEARCH.PANEL_TITLE}</span>
        {hasFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="text-[10px] text-[#E53E3E] hover:text-[#C53030]"
          >
            {MESSAGES.SEARCH.CLEAR_ALL}
          </button>
        )}
      </div>

      <div className="p-4 space-y-5 flex-1">
        {/* Từ khóa */}
        <div>
          <label className={LABEL_CLASS}>{MESSAGES.SEARCH.KEYWORD_LABEL}</label>
          <input
            value={criteria.keyword}
            onChange={(e) => onChange({ keyword: e.target.value })}
            placeholder={MESSAGES.SEARCH.KEYWORD_PLACEHOLDER}
            className={INPUT_CLASS}
          />
        </div>

        {/* Loại công việc (chọn nhiều) */}
        <div>
          <label className={LABEL_CLASS}>{MESSAGES.SEARCH.TYPE_LABEL}</label>
          <div className="space-y-1">
            {ISSUE_TYPE_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className="flex items-center gap-2 text-xs text-[#1A1A1A] cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={criteria.types.includes(opt.value)}
                  onChange={() => onChange({ types: toggle(criteria.types, opt.value) })}
                  className="rounded border-[#E5E5E7]"
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>

        {/* Trạng thái — lấy từ workflow của dự án */}
        <div>
          <label className={LABEL_CLASS}>{MESSAGES.SEARCH.STATUS_LABEL}</label>
          {statuses.length === 0 ? (
            <p className="text-[10px] text-[#9B9B9F]">Chưa tải được trạng thái của dự án</p>
          ) : (
            <div className="space-y-1">
              {statuses.map((s) => (
                <label
                  key={s.id}
                  className="flex items-center gap-2 text-xs text-[#1A1A1A] cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={criteria.statusIds.includes(String(s.id))}
                    onChange={() =>
                      onChange({ statusIds: toggle(criteria.statusIds, String(s.id)) })
                    }
                    className="rounded border-[#E5E5E7]"
                  />
                  {s.name}
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Độ ưu tiên (chọn nhiều) */}
        <div>
          <label className={LABEL_CLASS}>{MESSAGES.SEARCH.PRIORITY_LABEL}</label>
          <div className="space-y-1">
            {PRIORITY_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className="flex items-center gap-2 text-xs text-[#1A1A1A] cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={criteria.priorities.includes(opt.value)}
                  onChange={() => onChange({ priorities: toggle(criteria.priorities, opt.value) })}
                  className="rounded border-[#E5E5E7]"
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>

        {/* Người thực hiện */}
        <div>
          <label className={LABEL_CLASS}>{MESSAGES.SEARCH.ASSIGNEE_LABEL}</label>
          <select
            value={criteria.assigneeIds[0] || ''}
            onChange={(e) => onChange({ assigneeIds: e.target.value ? [e.target.value] : [] })}
            className={`${INPUT_CLASS} appearance-none`}
          >
            <option value="">{MESSAGES.SEARCH.ALL_OPTION}</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        {/* Khoảng ngày tạo */}
        <div>
          <label className={LABEL_CLASS}>Ngày tạo</label>
          <div className="space-y-1.5">
            <input
              type="date"
              value={criteria.fromDate}
              max={criteria.toDate || undefined}
              onChange={(e) => onChange({ fromDate: e.target.value })}
              className={INPUT_CLASS}
            />
            <input
              type="date"
              value={criteria.toDate}
              min={criteria.fromDate || undefined}
              onChange={(e) => onChange({ toDate: e.target.value })}
              className={INPUT_CLASS}
            />
          </div>
        </div>
      </div>

      {onSaveFilter && (
        <div className="p-4 border-t border-[#E5E5E7]">
          <button
            type="button"
            disabled={!hasFilters}
            onClick={onSaveFilter}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-[#1A1A1A] text-white text-xs font-medium rounded-lg hover:bg-black transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Bookmark className="w-3.5 h-3.5" /> Lưu bộ lọc này
          </button>
        </div>
      )}
    </aside>
  );
}
