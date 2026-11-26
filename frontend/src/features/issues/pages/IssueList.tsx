import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  SlidersHorizontal,
  RefreshCw,
  Bookmark,
  ChevronDown,
  Check,
  X,
  ArrowRight,
} from 'lucide-react';
import { useProjectStore } from '../../../store/projectStore';
import { useAuthStore } from '../../../store/authStore';
import { issueService } from '../../../services/issueService';
import { memberService } from '../../../services/memberService';
import { workflowService } from '../../../services/workflowService';
import { searchService, type IssueSearchCriteria } from '../../../services/searchService';
import { filterService } from '../../../services/filterService';
import { toast } from '../../../store/toastStore';
import { MESSAGES } from '../../../constants/messages';
import { ISSUE_CHANGED_EVENT, type IssueEventDetail } from '../../../utils/issueEvents';
import { useDebounce } from '../../../hooks/useDebounce';
import { filtersToSearchParams, searchParamsToFilters } from '../../../utils/searchParams';
import type { Issue, SavedFilter } from '../../../types';
import IssueTable, { type SortField, type SortDir } from '../components/IssueTable';
import ExportButton from '../components/ExportButton';
import AdvancedSearchPanel, {
  EMPTY_CRITERIA,
  type AdvancedSearchCriteria,
} from '../../search/components/AdvancedSearchPanel';
import SaveFilterModal, { type SaveFilterData } from '../../filters/components/SaveFilterModal';
import { mapSavedFilter } from '../../filters';

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
function criteriaFromUrl(): { criteria: AdvancedSearchCriteria; quick: string; filterId: string | null } {
  if (typeof window === 'undefined') return { criteria: EMPTY_CRITERIA, quick: '', filterId: null };
  const searchParams = new URLSearchParams(window.location.search);
  const filterId = searchParams.get('filterId');
  const raw = searchParamsToFilters(searchParams);
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
    filterId,
  };
}

interface IssueListProps {
  onSelectIssue: (id: string) => void;
}

const PAGE_SIZE = 100;

