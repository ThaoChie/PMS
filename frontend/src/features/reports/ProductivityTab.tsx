import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import type { Role, ProjectMember } from '../../types';
import { useProjectStore } from '../../store/projectStore';
import { useProductivityStore } from '../../store/productivityStore';
import { memberService } from '../../services/memberService';
import { CustomTooltip } from './ProgressTab';
import { MESSAGES } from '../../constants/messages';
import { ISSUE_TYPE_OPTIONS } from '../../constants/enums';
import IssueTypeIcon from '../../components/common/IssueTypeIcon';
import PriorityTag from '../../components/common/PriorityTag';

interface ProductivityTabProps {
  role: Role;
  from?: string;
  to?: string;
}

const ROLE_OPTIONS = [
  { value: 'PM', label: 'Quản lý dự án (PM)' },
  { value: 'DEVELOPER', label: 'Lập trình viên (Developer)' },
  { value: 'QA', label: 'Kiểm thử (QA/Tester)' },
  { value: 'ADMIN', label: 'Quản trị viên (Admin)' },
];

const STATUS_OPTIONS = [
  { value: 'To Do', label: 'To Do' },
  { value: 'In Progress', label: 'In Progress' },
  { value: 'Pending Approval', label: 'Pending Approval' },
  { value: 'Done', label: 'Done' },
];

