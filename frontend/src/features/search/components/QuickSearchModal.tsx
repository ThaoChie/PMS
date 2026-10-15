import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ArrowRight, FolderGit2 } from 'lucide-react';
import { useProjectStore } from '../../../store/projectStore';
import { issueService } from '../../../services/issueService';
import type { Issue } from '../../../types';

const TYPE_BADGE: Record<string, string> = {
  Story: 'text-[#6B6B70] bg-[#F7F7F8]',
  Bug: 'text-[#E53E3E] bg-[#FDECEC]',
  BUG: 'text-[#E53E3E] bg-[#FDECEC]',
  Task: 'text-[#6B6B70] bg-[#F7F7F8]',
  TASK: 'text-[#6B6B70] bg-[#F7F7F8]',
  Epic: 'text-[#1A1A1A] bg-[#EBEBEC]',
  EPIC: 'text-[#1A1A1A] bg-[#EBEBEC]',
  'Sub-task': 'text-[#9B9B9F] bg-[#F7F7F8]',
  SUB_TASK: 'text-[#9B9B9F] bg-[#F7F7F8]',
};

interface QuickSearchModalProps {
  onClose: () => void;
  onSelectIssue: (id: string) => void;
}

export default function QuickSearchModal({ onClose, onSelectIssue }: QuickSearchModalProps) {
  const [query, setQuery] = useState('');
  const [issues, setIssues] = useState<Issue[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const projects = useProjectStore((s) => s.projects);
  const currentProject = useProjectStore((s) => s.currentProject);
  const setCurrentProject = useProjectStore((s) => s.setCurrentProject);

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

  // Search real issues when query changes
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed || !currentProject?.id) {
      setIssues([]);
      return;
    }

    const timer = setTimeout(() => {
      issueService
        .getIssues(currentProject.id, { search: trimmed, page: 1, size: 8 })
        .then((res) => {
          const raw = res?.data?.content || (res?.data as any) || [];
          if (Array.isArray(raw)) {
            setIssues(
              raw.map((item: any) => ({
                id: String(item.id),
                key: item.key || item.issueKey || '',
                summary: item.summary || '',
                description: item.description || '',
                type: item.type,
                status: item.status,
                priority: item.priority,
                labels: item.labels || [],
                attachments: item.attachments || [],
                subtasks: item.subtasks || [],
                linkedIssues: item.linkedIssues || [],
                comments: item.comments || [],
                projectId: String(item.projectId || currentProject.id),
                createdAt: item.createdAt || '',
                updatedAt: item.updatedAt || '',
              })),
            );
          }
        })
        .catch(() => setIssues([]));
    }, 200);

    return () => clearTimeout(timer);
  }, [query, currentProject?.id]);

  const filteredProjects =
    query.trim().length > 0
      ? projects
          .filter(
            (p) =>
              p.name.toLowerCase().includes(query.toLowerCase()) ||
              p.key.toLowerCase().includes(query.toLowerCase()),
          )
          .slice(0, 4)
      : [];

  const hasResults = issues.length > 0 || filteredProjects.length > 0;

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
            <p className="text-xs text-[#9B9B9F] mt-1">
              Thử tìm theo mã (key) hoặc tiêu đề công việc, dự án
            </p>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto divide-y divide-[#F0F0F1]">
            {/* Projects */}
            {filteredProjects.length > 0 && (
              <div className="p-2">
                <p className="px-2 py-1 text-[10px] font-semibold text-[#9B9B9F] uppercase tracking-wider">
                  Dự án ({filteredProjects.length})
                </p>
                {filteredProjects.map((p) => (
                  <button
                    key={p.id}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left hover:bg-[#F7F7F8] transition-colors group"
                    onClick={() => {
                      setCurrentProject(p);
                      onClose();
                    }}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FolderGit2 className="w-4 h-4 text-[#6B6B70] shrink-0" />
                      <div>
                        <span className="text-xs font-medium text-[#1A1A1A] group-hover:text-[#E53E3E] transition-colors">
                          {p.name}
                        </span>
                        <span className="text-[10px] text-[#9B9B9F] ml-2 font-mono">
                          {p.key}
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-[#C5C5C8] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            )}

            {/* Issues */}
            {issues.length > 0 && (
              <div className="p-2">
                <p className="px-2 py-1 text-[10px] font-semibold text-[#9B9B9F] uppercase tracking-wider">
                  Công việc ({issues.length})
                </p>
                {issues.map((i) => (
                  <button
                    key={i.id}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left hover:bg-[#F7F7F8] transition-colors group"
                    onClick={() => {
                      onSelectIssue(i.id);
                      onClose();
                    }}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-[10px] font-mono text-[#9B9B9F] shrink-0 w-16">
                        {i.key}
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded shrink-0 ${
                          TYPE_BADGE[i.type] || 'text-[#6B6B70] bg-[#F7F7F8]'
                        }`}
                      >
                        {i.type}
                      </span>
                      <span className="text-xs text-[#1A1A1A] truncate group-hover:text-[#E53E3E] transition-colors">
                        {i.summary}
                      </span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-[#C5C5C8] opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