export default function IssueList({ onSelectIssue }: IssueListProps) {
  const { currentProject } = useProjectStore();
  const currentUser = useAuthStore((s) => s.user);
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

  // Bộ lọc đã lưu
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [loadingFilters, setLoadingFilters] = useState(false);
  const [activeSavedFilter, setActiveSavedFilter] = useState<SavedFilter | null>(null);
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const filterDropdownRef = useRef<HTMLDivElement>(null);

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

  // Lắng nghe sự kiện thay đổi công việc (tạo mới, cập nhật, xóa) để cập nhật danh sách real-time tự động
  useEffect(() => {
    const handleIssuesChanged = (e: Event) => {
      const detail = (e as CustomEvent<IssueEventDetail>)?.detail;
      if (!detail?.projectId || !currentProject?.id || String(detail.projectId) === String(currentProject.id)) {
        if (detail?.action === 'create' && detail?.issue && currentProject?.id) {
          const mapped = mapIssue(detail.issue, currentProject.id);
          setIssues((prev) => {
            if (prev.some((item) => String(item.id) === String(mapped.id) || item.key === mapped.key)) {
              return prev;
            }
            return [mapped, ...prev];
          });
        } else if (detail?.action === 'delete' && detail?.issueKey) {
          setIssues((prev) => prev.filter((item) => item.key !== detail.issueKey && item.id !== detail.issueId));
        }
        loadIssues();
      }
    };

    window.addEventListener(ISSUE_CHANGED_EVENT, handleIssuesChanged);
    return () => window.removeEventListener(ISSUE_CHANGED_EVENT, handleIssuesChanged);
  }, [loadIssues, currentProject]);

  // Lấy danh sách bộ lọc đã lưu
  const loadSavedFilters = useCallback(async () => {
    setLoadingFilters(true);
    try {
      const res = await filterService.getSavedFilters();
      const raw: any = res?.data;
      const list: any[] = Array.isArray(raw) ? raw : raw?.content || [];
      const mapped = list.map(mapSavedFilter);
      setSavedFilters(mapped);
      return mapped;
    } catch {
      setSavedFilters([]);
      return [];
    } finally {
      setLoadingFilters(false);
    }
  }, []);

  // Áp dụng bộ lọc đã lưu vào state
  const applySavedFilter = useCallback((f: SavedFilter, notify: boolean = true) => {
    setActiveSavedFilter(f);
    const c = f.filters || {};
    const toArray = (v: any): string[] =>
      v === undefined || v === null || v === '' ? [] : Array.isArray(v) ? v.map(String) : [String(v)];

    setCriteria({
      keyword: typeof c.keyword === 'string' ? c.keyword : '',
      types: toArray(c.types || (c as any).type),
      statusIds: toArray(c.statusIds || (c as any).statuses || (c as any).status),
      priorities: toArray(c.priorities || (c as any).priority),
      assigneeIds: toArray(c.assigneeIds || (c as any).assignee),
      fromDate: typeof c.fromDate === 'string' ? c.fromDate : '',
      toDate: typeof c.toDate === 'string' ? c.toDate : '',
    });
    setActiveQuick(typeof c.quick === 'string' ? c.quick : '');

    if (notify) {
      toast.success(`Đã áp dụng bộ lọc "${f.name}"`);
    }
  }, []);

  // Tải danh sách bộ lọc và kiểm tra URL filterId khi mount
  useEffect(() => {
    loadSavedFilters().then((list) => {
      const urlParams = new URLSearchParams(window.location.search);
      const fid = urlParams.get('filterId') || initial.filterId;
      if (fid && list.length > 0) {
        const found = list.find((f) => String(f.id) === String(fid));
        if (found) {
          applySavedFilter(found, false);
        }
      }
    });
  }, [loadSavedFilters, initial.filterId, applySavedFilter]);

  // Lắng nghe sự kiện popstate để nhận filterId khi chuyển trang
  useEffect(() => {
    function handlePopState() {
      const urlParams = new URLSearchParams(window.location.search);
      const fid = urlParams.get('filterId');
      if (fid && savedFilters.length > 0) {
        const found = savedFilters.find((f) => String(f.id) === String(fid));
        if (found) {
          applySavedFilter(found, false);
        }
      }
    }
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [savedFilters, applySavedFilter]);

  // Click ngoài đóng dropdown bộ lọc đã lưu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
        setFilterDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  // Kiểm tra xem tiêu chí hiện tại có bị sửa khác so với bộ lọc đã lưu hay không
  const isFilterModified = useMemo(() => {
    if (!activeSavedFilter) return false;
    const f = activeSavedFilter.filters || {};
    const norm = (arr?: any[]) => (arr || []).map(String).sort().join(',');
    if ((criteria.keyword || '') !== (f.keyword || '')) return true;
    if (norm(criteria.types) !== norm(f.types || (f as any).type)) return true;
    if (norm(criteria.statusIds) !== norm(f.statusIds || (f as any).statuses || (f as any).status)) return true;
    if (norm(criteria.priorities) !== norm(f.priorities || (f as any).priority)) return true;
    if (norm(criteria.assigneeIds) !== norm(f.assigneeIds || (f as any).assignee)) return true;
    if ((criteria.fromDate || '') !== (f.fromDate || '')) return true;
    if ((criteria.toDate || '') !== (f.toDate || '')) return true;
    if ((activeQuick || '') !== (f.quick || '')) return true;
    return false;
  }, [activeSavedFilter, criteria, activeQuick]);

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
      ...(activeSavedFilter && !isFilterModified ? { filterId: activeSavedFilter.id } : {}),
    });
    const query = params.toString();
    window.history.replaceState(
      {},
      '',
      query ? `${window.location.pathname}?${query}` : window.location.pathname,
    );
  }, [criteria, activeQuick, activeSavedFilter, isFilterModified]);

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
    setActiveSavedFilter(null);
  }

  function handleClearSavedFilter() {
    setActiveSavedFilter(null);
    clearFilters();
  }

  async function handleSaveFilter(data: SaveFilterData | string) {
    try {
      const payload =
        typeof data === 'string'
          ? { name: data, filters: searchCriteria }
          : {
              name: data.name,
              filters: searchCriteria,
              emailSubscription: data.emailSubscription,
              frequency: data.frequency,
            };
      const res = await filterService.createFilter(payload);
      toast.success(MESSAGES.FILTER.CREATE_SUCCESS);
      const list = await loadSavedFilters();
      if (res?.data?.id) {
        const newlyCreated = list.find((item) => String(item.id) === String(res.data.id));
        if (newlyCreated) {
          setActiveSavedFilter(newlyCreated);
        }
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || MESSAGES.COMMON.ACTION_FAILED);
    }
  }

  async function handleUpdateCurrentFilter() {
    if (!activeSavedFilter) return;
    try {
      await filterService.updateFilter(activeSavedFilter.id, { filters: searchCriteria });
      toast.success(`Đã cập nhật bộ lọc "${activeSavedFilter.name}"`);
      const list = await loadSavedFilters();
      const updated = list.find((item) => String(item.id) === String(activeSavedFilter.id));
      if (updated) {
        setActiveSavedFilter(updated);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || MESSAGES.COMMON.ACTION_FAILED);
    }
  }

  function isOwner(f: SavedFilter): boolean {
    return !!currentUser?.id && String(f.owner?.id) === String(currentUser.id);
  }

  return (
    <div className="h-full flex bg-white overflow-hidden relative">
      {filterPanelOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40 md:hidden transition-opacity"
            onClick={() => setFilterPanelOpen(false)}
          />
          <AdvancedSearchPanel
            criteria={criteria}
            onChange={patchCriteria}
            statuses={statuses}
            members={members}
            hasFilters={hasFilters}
            onClearFilters={clearFilters}
            onSaveFilter={() => setShowSaveFilter(true)}
            onClose={() => setFilterPanelOpen(false)}
          />
        </>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top toolbar */}
        <div className="px-4 py-2.5 sm:px-6 sm:py-3 border-b border-[#E5E5E7] flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5 shrink-0">
          <div className="flex items-center gap-2 flex-1 min-w-0 flex-wrap sm:flex-nowrap">
            <button
              type="button"
              onClick={() => setFilterPanelOpen((o) => !o)}
              className={`px-3 py-1.5 min-h-[36px] sm:min-h-0 rounded-md border text-xs sm:text-sm flex items-center gap-1.5 transition-colors shrink-0 ${
                filterPanelOpen
                  ? 'border-[#1A1A1A] bg-[#F7F7F8] text-[#1A1A1A]'
                  : 'border-[#E5E5E7] text-[#6B6B70] hover:border-[#C5C5C8]'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Bộ lọc</span>
              {hasFilters && <span className="w-1.5 h-1.5 rounded-full bg-[#E53E3E]" />}
            </button>

            {/* Bộ lọc đã lưu Selector / Dropdown */}
            <div className="relative shrink-0" ref={filterDropdownRef}>
              {activeSavedFilter ? (
                <div className="flex items-center gap-1.5 bg-[#F7F7F8] border border-[#1A1A1A] rounded-md px-2 py-1 text-xs">
                  <Bookmark className="w-3.5 h-3.5 text-[#E53E3E] fill-[#E53E3E]" />
                  <span
                    className="font-medium text-[#1A1A1A] max-w-[130px] truncate"
                    title={activeSavedFilter.name}
                  >
                    {activeSavedFilter.name}
                  </span>
                  {isFilterModified && (
                    <span
                      className="text-[10px] text-[#E53E3E] font-medium"
                      title="Bộ lọc đã thay đổi tiêu chí so với bản lưu"
                    >
                      (đã sửa)
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setFilterDropdownOpen((o) => !o)}
                    className="text-[#6B6B70] hover:text-[#1A1A1A]"
                  >
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={handleClearSavedFilter}
                    title="Bỏ áp dụng bộ lọc đã lưu"
                    className="text-[#9B9B9F] hover:text-[#E53E3E] ml-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setFilterDropdownOpen((o) => !o)}
                  className={`p-1.5 rounded-md border text-xs flex items-center gap-1.5 transition-colors ${
                    filterDropdownOpen
                      ? 'border-[#1A1A1A] bg-[#F7F7F8] text-[#1A1A1A]'
                      : 'border-[#E5E5E7] text-[#6B6B70] hover:border-[#C5C5C8] hover:text-[#1A1A1A]'
                  }`}
                  title="Chọn bộ lọc đã lưu"
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>Bộ lọc đã lưu</span>
                  <ChevronDown className="w-3 h-3 text-[#9B9B9F]" />
                </button>
              )}

              {filterDropdownOpen && (
                <div className="absolute left-0 mt-1.5 w-64 bg-white border border-[#E5E5E7] rounded-xl shadow-lg py-1.5 z-40 text-xs">
                  <div className="px-3 py-1.5 text-[10px] font-semibold text-[#9B9B9F] uppercase tracking-wider border-b border-[#F0F0F1] flex items-center justify-between">
                    <span>Bộ lọc của bạn ({savedFilters.length})</span>
                    {loadingFilters && (
                      <span className="text-[10px] lowercase text-[#6B6B70]">đang tải...</span>
                    )}
                  </div>

                  <div className="max-h-56 overflow-y-auto py-1">
                    {savedFilters.length === 0 ? (
                      <p className="px-3 py-3 text-center text-[#9B9B9F] text-xs">
                        Chưa có bộ lọc nào được lưu
                      </p>
                    ) : (
                      savedFilters.map((f) => {
                        const isSelected = activeSavedFilter?.id === f.id;
                        return (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() => {
                              applySavedFilter(f);
                              setFilterDropdownOpen(false);
                            }}
                            className={`w-full px-3 py-2 text-left flex items-center justify-between gap-2 hover:bg-[#F7F7F8] transition-colors ${
                              isSelected ? 'bg-[#FDECEC]/50 font-medium' : ''
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <Bookmark
                                className={`w-3.5 h-3.5 shrink-0 ${
                                  isSelected ? 'text-[#E53E3E] fill-[#E53E3E]' : 'text-[#9B9B9F]'
                                }`}
                              />
                              <span className="truncate text-[#1A1A1A]">{f.name}</span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {!isOwner(f) && (
                                <span className="text-[9px] px-1 py-0.5 rounded bg-[#F7F7F8] border border-[#E5E5E7] text-[#6B6B70]">
                                  chia sẻ
                                </span>
                              )}
                              {isSelected && <Check className="w-3.5 h-3.5 text-[#E53E3E]" />}
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>

                  <div className="border-t border-[#F0F0F1] pt-1 mt-1 space-y-0.5">
                    {activeSavedFilter && isFilterModified && isOwner(activeSavedFilter) && (
                      <button
                        type="button"
                        onClick={() => {
                          handleUpdateCurrentFilter();
                          setFilterDropdownOpen(false);
                        }}
                        className="w-full px-3 py-1.5 text-left text-xs text-[#E53E3E] hover:bg-[#FDECEC] font-medium flex items-center gap-1.5"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Cập nhật "{activeSavedFilter.name}"
                      </button>
                    )}

                    {hasFilters && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowSaveFilter(true);
                          setFilterDropdownOpen(false);
                        }}
                        className="w-full px-3 py-1.5 text-left text-xs text-[#1A1A1A] hover:bg-[#F7F7F8] flex items-center gap-1.5"
                      >
                        <Bookmark className="w-3.5 h-3.5 text-[#6B6B70]" />
                        + Lưu bộ lọc hiện tại...
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setFilterDropdownOpen(false);
                        window.history.pushState({}, '', '/saved-filters');
                        window.dispatchEvent(new PopStateEvent('popstate'));
                      }}
                      className="w-full px-3 py-1.5 text-left text-xs text-[#6B6B70] hover:bg-[#F7F7F8] flex items-center justify-between"
                    >
                      <span>Quản lý tất cả bộ lọc</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <input
              type="text"
              value={criteria.keyword}
              onChange={(e) => patchCriteria({ keyword: e.target.value })}
              placeholder={MESSAGES.SEARCH.KEYWORD_PLACEHOLDER}
              className="px-3 py-1.5 border border-[#E5E5E7] rounded-md text-xs sm:text-sm text-[#1A1A1A] placeholder:text-[#9B9B9F] w-full sm:w-auto sm:flex-1 min-w-[180px] focus:outline-none focus:border-[#1A1A1A]"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-auto">
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
