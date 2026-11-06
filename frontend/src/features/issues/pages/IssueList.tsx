import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { SlidersHorizontal, RefreshCw } from 'lucide-react';
import { useProjectStore } from '../../../store/projectStore';
import { issueService } from '../../../services/issueService';
import { memberService } from '../../../services/memberService';
import { workflowService } from '../../../services/workflowService';
import { searchService, type IssueSearchCriteria } from '../../../services/searchService';
import { filterService } from '../../../services/filterService';
import { toast } from '../../../store/toastStore';
import { MESSAGES } from '../../../constants/messages';
import { QUICK_FILTER_OPTIONS } from '../../../constants/enums';
import { useDebounce } from '../../../hooks/useDebounce';
import { filtersToSearchParams, searchParamsToFilters } from '../../../utils/searchParams';
import type { Issue } from '../../../types';
import IssueTable, { type SortField, type SortDir } from '../components/IssueTable';
import ExportButton from '../components/ExportButton';
import AdvancedSearchPanel, {
  EMPTY_CRITERIA,
  type AdvancedSearchCriteria,
} from '../../search/components/AdvancedSearchPanel';
import QuickFilterChips from '../../search/components/QuickFilterChips';
import SaveFilterModal from '../../filters/components/SaveFilterModal';

function mapIssue(item: any, fallbackProjectId?: string): Issue {
  return {
    id: String(item.id),
    key: item.key || item.issueKey || '',
    summary: item.summary || '',
    description: item.description || '',
    type: item.type,
    status: item.status,
    priority: item.priority,
    assignee: item.assignee
      ? {
          id: String(item.assignee.id),
          name: item.assignee.fullName || item.assignee.name || item.assignee.email,
          email: item.assignee.email,
          avatarUrl: item.assignee.avatarUrl,
          role: 'member',
        }
      : undefined,
    reporter: item.reporter
      ? {
          id: String(item.reporter.id),
          name: item.reporter.fullName || item.reporter.name || item.reporter.email,
          email: item.reporter.email,
          avatarUrl: item.reporter.avatarUrl,
          role: 'member',
        }
      : { id: '0', name: 'Unknown', email: '', role: 'member' },
    labels: item.labels || [],
    estimates: item.estimates,
    dueDate: item.dueDate,
    environment: item.environment,
    attachments: item.attachments || [],
    subtasks: item.subtasks || [],
    linkedIssues: item.linkedIssues || [],
    comments: item.comments || [],
    projectId: String(item.projectId || fallbackProjectId || ''),
    epicLink: item.epicLink,
    epicId: item.epicId,
    parentId: item.parentId,
    parentKey: item.parentKey,
    customFields: item.customFields || [],
    createdAt: item.createdAt || '',
    updatedAt: item.updatedAt || '',
    version: item.version,
  } as Issue;
}

/** Đọc tiêu chí lọc từ query string của URL (để chia sẻ/bookmark được link bộ lọc) */
function criteriaFromUrl(): { criteria: AdvancedSearchCriteria; quick: string } {
  if (typeof window === 'undefined') return { criteria: EMPTY_CRITERIA, quick: '' };
  const raw = searchParamsToFilters(new URLSearchParams(window.location.search));
  const toArray = (v: any): string[] =>
    v === undefined || v === null || v === '' ? [] : Array.isArray(v) ? v.map(String) : [String(v)];

  return {
    criteria: {
      keyword: typeof raw.keyword === 'string' ? raw.keyword : '',
      types: toArray(raw.types),
      statusIds: toArray(raw.statusIds),
      priorities: toArray(raw.priorities),
      assigneeIds: toArray(raw.assigneeIds),
      fromDate: typeof raw.fromDate === 'string' ? raw.fromDate : '',
      toDate: typeof raw.toDate === 'string' ? raw.toDate : '',
    },
    quick: typeof raw.quick === 'string' ? raw.quick : '',
  };
}

interface IssueListProps {
  onSelectIssue: (id: string) => void;
}

const PAGE_SIZE = 100;

