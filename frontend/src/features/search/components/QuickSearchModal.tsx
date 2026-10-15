import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ArrowRight } from 'lucide-react';
import { issues, projects } from '../../../data/mockData';

const TYPE_BADGE: Record<string, string> = {
  Story: 'text-[#6B6B70] bg-[#F7F7F8]',
  Bug: 'text-[#E53E3E] bg-[#FDECEC]',
  Task: 'text-[#6B6B70] bg-[#F7F7F8]',
  Epic: 'text-[#1A1A1A] bg-[#EBEBEC]',
  'Sub-task': 'text-[#9B9B9F] bg-[#F7F7F8]',
};

interface QuickSearchModalProps {
  onClose: () => void;
  onSelectIssue: (id: string) => void;
}

export default function QuickSearchModal({ onClose, onSelectIssue }: QuickSearchModalProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const filteredIssues =
    query.trim().length > 0
      ? issues
          .filter(
            (i) =>
              i.summary.toLowerCase().includes(query.toLowerCase()) ||
              i.key.toLowerCase().includes(query.toLowerCase()),
          )
          .slice(0, 8)
      : [];

  const filteredProjects =
    query.trim().length > 0
      ? projects
          .filter(
            (p) =>
              p.name.toLowerCase().includes(query.toLowerCase()) ||
              p.key.toLowerCase().includes(query.toLowerCase()),
          )
          .slice(0, 3)
      : [];

  const hasResults = filteredIssues.length > 0 || filteredProjects.length > 0;

  return (
    <div
      className="fixed inset-0 bg-black/30 flex items-start justify-center z-50 pt-20 px-4 modal-backdrop"
      onClick={onClose}
    >
      <div
        className="bg-white border border-[#E5E5E7] rounded-xl w-full max-w-xl shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#E5E5E7]">
          <Search className="w-4 h-4 text-[#9B9B9F] shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm kiếm công việc, dự án…"
            className="flex-1 text-sm text-[#1A1A1A] placeholder:text-[#9B9B9F] focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="text-[#9B9B9F] hover:text-[#1A1A1A]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="text-[10px] text-[#9B9B9F] border border-[#E5E5E7] rounded px-1.5 py-0.5 shrink-0">
            Esc
          </kbd>
        </div>

        {/* Results */}
        {!query ? (
          <div className="px-4 py-8 text-center">
            <p className="text-xs text-[#9B9B9F]">Nhập từ khóa để tìm kiếm công việc và dự án</p>
          </div>
        ) : !hasResults ? (
          <div className="px-4 py-8 text-center">
            <p className="text-sm text-[#6B6B70]">
              Không tìm thấy kết quả cho "<span className="font-medium text-[#1A1A1A]">{query}</span>"
            </p>
            <p className="text-xs text-[#9B9B9F] mt-1">Hãy thử tìm với từ khóa hoặc mã công việc khác</p>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            {filteredProjects.length > 0 && (
              <div>
                <div className="px-4 py-2">
                  <p className="text-[10px] font-semibold text-[#9B9B9F] uppercase tracking-wider">
                    Dự án
                  </p>
                </div>
                {filteredProjects.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#F7F7F8] transition-colors text-left"
                    onClick={onClose}
                  >
                    <div className="w-6 h-6 rounded bg-[#1A1A1A] flex items-center justify-center text-white text-[9px] font-bold shrink-0">
                      {p.key.slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-[#1A1A1A] truncate">{p.name}</p>
                      <p className="text-[10px] text-[#9B9B9F]">
                        {p.key} · {p.openIssues} công việc đang mở
                      </p>
                    </div>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded border shrink-0 ${
                        p.status === 'Active'
                          ? 'text-[#6B6B70] bg-[#F7F7F8] border-[#E5E5E7]'
                          : 'text-[#9B9B9F] bg-[#F7F7F8] border-[#E5E5E7]'
                      }`}
                    >
                      {p.status === 'Active' ? 'Đang hoạt động' : 'Đã đóng'}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {filteredIssues.length > 0 && (
              <div>
                <div className="px-4 py-2 border-t border-[#F0F0F1] first:border-0">
                  <p className="text-[10px] font-semibold text-[#9B9B9F] uppercase tracking-wider">
                    Công việc
                  </p>
                </div>
                {filteredIssues.map((issue) => (
                  <button
                    key={issue.id}
                    type="button"
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#F7F7F8] transition-colors text-left group"
                    onClick={() => {
                      onSelectIssue(issue.id);
                      onClose();
                    }}
                  >
                    <span className="text-[10px] font-mono text-[#9B9B9F] w-16 shrink-0">
                      {issue.key}
                    </span>
                    <span
                      className={`text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0 ${
                        TYPE_BADGE[issue.type]
                      }`}
                    >
                      {issue.type}
                    </span>
                    <span className="text-xs text-[#1A1A1A] flex-1 truncate group-hover:text-[#E53E3E] transition-colors">
                      {issue.summary}
                    </span>
                    <ArrowRight className="w-3 h-3 text-[#C5C5C8] shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer hint */}
        <div className="px-4 py-2 border-t border-[#E5E5E7] flex items-center gap-4 text-[10px] text-[#9B9B9F]">
          <span className="flex items-center gap-1">
            <kbd className="border border-[#E5E5E7] rounded px-1 py-0.5">↵</kbd> Mở
          </span>
          <span className="flex items-center gap-1">
            <kbd className="border border-[#E5E5E7] rounded px-1 py-0.5">Esc</kbd> Đóng
          </span>
        </div>
      </div>
    </div>
  );
}