export const ProductivityTab: React.FC<ProductivityTabProps> = ({ role, from: propFrom, to: propTo }) => {
  const currentProject = useProjectStore((s) => s.currentProject);

  const {
    filter,
    report,
    loading,
    error,
    selectedMemberId,
    memberDetail,
    loadingDetail,
    setFilter,
    resetFilter,
    fetchReport,
    selectMember,
  } = useProductivityStore();

  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);
  const [drawerTab, setDrawerTab] = useState<'issues' | 'worklogs'>('issues');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<'members' | 'roles' | 'types' | 'statuses' | null>(null);
  const [memberSearchTerm, setMemberSearchTerm] = useState('');
  const filterPanelRef = useRef<HTMLDivElement>(null);

  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterPanelRef.current && !filterPanelRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Sync prop dates if passed on initial mount
  useEffect(() => {
    if (propFrom && propTo && !filter.from) {
      setFilter({ from: propFrom, to: propTo });
    }
  }, [propFrom, propTo]);

  // Load project members for filter dropdown
  useEffect(() => {
    if (currentProject?.id) {
      memberService.getMembers(String(currentProject.id))
        .then((res: any) => {
          const raw = res?.data || res || [];
          const list = Array.isArray(raw) ? raw : (raw as any).content || [];
          setProjectMembers(list);
        })
        .catch(() => setProjectMembers([]));
    }
  }, [currentProject?.id]);

  // Fetch report on project or filter change
  useEffect(() => {
    if (currentProject?.id) {
      fetchReport(Number(currentProject.id));
    }
  }, [currentProject?.id, filter.from, filter.to, filter.sort, filter.overdueOnly]);

  // Combined list of all unique project members (deduplicated by actual userId)
  const allMembers = useMemo(() => {
    const map = new Map<number, { id: number; name: string; email: string; role: string; avatarUrl?: string }>();

    projectMembers.forEach((pm: any) => {
      const u = pm.user || pm;
      const uId = Number(pm.userId ?? pm.user?.id ?? pm.id);
      if (uId && uId > 0) {
        map.set(uId, {
          id: uId,
          name: pm.fullName || u.fullName || u.name || pm.email || 'Thành viên',
          email: pm.email || u.email || '',
          role: pm.role || u.role || '',
          avatarUrl: pm.avatarUrl || u.avatarUrl,
        });
      }
    });

    (report?.members || []).forEach((m) => {
      if (m.userId !== undefined && m.userId !== null && m.userId > 0 && !map.has(m.userId)) {
        map.set(m.userId, {
          id: m.userId,
          name: m.fullName,
          email: m.email,
          role: m.projectRole || '',
          avatarUrl: m.avatarUrl,
        });
      }
    });

    const regular = Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, 'vi'));

    // Check if unassigned issues exist
    const hasUnassigned = (report?.members || []).some((m) => m.userId === 0) || (report?.totalAssigned ?? 0) > 0;
    const unassignedOption = hasUnassigned
      ? [
          {
            id: 0,
            name: 'Chưa phân công',
            email: 'Công việc chưa có người thực hiện',
            role: '—',
            avatarUrl: undefined,
          },
        ]
      : [];

    return [...unassignedOption, ...regular];
  }, [projectMembers, report?.members, report?.totalAssigned]);

  // Filtered members for dropdown search
  const filteredMemberList = useMemo(() => {
    if (!memberSearchTerm.trim()) return allMembers;
    const term = memberSearchTerm.toLowerCase();
    return allMembers.filter((m) =>
      m.name.toLowerCase().includes(term) || m.email.toLowerCase().includes(term) || m.role.toLowerCase().includes(term)
    );
  }, [allMembers, memberSearchTerm]);

  const handleFromChange = (newFrom: string) => {
    let fromVal = newFrom;
    if (fromVal > today) fromVal = today;
    let toVal = filter.to;
    if (toVal && toVal < fromVal) {
      toVal = fromVal;
    }
    setFilter({ from: fromVal, to: toVal });
  };

  const handleToChange = (newTo: string) => {
    let toVal = newTo;
    if (toVal > today) toVal = today;
    let fromVal = filter.from;
    if (fromVal && fromVal > toVal) {
      fromVal = toVal;
    }
    setFilter({ from: fromVal, to: toVal });
  };

  const handleApplyFilter = () => {
    if (currentProject?.id) {
      fetchReport(Number(currentProject.id));
    }
  };

  const handleResetFilter = () => {
    resetFilter(propFrom, propTo);
    if (currentProject?.id) {
      setTimeout(() => fetchReport(Number(currentProject.id)), 0);
    }
  };

  const isMemberRole = role === 'member' || report?.scope === 'PROJECT_SUMMARY';

  const toggleArrayFilter = (field: 'memberIds' | 'roles' | 'issueTypes' | 'priorities' | 'statuses', val: any) => {
    const cur = (filter[field] as any[]) || [];
    const exists = cur.includes(val);
    const next = exists ? cur.filter((x) => x !== val) : [...cur, val];
    setFilter({ [field]: next });
  };

  const members = report?.members || [];

  const getWorkloadText = (level?: string, userId?: number) => {
    if (userId === 0) return '—';
    switch (level) {
      case 'UNDERLOAD':
        return 'Thấp';
      case 'OVERLOAD':
        return 'Quá tải';
      case 'BALANCED':
        return 'Cân bằng';
      default:
        return '—';
    }
  };

  const chartData = members.map((m) => ({
    member: m.fullName || m.email,
    loggedHours: m.totalLoggedHours || 0,
    estimatedHours: m.estimatedHours || 0,
    completed: m.completedIssues || 0,
    inProgress: m.inProgressIssues || 0,
  }));

  if (isMemberRole) {
    return (
      <div className="border border-[#E5E5E7] rounded-xl p-8 bg-white text-center">
        <h3 className="text-base font-semibold text-[#1A1A1A] mb-2">{MESSAGES.REPORTS.TAB_PRODUCTIVITY}</h3>
        <p className="text-sm text-[#6B6B70] max-w-lg mx-auto">
          {MESSAGES.REPORTS.PERMISSION_DENIED}
        </p>
      </div>
    );
  }

  const selectedMemberCount = (filter.memberIds || []).length;

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="border border-[#E5E5E7] rounded-xl p-4 bg-white shadow-xs space-y-3.5">
        {/* Row 1: Kỳ báo cáo (Từ ngày đến ngày) & [ ] Chỉ công việc quá hạn trên cùng 1 hàng */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#1A1A1A]">{MESSAGES.REPORTS.FILTER_PERIOD}:</span>
              <div className="flex items-center gap-1.5 text-xs text-[#6B6B70]">
                <input
                  type="date"
                  value={filter.from || ''}
                  max={filter.to && filter.to < today ? filter.to : today}
                  onChange={(e) => handleFromChange(e.target.value)}
                  className="border border-[#E5E5E7] rounded-lg px-2.5 py-1.5 text-xs text-[#1A1A1A] bg-white focus:outline-none focus:border-[#1A1A1A] shadow-2xs"
                />
                <span className="text-[#9B9B9F]">đến</span>
                <input
                  type="date"
                  value={filter.to || ''}
                  min={filter.from || undefined}
                  max={today}
                  onChange={(e) => handleToChange(e.target.value)}
                  className="border border-[#E5E5E7] rounded-lg px-2.5 py-1.5 text-xs text-[#1A1A1A] bg-white focus:outline-none focus:border-[#1A1A1A] shadow-2xs"
                />
              </div>
            </div>

            {/* Checkbox "Chỉ công việc quá hạn" thẳng hàng với Kỳ báo cáo */}
            <label className="flex items-center gap-2 cursor-pointer text-xs select-none">
              <input
                type="checkbox"
                checked={Boolean(filter.overdueOnly)}
                onChange={(e) => setFilter({ overdueOnly: e.target.checked })}
                className="rounded border-[#E5E5E7] text-[#D9381E] focus:ring-0 w-4 h-4 cursor-pointer"
              />
              <span className="font-semibold text-[#D9381E]">{MESSAGES.REPORTS.FILTER_OVERDUE_ONLY}</span>
            </label>
          </div>
        </div>

        {/* Row 2: Right down action buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#F0F0F1]">
          {/* Active criteria counter */}
          <div className="flex items-center gap-2">
            {((filter.memberIds?.length || 0) + (filter.roles?.length || 0) + (filter.issueTypes?.length || 0) + (filter.statuses?.length || 0)) > 0 && (
              <span className="text-[11px] text-[#6B6B70]">
                Đang áp dụng <strong className="text-[#1A1A1A]">{(filter.memberIds?.length || 0) + (filter.roles?.length || 0) + (filter.issueTypes?.length || 0) + (filter.statuses?.length || 0)}</strong> tiêu chí lọc nâng cao
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border rounded-lg transition-colors ${
                showAdvancedFilters || ((filter.memberIds?.length || 0) + (filter.roles?.length || 0) + (filter.issueTypes?.length || 0) + (filter.statuses?.length || 0)) > 0
                  ? 'border-[#1A1A1A] bg-[#1A1A1A]/5 text-[#1A1A1A]'
                  : 'border-[#E5E5E7] hover:bg-[#F9F9FB] text-[#1A1A1A]'
              }`}
            >
              <span>{showAdvancedFilters ? 'Ẩn bộ lọc chi tiết' : 'Bộ lọc chi tiết'}</span>
              {((filter.memberIds?.length || 0) + (filter.roles?.length || 0) + (filter.issueTypes?.length || 0) + (filter.statuses?.length || 0)) > 0 && (
                <span className="w-4 h-4 rounded-full bg-[#1A1A1A] text-white text-[9px] font-bold flex items-center justify-center">
                  {(filter.memberIds?.length || 0) + (filter.roles?.length || 0) + (filter.issueTypes?.length || 0) + (filter.statuses?.length || 0)}
                </span>
              )}
              <svg
                className={`w-3.5 h-3.5 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <button
              type="button"
              onClick={handleResetFilter}
              className="px-3 py-1.5 text-xs font-medium text-[#6B6B70] hover:text-[#1A1A1A] hover:bg-[#F9F9FB] border border-[#E5E5E7] rounded-lg transition-colors"
            >
              {MESSAGES.REPORTS.RESET_FILTER}
            </button>

            <button
              type="button"
              onClick={handleApplyFilter}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-[#E53E3E] text-white rounded-lg hover:bg-[#C53030] transition-colors shadow-xs"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>Tìm kiếm</span>
            </button>
          </div>
        </div>

        {/* Detailed multi-select row (collapsible) */}
        {showAdvancedFilters && (
          <div ref={filterPanelRef} className="pt-3 border-t border-[#F0F0F1] space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              {/* Field 1: Thành viên dạng Dropdownlist đa chọn */}
              <div className="relative">
                <label className="block text-[11px] font-semibold text-[#6B6B70] uppercase tracking-wider mb-1">
                  {MESSAGES.REPORTS.FILTER_MEMBERS}
                </label>
                <button
                  type="button"
                  onClick={() => setOpenDropdown(openDropdown === 'members' ? null : 'members')}
                  className={`w-full h-9 px-3 text-left border rounded-lg bg-white flex items-center justify-between gap-2 text-xs transition-colors shadow-2xs ${
                    selectedMemberCount > 0
                      ? 'border-[#1A1A1A] font-semibold text-[#1A1A1A] bg-blue-50/20'
                      : 'border-[#E5E5E7] text-[#6B6B70] hover:border-[#1A1A1A]'
                  }`}
                >
                  <span className="truncate">
                    {selectedMemberCount === 0
                      ? `Tất cả thành viên (${allMembers.length})`
                      : `Đã chọn ${selectedMemberCount} thành viên`}
                  </span>
                  <svg
                    className={`w-3.5 h-3.5 text-[#6B6B70] shrink-0 transition-transform ${openDropdown === 'members' ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {openDropdown === 'members' && (
                  <div className="absolute left-0 top-full mt-1.5 z-40 bg-white border border-[#E5E5E7] rounded-xl shadow-xl p-2.5 space-y-2 min-w-[280px] w-full">
                    {/* Search inside */}
                    <div className="relative">
                      <input
                        type="text"
                        value={memberSearchTerm}
                        onChange={(e) => setMemberSearchTerm(e.target.value)}
                        placeholder="Tìm theo tên/email..."
                        className="w-full text-xs px-2.5 py-1.5 pl-7 border border-[#E5E5E7] rounded-lg bg-[#F9F9FB] focus:bg-white focus:outline-none focus:border-[#1A1A1A]"
                      />
                      <svg className="w-3.5 h-3.5 text-[#9B9B9F] absolute left-2 top-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>

                    {/* Quick bar */}
                    <div className="flex items-center justify-between text-[11px] px-1 text-[#6B6B70] border-b border-[#F0F0F1] pb-1.5">
                      <span>{filteredMemberList.length} thành viên</span>
                      <div className="space-x-2">
                        <button
                          type="button"
                          onClick={() => setFilter({ memberIds: allMembers.map((m) => m.id) })}
                          className="text-[#1A1A1A] hover:underline font-medium"
                        >
                          Chọn tất cả
                        </button>
                        <button
                          type="button"
                          onClick={() => setFilter({ memberIds: [] })}
                          className="text-rose-600 hover:underline"
                        >
                          Xóa chọn
                        </button>
                      </div>
                    </div>

                    {/* Members List */}
                    <div className="max-h-52 overflow-y-auto space-y-0.5 divide-y divide-[#F9F9FB]">
                      {filteredMemberList.length === 0 ? (
                        <p className="text-center py-4 text-[11px] text-[#9B9B9F]">Không tìm thấy thành viên</p>
                      ) : (
                        filteredMemberList.map((m) => {
                          const isChecked = (filter.memberIds || []).includes(m.id);
                          return (
                            <label
                              key={m.id}
                              className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${
                                isChecked ? 'bg-blue-50/60' : 'hover:bg-[#F9F9FB]'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleArrayFilter('memberIds', m.id)}
                                className="rounded border-[#E5E5E7] text-[#1A1A1A] focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                              />
                              {m.id === 0 ? (
                                <div className="w-5 h-5 rounded-full bg-[#F0F0F1] text-[#6B6B70] flex items-center justify-center text-[9px] font-bold shrink-0">
                                  ?
                                </div>
                              ) : m.avatarUrl ? (
                                <img src={m.avatarUrl} alt="" className="w-5 h-5 rounded-full object-cover shrink-0" />
                              ) : (
                                <div className="w-5 h-5 rounded-full bg-[#1A1A1A] text-white flex items-center justify-center text-[9px] font-bold shrink-0">
                                  {m.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold text-[#1A1A1A] text-[11px] truncate leading-tight">{m.name}</p>
                                <p className="text-[10px] text-[#6B6B70] truncate leading-tight">{m.email}</p>
                              </div>
                              {m.role && m.role !== '—' && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-[#F0F0F1] text-[#6B6B70] shrink-0 uppercase">
                                  {m.role}
                                </span>
                              )}
                            </label>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Field 2: Vai trò */}
              <div className="relative">
                <label className="block text-[11px] font-semibold text-[#6B6B70] uppercase tracking-wider mb-1">
                  {MESSAGES.REPORTS.FILTER_ROLES}
                </label>
                <button
                  type="button"
                  onClick={() => setOpenDropdown(openDropdown === 'roles' ? null : 'roles')}
                  className={`w-full h-9 px-3 text-left border rounded-lg bg-white flex items-center justify-between gap-2 text-xs transition-colors shadow-2xs ${
                    (filter.roles || []).length > 0
                      ? 'border-[#1A1A1A] font-semibold text-[#1A1A1A] bg-blue-50/20'
                      : 'border-[#E5E5E7] text-[#6B6B70] hover:border-[#1A1A1A]'
                  }`}
                >
                  <span className="truncate">
                    {(filter.roles || []).length === 0
                      ? 'Tất cả vai trò'
                      : `Đã chọn ${(filter.roles || []).length} vai trò`}
                  </span>
                  <svg
                    className={`w-3.5 h-3.5 text-[#6B6B70] shrink-0 transition-transform ${openDropdown === 'roles' ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {openDropdown === 'roles' && (
                  <div className="absolute left-0 top-full mt-1.5 z-40 bg-white border border-[#E5E5E7] rounded-xl shadow-xl p-2.5 space-y-2 min-w-[240px] w-full">
                    <div className="flex items-center justify-between text-[11px] px-1 text-[#6B6B70] border-b border-[#F0F0F1] pb-1.5">
                      <span>{ROLE_OPTIONS.length} vai trò</span>
                      <div className="space-x-2">
                        <button
                          type="button"
                          onClick={() => setFilter({ roles: ROLE_OPTIONS.map((r) => r.value) })}
                          className="text-[#1A1A1A] hover:underline font-medium"
                        >
                          Chọn tất cả
                        </button>
                        <button
                          type="button"
                          onClick={() => setFilter({ roles: [] })}
                          className="text-rose-600 hover:underline"
                        >
                          Xóa chọn
                        </button>
                      </div>
                    </div>
                    <div className="max-h-52 overflow-y-auto space-y-0.5">
                      {ROLE_OPTIONS.map((r) => {
                        const isChecked = (filter.roles || []).includes(r.value);
                        return (
                          <label
                            key={r.value}
                            className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${
                              isChecked ? 'bg-blue-50/60 font-medium text-[#1A1A1A]' : 'hover:bg-[#F9F9FB] text-[#1A1A1A]'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleArrayFilter('roles', r.value)}
                              className="rounded border-[#E5E5E7] text-[#1A1A1A] focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                            />
                            <span className="truncate text-xs">{r.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Field 3: Loại công việc */}
              <div className="relative">
                <label className="block text-[11px] font-semibold text-[#6B6B70] uppercase tracking-wider mb-1">
                  {MESSAGES.REPORTS.FILTER_TYPES}
                </label>
                <button
                  type="button"
                  onClick={() => setOpenDropdown(openDropdown === 'types' ? null : 'types')}
                  className={`w-full h-9 px-3 text-left border rounded-lg bg-white flex items-center justify-between gap-2 text-xs transition-colors shadow-2xs ${
                    (filter.issueTypes || []).length > 0
                      ? 'border-[#1A1A1A] font-semibold text-[#1A1A1A] bg-blue-50/20'
                      : 'border-[#E5E5E7] text-[#6B6B70] hover:border-[#1A1A1A]'
                  }`}
                >
                  <span className="truncate">
                    {(filter.issueTypes || []).length === 0
                      ? 'Tất cả loại công việc'
                      : `Đã chọn ${(filter.issueTypes || []).length} loại`}
                  </span>
                  <svg
                    className={`w-3.5 h-3.5 text-[#6B6B70] shrink-0 transition-transform ${openDropdown === 'types' ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {openDropdown === 'types' && (
                  <div className="absolute left-0 top-full mt-1.5 z-40 bg-white border border-[#E5E5E7] rounded-xl shadow-xl p-2.5 space-y-2 min-w-[240px] w-full">
                    <div className="flex items-center justify-between text-[11px] px-1 text-[#6B6B70] border-b border-[#F0F0F1] pb-1.5">
                      <span>{ISSUE_TYPE_OPTIONS.length} loại công việc</span>
                      <div className="space-x-2">
                        <button
                          type="button"
                          onClick={() => setFilter({ issueTypes: ISSUE_TYPE_OPTIONS.map((t) => t.value) })}
                          className="text-[#1A1A1A] hover:underline font-medium"
                        >
                          Chọn tất cả
                        </button>
                        <button
                          type="button"
                          onClick={() => setFilter({ issueTypes: [] })}
                          className="text-rose-600 hover:underline"
                        >
                          Xóa chọn
                        </button>
                      </div>
                    </div>
                    <div className="max-h-52 overflow-y-auto space-y-0.5">
                      {ISSUE_TYPE_OPTIONS.map((t) => {
                        const isChecked = (filter.issueTypes || []).includes(t.value);
                        return (
                          <label
                            key={t.value}
                            className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${
                              isChecked ? 'bg-blue-50/60 font-medium text-[#1A1A1A]' : 'hover:bg-[#F9F9FB] text-[#1A1A1A]'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleArrayFilter('issueTypes', t.value)}
                              className="rounded border-[#E5E5E7] text-[#1A1A1A] focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                            />
                            <IssueTypeIcon type={t.value as any} />
                            <span className="truncate text-xs">{t.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Field 4: Trạng thái */}
              <div className="relative">
                <label className="block text-[11px] font-semibold text-[#6B6B70] uppercase tracking-wider mb-1">
                  {MESSAGES.REPORTS.FILTER_STATUSES}
                </label>
                <button
                  type="button"
                  onClick={() => setOpenDropdown(openDropdown === 'statuses' ? null : 'statuses')}
                  className={`w-full h-9 px-3 text-left border rounded-lg bg-white flex items-center justify-between gap-2 text-xs transition-colors shadow-2xs ${
                    (filter.statuses || []).length > 0
                      ? 'border-[#1A1A1A] font-semibold text-[#1A1A1A] bg-blue-50/20'
                      : 'border-[#E5E5E7] text-[#6B6B70] hover:border-[#1A1A1A]'
                  }`}
                >
                  <span className="truncate">
                    {(filter.statuses || []).length === 0
                      ? 'Tất cả trạng thái'
                      : `Đã chọn ${(filter.statuses || []).length} trạng thái`}
                  </span>
                  <svg
                    className={`w-3.5 h-3.5 text-[#6B6B70] shrink-0 transition-transform ${openDropdown === 'statuses' ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {openDropdown === 'statuses' && (
                  <div className="absolute left-0 sm:left-auto sm:right-0 top-full mt-1.5 z-40 bg-white border border-[#E5E5E7] rounded-xl shadow-xl p-2.5 space-y-2 min-w-[240px] w-full">
                    <div className="flex items-center justify-between text-[11px] px-1 text-[#6B6B70] border-b border-[#F0F0F1] pb-1.5">
                      <span>{STATUS_OPTIONS.length} trạng thái</span>
                      <div className="space-x-2">
                        <button
                          type="button"
                          onClick={() => setFilter({ statuses: STATUS_OPTIONS.map((s) => s.value) })}
                          className="text-[#1A1A1A] hover:underline font-medium"
                        >
                          Chọn tất cả
                        </button>
                        <button
                          type="button"
                          onClick={() => setFilter({ statuses: [] })}
                          className="text-rose-600 hover:underline"
                        >
                          Xóa chọn
                        </button>
                      </div>
                    </div>
                    <div className="max-h-52 overflow-y-auto space-y-0.5">
                      {STATUS_OPTIONS.map((s) => {
                        const isChecked = (filter.statuses || []).includes(s.value);
                        return (
                          <label
                            key={s.value}
                            className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${
                              isChecked ? 'bg-blue-50/60 font-medium text-[#1A1A1A]' : 'hover:bg-[#F9F9FB] text-[#1A1A1A]'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleArrayFilter('statuses', s.value)}
                              className="rounded border-[#E5E5E7] text-[#1A1A1A] focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                            />
                            <span className="truncate text-xs">{s.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Active filter chips */}
            {((filter.memberIds?.length || 0) + (filter.roles?.length || 0) + (filter.issueTypes?.length || 0) + (filter.statuses?.length || 0)) > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[#F0F0F1]">
                <span className="text-[11px] text-[#9B9B9F] mr-1">Đang chọn:</span>
                {(filter.memberIds || []).map((id) => {
                  const m = allMembers.find((item) => item.id === id);
                  return (
                    <span
                      key={`m-${id}`}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-800 rounded-md text-[11px] font-medium"
                    >
                      {m?.name || `ID ${id}`}
                      <button
                        type="button"
                        onClick={() => toggleArrayFilter('memberIds', id)}
                        className="hover:text-blue-950 font-bold ml-0.5"
                      >
                        ×
                      </button>
                    </span>
                  );
                })}
                {(filter.roles || []).map((role) => (
                  <span
                    key={`r-${role}`}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 text-purple-800 rounded-md text-[11px] font-medium"
                  >
                    {ROLE_OPTIONS.find((r) => r.value === role)?.label || role}
                    <button
                      type="button"
                      onClick={() => toggleArrayFilter('roles', role)}
                      className="hover:text-purple-950 font-bold ml-0.5"
                    >
                      ×
                    </button>
                  </span>
                ))}
                {(filter.issueTypes || []).map((type) => (
                  <span
                    key={`t-${type}`}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-800 rounded-md text-[11px] font-medium"
                  >
                    {ISSUE_TYPE_OPTIONS.find((t) => t.value === type)?.label || type}
                    <button
                      type="button"
                      onClick={() => toggleArrayFilter('issueTypes', type)}
                      className="hover:text-amber-950 font-bold ml-0.5"
                    >
                      ×
                    </button>
                  </span>
                ))}
                {(filter.statuses || []).map((st) => (
                  <span
                    key={`s-${st}`}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded-md text-[11px] font-medium"
                  >
                    {st}
                    <button
                      type="button"
                      onClick={() => toggleArrayFilter('statuses', st)}
                      className="hover:text-emerald-950 font-bold ml-0.5"
                    >
                      ×
                    </button>
                  </span>
                ))}
                <button
                  type="button"
                  onClick={() => setFilter({ memberIds: [], roles: [], issueTypes: [], statuses: [] })}
                  className="text-[11px] text-rose-600 hover:underline font-medium ml-1"
                >
                  Xóa tất cả
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {loading && (
        <div className="py-12 text-center text-xs text-[#9B9B9F] flex items-center justify-center gap-2">
          <svg className="animate-spin h-4 w-4 text-[#1A1A1A]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
          </svg>
          <span>{MESSAGES.COMMON.LOADING}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
          {error}
        </div>
      )}

      {/* Summary KPI row */}
      {!loading && report && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="border border-[#E5E5E7] rounded-xl p-3.5 bg-white">
            <p className="text-[10px] font-medium text-[#9B9B9F] uppercase tracking-wider mb-0.5">{MESSAGES.REPORTS.KPI_ASSIGNED}</p>
            <p className="text-xl font-bold text-[#1A1A1A]">{report.totalAssigned ?? 0}</p>
            <p className="text-[11px] text-[#6B6B70] mt-0.5">Xong: {report.totalCompleted} | Làm: {report.totalInProgress} | Chưa làm: {report.totalTodo ?? 0}</p>
          </div>

          <div className="border border-[#E5E5E7] rounded-xl p-3.5 bg-white">
            <p className="text-[10px] font-medium text-[#9B9B9F] uppercase tracking-wider mb-0.5">{MESSAGES.REPORTS.KPI_ON_TIME_RATE}</p>
            <p className={`text-xl font-bold ${
              report.totalCompleted === 0 && (report.totalOverdue ?? 0) > 0
                ? 'text-rose-600'
                : (report.overallOnTimeRate ?? 100) < 80
                ? 'text-amber-600'
                : 'text-emerald-600'
            }`}>
              {report.totalCompleted === 0 && (report.totalOverdue ?? 0) === 0
                ? '—'
                : (report.overallOnTimeRate != null ? `${report.overallOnTimeRate}%` : '—')}
            </p>
            <p className="text-[11px] text-[#6B6B70] mt-0.5">Quá hạn: <span className="text-rose-600 font-semibold">{report.totalOverdue ?? 0}</span></p>
          </div>

          <div className="border border-[#E5E5E7] rounded-xl p-3.5 bg-white">
            <p className="text-[10px] font-medium text-[#9B9B9F] uppercase tracking-wider mb-0.5">{MESSAGES.REPORTS.KPI_LOGGED_HOURS}</p>
            <p className="text-xl font-bold text-[#1A1A1A]">{report.totalLoggedHours != null ? `${report.totalLoggedHours}h` : '0h'}</p>
            <p className="text-[11px] text-[#6B6B70] mt-0.5">Ước tính: {report.totalEstimatedHours != null ? `${report.totalEstimatedHours}h` : '0h'}</p>
          </div>

          <div className="border border-[#E5E5E7] rounded-xl p-3.5 bg-white">
            <p className="text-[10px] font-medium text-[#9B9B9F] uppercase tracking-wider mb-0.5">{MESSAGES.REPORTS.KPI_AVG_RESOLUTION}</p>
            <p className="text-xl font-bold text-[#1A1A1A]">{report.avgResolutionTimeHours != null ? `${report.avgResolutionTimeHours}h` : '—'}</p>
            <p className="text-[11px] text-[#6B6B70] mt-0.5">Tạo đến hoàn thành</p>
          </div>

          <div className="border border-[#E5E5E7] rounded-xl p-3.5 bg-white">
            <p className="text-[10px] font-medium text-[#9B9B9F] uppercase tracking-wider mb-0.5">{MESSAGES.REPORTS.KPI_BUGS}</p>
            <p className="text-xl font-bold text-rose-600">{report.totalBugsAssigned ?? 0}</p>
            <p className="text-[11px] text-[#6B6B70] mt-0.5">Sửa: {report.totalBugsResolved ?? 0} | Reopen: {report.totalBugsReopened ?? 0}</p>
          </div>
        </div>
      )}

      {/* Charts */}
      {!loading && chartData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Chart 1: Logged vs Estimated Hours */}
          <div className="border border-[#E5E5E7] rounded-xl p-4 bg-white">
            <h3 className="text-xs font-semibold text-[#1A1A1A] mb-3">Thời gian làm việc theo thành viên (Giờ)</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData} margin={{ top: 5, right: 10, bottom: 20, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F1" vertical={false} />
                <XAxis dataKey="member" tick={{ fontSize: 10, fill: '#9B9B9F' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#9B9B9F' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, color: '#6B6B70' }} />
                <Bar dataKey="loggedHours" name="Giờ đã log" fill="#1A1A1A" radius={[4, 4, 0, 0]} maxBarSize={30} />
                <Bar dataKey="estimatedHours" name="Giờ ước tính" fill="#9B9B9F" radius={[4, 4, 0, 0]} maxBarSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Chart 2: Issues completion */}
          <div className="border border-[#E5E5E7] rounded-xl p-4 bg-white">
            <h3 className="text-xs font-semibold text-[#1A1A1A] mb-3">Khối lượng công việc theo thành viên (Số Issue)</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData} margin={{ top: 5, right: 10, bottom: 20, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F1" vertical={false} />
                <XAxis dataKey="member" tick={{ fontSize: 10, fill: '#9B9B9F' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#9B9B9F' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, color: '#6B6B70' }} />
                <Bar dataKey="completed" name="Đã hoàn thành" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={30} />
                <Bar dataKey="inProgress" name="Đang thực hiện" fill="#E5E5E7" radius={[4, 4, 0, 0]} maxBarSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Members Table */}
      {!loading && members.length > 0 && (
        <div className="border border-[#E5E5E7] rounded-xl p-4 bg-white shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-[#1A1A1A]">Bảng năng suất thành viên ({members.length})</h3>
            <span className="text-[11px] text-[#6B6B70]">Bấm vào dòng để xem chi tiết Issue & Worklog</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-[#E5E5E7] text-[#9B9B9F] font-medium uppercase tracking-wider bg-[#F9F9FB]">
                  <th
                    className="py-2.5 px-3 cursor-pointer hover:text-[#1A1A1A]"
                    onClick={() => setFilter({ sort: filter.sort === 'name_asc' ? 'name_desc' : 'name_asc' })}
                  >
                    {MESSAGES.REPORTS.TABLE_MEMBER}
                  </th>
                  <th className="py-2.5 px-2">{MESSAGES.REPORTS.TABLE_ROLE}</th>
                  <th className="py-2.5 px-2 text-right">{MESSAGES.REPORTS.TABLE_ASSIGNED}</th>
                  <th
                    className="py-2.5 px-2 text-right cursor-pointer hover:text-[#1A1A1A]"
                    onClick={() => setFilter({ sort: filter.sort === 'completed_desc' ? 'completed_asc' : 'completed_desc' })}
                  >
                    {MESSAGES.REPORTS.TABLE_COMPLETED}
                  </th>
                  <th className="py-2.5 px-2 text-right">{MESSAGES.REPORTS.TABLE_IN_PROGRESS}</th>
                  <th
                    className="py-2.5 px-2 text-right cursor-pointer hover:text-[#1A1A1A]"
                    onClick={() => setFilter({ sort: filter.sort === 'onTime_desc' ? 'onTime_asc' : 'onTime_desc' })}
                  >
                    {MESSAGES.REPORTS.TABLE_ON_TIME}
                  </th>
                  <th
                    className="py-2.5 px-2 text-right cursor-pointer hover:text-[#1A1A1A]"
                    onClick={() => setFilter({ sort: filter.sort === 'overdue_desc' ? 'completed_desc' : 'overdue_desc' })}
                  >
                    {MESSAGES.REPORTS.TABLE_OVERDUE}
                  </th>
                  <th
                    className="py-2.5 px-2 text-right cursor-pointer hover:text-[#1A1A1A]"
                    onClick={() => setFilter({ sort: filter.sort === 'logged_desc' ? 'logged_asc' : 'logged_desc' })}
                  >
                    {MESSAGES.REPORTS.TABLE_LOGGED_H}
                  </th>
                  <th
                    className="py-2.5 px-2 text-right cursor-pointer hover:text-[#1A1A1A]"
                    onClick={() => setFilter({ sort: filter.sort === 'variance_desc' ? 'completed_desc' : 'variance_desc' })}
                  >
                    {MESSAGES.REPORTS.TABLE_VARIANCE}
                  </th>
                  <th className="py-2.5 px-2 text-right">{MESSAGES.REPORTS.TABLE_AVG_TIME}</th>
                  <th className="py-2.5 px-2 text-center">{MESSAGES.REPORTS.TABLE_BUGS}</th>
                  <th className="py-2.5 px-3 text-center">{MESSAGES.REPORTS.TABLE_WORKLOAD}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F0F1]">
                {members.map((m) => (
                  <tr
                    key={m.userId}
                    onClick={() => currentProject && selectMember(Number(currentProject.id), m.userId)}
                    className="hover:bg-blue-50/50 cursor-pointer transition-colors"
                  >
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        {m.userId === 0 ? (
                          <div className="w-6 h-6 rounded-full bg-[#F0F0F1] text-[#6B6B70] flex items-center justify-center text-[10px] font-bold shrink-0">
                            ?
                          </div>
                        ) : m.avatarUrl ? (
                          <img src={m.avatarUrl} alt="" className="w-6 h-6 rounded-full object-cover shrink-0" />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-[#1A1A1A] text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                            {(m.fullName || m.email || '?').charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold text-[#1A1A1A] truncate">{m.fullName}</p>
                          <p className="text-[10px] text-[#6B6B70] truncate">{m.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-2 text-[#6B6B70] text-[11px]">{m.projectRole || '—'}</td>
                    <td className="py-2.5 px-2 text-right font-medium text-[#1A1A1A]">{m.assignedIssues ?? 0}</td>
                    <td className="py-2.5 px-2 text-right font-semibold text-emerald-700">{m.completedIssues}</td>
                    <td className="py-2.5 px-2 text-right text-[#6B6B70]">{m.inProgressIssues}</td>
                    <td className="py-2.5 px-2 text-right font-medium text-[#1A1A1A]">
                      {m.assignedIssues === 0 && m.completedIssues === 0 && m.overdueIssues === 0 ? '—' : (m.onTimeRate != null ? `${m.onTimeRate}%` : '—')}
                    </td>
                    <td className="py-2.5 px-2 text-right font-semibold text-rose-600">
                      {m.overdueIssues ?? 0}
                    </td>
                    <td className="py-2.5 px-2 text-right font-medium text-[#1A1A1A]">
                      {m.totalLoggedHours != null ? `${m.totalLoggedHours}h` : '0h'}
                    </td>
                    <td className="py-2.5 px-2 text-right text-[11px]">
                      {m.variancePercentage != null ? (
                        <span className={m.variancePercentage > 0 ? 'text-rose-600 font-medium' : 'text-emerald-600 font-medium'}>
                          {m.variancePercentage > 0 ? `+${m.variancePercentage}%` : `${m.variancePercentage}%`}
                        </span>
                      ) : '0%'}
                    </td>
                    <td className="py-2.5 px-2 text-right text-[#6B6B70]">
                      {m.avgResolutionTimeHours != null ? `${m.avgResolutionTimeHours}h` : '—'}
                    </td>
                    <td className="py-2.5 px-2 text-center text-[11px] text-[#6B6B70]">
                      <span className="text-[#1A1A1A] font-medium">{m.bugsAssigned ?? 0}</span>
                      {' / '}
                      <span className="text-emerald-700 font-medium">{m.bugsResolved ?? 0}</span>
                      {' / '}
                      <span className="text-rose-600 font-medium">{m.bugsReopened ?? 0}</span>
                    </td>
                    <td className="py-2.5 px-3 text-center text-[#6B6B70] text-xs">
                      {getWorkloadText(m.workloadLevel, m.userId)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Member Detail Drawer */}
      {selectedMemberId && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-xs transition-opacity animate-fade-in">
          <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col overflow-hidden animate-slide-left">
            {/* Drawer Header */}
            <div className="p-4 border-b border-[#E5E5E7] flex items-center justify-between bg-[#F9F9FB]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#1A1A1A] text-white flex items-center justify-center text-sm font-bold shrink-0">
                  {(memberDetail?.member?.fullName || memberDetail?.member?.email || '?').charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-[#1A1A1A]">{memberDetail?.member?.fullName}</h2>
                    {memberDetail?.member?.userId !== 0 && (
                      <span className="text-xs text-[#6B6B70] font-normal">
                        ({getWorkloadText(memberDetail?.member?.workloadLevel, memberDetail?.member?.userId)})
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#6B6B70]">{memberDetail?.member?.email} • {memberDetail?.member?.projectRole}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => currentProject && selectMember(Number(currentProject.id), null)}
                className="w-11 h-11 flex items-center justify-center rounded-lg text-[#6B6B70] hover:text-[#1A1A1A] hover:bg-white transition-colors"
                aria-label="Đóng chi tiết thành viên"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Quick stats ribbon */}
            {memberDetail?.member && (
              <div className="px-4 py-2.5 bg-white border-b border-[#F0F0F1] grid grid-cols-4 gap-2 text-center text-xs">
                <div>
                  <p className="text-[10px] text-[#9B9B9F] uppercase font-medium">Hoàn thành</p>
                  <p className="text-sm font-bold text-[#1A1A1A]">{memberDetail.member.completedIssues}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[#9B9B9F] uppercase font-medium">Đúng hạn</p>
                  <p className="text-sm font-bold text-emerald-600">{memberDetail.member.onTimeRate}%</p>
                </div>
                <div>
                  <p className="text-[10px] text-[#9B9B9F] uppercase font-medium">Quá hạn</p>
                  <p className="text-sm font-bold text-rose-600">{memberDetail.member.overdueIssues}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[#9B9B9F] uppercase font-medium">Đã log</p>
                  <p className="text-sm font-bold text-[#1A1A1A]">{memberDetail.totalLoggedHours}h</p>
                </div>
              </div>
            )}

            {/* Drawer Tabs */}
            <div className="flex border-b border-[#E5E5E7] px-4 bg-[#F9F9FB]">
              <button
                type="button"
                onClick={() => setDrawerTab('issues')}
                className={`py-2 px-3 text-xs font-medium border-b-2 transition-colors ${
                  drawerTab === 'issues' ? 'border-[#1A1A1A] text-[#1A1A1A]' : 'border-transparent text-[#6B6B70] hover:text-[#1A1A1A]'
                }`}
              >
                {MESSAGES.REPORTS.DRAWER_TAB_ISSUES} ({memberDetail?.issues?.length || 0})
              </button>
              <button
                type="button"
                onClick={() => setDrawerTab('worklogs')}
                className={`py-2 px-3 text-xs font-medium border-b-2 transition-colors ${
                  drawerTab === 'worklogs' ? 'border-[#1A1A1A] text-[#1A1A1A]' : 'border-transparent text-[#6B6B70] hover:text-[#1A1A1A]'
                }`}
              >
                {MESSAGES.REPORTS.DRAWER_TAB_WORKLOGS} ({memberDetail?.worklogs?.length || 0})
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-4">
              {loadingDetail ? (
                <div className="py-12 text-center text-xs text-[#9B9B9F]">Đang tải chi tiết thành viên...</div>
              ) : drawerTab === 'issues' ? (
                memberDetail?.issues && memberDetail.issues.length > 0 ? (
                  <div className="space-y-2">
                    {memberDetail.issues.map((is) => (
                      <div key={is.id} className="p-3 border border-[#E5E5E7] rounded-lg hover:border-[#1A1A1A] transition-colors text-xs bg-white">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-[#1A1A1A]">
                            <IssueTypeIcon type={is.type as any} />
                            <span>{is.key}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#F0F0F1] text-[#1A1A1A] font-medium">
                              {is.status}
                            </span>
                            <PriorityTag priority={is.priority as any} />
                            {is.overdue && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-50 text-rose-700 font-semibold border border-rose-200">
                                Quá hạn
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="font-medium text-[#1A1A1A] line-clamp-1">{is.summary}</p>
                        <div className="flex items-center justify-between text-[11px] text-[#6B6B70] mt-2 pt-2 border-t border-[#F0F0F1]">
                          <span>Hạn: {is.dueDate || 'Chưa đặt'}</span>
                          <span>Ước tính: {is.estimatedHours}h | Đã log: {is.loggedHours}h</span>
                          <span className={is.onTime ? 'text-emerald-600 font-medium' : 'text-rose-600 font-medium'}>
                            {is.onTime ? 'Đúng hạn' : 'Trễ hạn'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center text-xs text-[#9B9B9F]">
                    {MESSAGES.REPORTS.DRAWER_EMPTY_ISSUES}
                  </div>
                )
              ) : (
                memberDetail?.worklogs && memberDetail.worklogs.length > 0 ? (
                  <div className="space-y-2">
                    {memberDetail.worklogs.map((wl) => (
                      <div key={wl.id} className="p-3 border border-[#E5E5E7] rounded-lg text-xs bg-white">
                        <div className="flex items-center justify-between text-[#6B6B70] mb-1">
                          <span className="font-semibold text-[#1A1A1A]">{wl.workDate}</span>
                          <span className="font-bold text-[#1A1A1A] bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-200">
                            {wl.timeSpentHours}h ({wl.timeSpentMin}m)
                          </span>
                        </div>
                        <p className="font-medium text-[#1A1A1A]">{wl.issueKey}: {wl.issueSummary}</p>
                        {wl.comment && (
                          <p className="text-[11px] text-[#6B6B70] mt-1 bg-[#F9F9FB] p-2 rounded">
                            {wl.comment}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center text-xs text-[#9B9B9F]">
                    {MESSAGES.REPORTS.DRAWER_EMPTY_WORKLOGS}
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