export default function IssueList({ onSelectIssue }: IssueListProps) {
  const { currentProject } = useProjectStore();
  const initial = useMemo(() => criteriaFromUrl(), []);

  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [sortField, setSortField] = useState<SortField>('key');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [criteria, setCriteria] = useState<AdvancedSearchCriteria>(initial.criteria);
  const [activeQuick, setActiveQuick] = useState<string>(initial.quick);
  const [members, setMembers] = useState<Array<{ id: string; name: string }>>([]);
  const [statuses, setStatuses] = useState<Array<{ id: string; name: string }>>([]);
  const [showSaveFilter, setShowSaveFilter] = useState(false);

  // Gõ từ khóa thì chờ 400ms mới gọi API để đỡ gọi liên tục
  const debouncedKeyword = useDebounce(criteria.keyword, 400);

  const hasFilters = !!(
    criteria.keyword ||
    criteria.types.length ||
    criteria.statusIds.length ||
    criteria.priorities.length ||
    criteria.assigneeIds.length ||
    criteria.fromDate ||
    criteria.toDate ||
    activeQuick
  );

  /** Tiêu chí gửi lên backend (POST /issues/search) */
  const searchCriteria: IssueSearchCriteria = useMemo(
    () => ({
      ...(currentProject?.id ? { projectIds: [Number(currentProject.id)] } : {}),
      ...(debouncedKeyword.trim() ? { keyword: debouncedKeyword.trim() } : {}),
      ...(criteria.types.length ? { types: criteria.types } : {}),
      ...(criteria.statusIds.length ? { statusIds: criteria.statusIds.map(Number) } : {}),
      ...(criteria.priorities.length ? { priorities: criteria.priorities } : {}),
      ...(criteria.assigneeIds.length ? { assigneeIds: criteria.assigneeIds.map(Number) } : {}),
      ...(criteria.fromDate ? { fromDate: criteria.fromDate } : {}),
      ...(criteria.toDate ? { toDate: criteria.toDate } : {}),
      ...(activeQuick ? { quick: activeQuick } : {}),
    }),
    [
      currentProject?.id,
      debouncedKeyword,
      criteria.types,
      criteria.statusIds,
      criteria.priorities,
      criteria.assigneeIds,
      criteria.fromDate,
      criteria.toDate,
      activeQuick,
    ],
  );

  const useServerSearch = Object.keys(searchCriteria).some((k) => k !== 'projectIds');

  const loadIssues = useCallback(async () => {
    if (!currentProject) {
      setIssues([]);
      return;
    }
    setLoading(true);
    setLoadFailed(false);
    try {
      let list: any[] = [];
      if (useServerSearch) {
        // UC011: tìm kiếm nâng cao chạy ở backend (có index pg_trgm), không lọc ở trình duyệt
        const res = await searchService.searchIssues(searchCriteria, 1, PAGE_SIZE);
        list = (res?.data?.content as any[]) || [];
      } else {
        const res = await issueService.getIssues(currentProject.id, {
          page: 1,
          size: PAGE_SIZE,
          sort: `${sortField === 'key' ? 'issueKey' : sortField},${sortDir}`,
        });
        list = (res?.data?.content as any[]) || (res?.data as any) || [];
      }
      setIssues(
        Array.isArray(list) ? list.map((item) => mapIssue(item, currentProject.id)) : [],
      );
    } catch {
      setIssues([]);
      setLoadFailed(true);
    } finally {
      setLoading(false);
    }
  }, [currentProject, useServerSearch, searchCriteria, sortField, sortDir]);

  useEffect(() => {
    loadIssues();
  }, [loadIssues]);

  // Lấy thành viên dự án cho bộ lọc "Người thực hiện"
  useEffect(() => {
    if (!currentProject) {
      setMembers([]);
      return;
    }
    let active = true;
    memberService
      .getMembers(currentProject.id)
      .then((res) => {
        if (!active) return;
        const raw: any = res?.data || [];
        const list: any[] = Array.isArray(raw) ? raw : raw.content || [];
        setMembers(
          list.map((m: any) => ({
            id: String(m.user?.id || m.userId || m.id),
            name: m.user?.fullName || m.fullName || m.user?.email || m.email || 'Thành viên',
          })),
        );
      })
      .catch(() => {
        if (active) setMembers([]);
      });
    return () => {
      active = false;
    };
  }, [currentProject]);

  // Lấy danh sách trạng thái từ Workflow của dự án (không hard-code)
  useEffect(() => {
    if (!currentProject) {
      setStatuses([]);
      return;
    }
    let active = true;
    workflowService
      .getWorkflow(currentProject.id)
      .then((res) => {
        if (!active) return;
        const list: any[] = (res?.data?.statuses as any[]) || [];
        setStatuses(list.map((s: any) => ({ id: String(s.id), name: s.name })));
      })
      .catch(() => {
        if (active) setStatuses([]);
      });
    return () => {
      active = false;
    };
  }, [currentProject]);

  // Đồng bộ tiêu chí lọc vào URL để chia sẻ / bookmark link (UC011)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = filtersToSearchParams({
      keyword: criteria.keyword,
      types: criteria.types,
      statusIds: criteria.statusIds,
      priorities: criteria.priorities,
      assigneeIds: criteria.assigneeIds,
      fromDate: criteria.fromDate,
      toDate: criteria.toDate,
      quick: activeQuick,
    });
    const query = params.toString();
    window.history.replaceState(
      {},
      '',
      query ? `${window.location.pathname}?${query}` : window.location.pathname,
    );
  }, [criteria, activeQuick]);

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  }

  function patchCriteria(patch: Partial<AdvancedSearchCriteria>) {
    setCriteria((c) => ({ ...c, ...patch }));
  }

  function clearFilters() {
    setCriteria(EMPTY_CRITERIA);
    setActiveQuick('');
  }

  async function handleSaveFilter(name: string) {
    try {
      await filterService.createFilter({ name, filters: searchCriteria });
      toast.success(MESSAGES.FILTER.CREATE_SUCCESS);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || MESSAGES.COMMON.ACTION_FAILED);
    }
  }

  return (
    <div className="h-full flex bg-white overflow-hidden">
      {filterPanelOpen && (
        <AdvancedSearchPanel
          criteria={criteria}
          onChange={patchCriteria}
          statuses={statuses}
          members={members}
          hasFilters={hasFilters}
          onClearFilters={clearFilters}
          onSaveFilter={() => setShowSaveFilter(true)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top toolbar */}
        <div className="px-6 py-3 border-b border-[#E5E5E7] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => setFilterPanelOpen((o) => !o)}
              className={`p-1.5 rounded-md border text-xs flex items-center gap-1.5 transition-colors shrink-0 ${
                filterPanelOpen
                  ? 'border-[#1A1A1A] bg-[#F7F7F8] text-[#1A1A1A]'
                  : 'border-[#E5E5E7] text-[#6B6B70] hover:border-[#C5C5C8]'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Bộ lọc</span>
              {hasFilters && <span className="w-1.5 h-1.5 rounded-full bg-[#E53E3E]" />}
            </button>
            <input
              type="text"
              value={criteria.keyword}
              onChange={(e) => patchCriteria({ keyword: e.target.value })}
              placeholder={MESSAGES.SEARCH.KEYWORD_PLACEHOLDER}
              className="px-3 py-1.5 border border-[#E5E5E7] rounded-md text-xs text-[#1A1A1A] placeholder:text-[#9B9B9F] w-64 focus:outline-none focus:border-[#1A1A1A] shrink-0"
            />
            <QuickFilterChips
              options={QUICK_FILTER_OPTIONS.map((q) => ({ id: q.id, label: q.label }))}
              activeId={activeQuick || null}
              onSelect={(id) => setActiveQuick(id || '')}
              className="min-w-0 overflow-x-auto"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={loadIssues}
              className="p-1.5 rounded-md border border-[#E5E5E7] text-[#6B6B70] hover:text-[#1A1A1A] hover:bg-[#F7F7F8] transition-colors"
              title={MESSAGES.COMMON.RETRY}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            {/* Xuất dữ liệu theo đúng bộ lọc đang áp dụng (UC010) */}
            <ExportButton criteria={searchCriteria} issues={issues} projectId={currentProject?.id} />
          </div>
        </div>

        {loadFailed && (
          <p className="px-6 py-2 text-xs text-[#E53E3E] bg-[#FDECEC] border-b border-[#FBD5D5]">
            {MESSAGES.SEARCH.FAILED}
          </p>
        )}

        {/* Table view */}
        <IssueTable
          issues={issues}
          sortField={sortField}
          sortDir={sortDir}
          onSort={handleSort}
          onSelectIssue={onSelectIssue}
          hasFilters={hasFilters}
          onClearFilters={clearFilters}
          projectId={currentProject?.id}
          members={members}
          onRefresh={loadIssues}
        />
      </div>

      <SaveFilterModal
        isOpen={showSaveFilter}
        onClose={() => setShowSaveFilter(false)}
        onSave={handleSaveFilter}
      />
    </div>
  );
}
