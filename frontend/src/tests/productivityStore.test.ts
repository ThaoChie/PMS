import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useProductivityStore } from '../store/productivityStore';
import { reportService } from '../services/reportService';
import type { ProductivityReportResponse, MemberDetailProductivityResponse } from '../types';

vi.mock('../services/reportService');
vi.mock('../store/toastStore', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

const mockReport: ProductivityReportResponse = {
  projectId: 1,
  from: '2026-10-01',
  to: '2026-10-31',
  scope: 'MEMBER_DETAIL',
  totalAssigned: 10,
  totalCompleted: 7,
  totalInProgress: 3,
  totalTodo: 0,
  totalOverdue: 1,
  overallOnTimeRate: 85.7,
  totalEstimatedHours: 40.0,
  totalLoggedHours: 38.5,
  avgResolutionTimeHours: 12.0,
  totalBugsAssigned: 2,
  totalBugsResolved: 2,
  totalBugsReopened: 0,
  members: [
    {
      userId: 10,
      fullName: 'John Doe',
      email: 'john@example.com',
      projectRole: 'DEVELOPER',
      assignedIssues: 5,
      completedIssues: 4,
      inProgressIssues: 1,
      todoIssues: 0,
      onTimeCompletedCount: 4,
      onTimeRate: 100.0,
      overdueIssues: 0,
      estimatedHours: 20.0,
      totalLoggedHours: 18.0,
      variancePercentage: -10.0,
      avgResolutionTimeHours: 10.5,
      bugsAssigned: 1,
      bugsResolved: 1,
      bugsReopened: 0,
      workloadLevel: 'BALANCED',
      workloadRatio: 0.9,
      velocity: 4,
    },
  ],
  points: [
    {
      member: 'John Doe',
      completed: 4,
      inProgress: 1,
      velocity: 4,
    },
  ],
};

const mockMemberDetail: MemberDetailProductivityResponse = {
  projectId: 1,
  userId: 10,
  from: '2026-10-01',
  to: '2026-10-31',
  member: mockReport.members[0],
  issues: [
    {
      id: 101,
      key: 'PRJ-101',
      summary: 'Task 1',
      type: 'TASK',
      priority: 'HIGH',
      status: 'Done',
      statusCategory: 'DONE',
      dueDate: '2026-10-15',
      overdue: false,
      originalEstimateMin: 300,
      estimatedHours: 5.0,
      timeSpentMin: 300,
      loggedHours: 5.0,
      variancePercentage: 0.0,
      onTime: true,
    },
  ],
  worklogs: [
    {
      id: 501,
      issueId: 101,
      issueKey: 'PRJ-101',
      issueSummary: 'Task 1',
      workDate: '2026-10-10',
      timeSpentMin: 120,
      timeSpentHours: 2.0,
      comment: 'Progress made',
    },
  ],
  totalIssues: 1,
  totalWorklogs: 1,
  totalLoggedHours: 2.0,
};

describe('ProductivityStore (Zustand)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useProductivityStore.setState({
      filter: {
        from: '2026-10-01',
        to: '2026-10-31',
        memberIds: [],
        roles: [],
        issueTypes: [],
        priorities: [],
        statuses: [],
        overdueOnly: false,
        sort: 'completed_desc',
      },
      report: null,
      loading: false,
      error: null,
      exporting: false,
      selectedMemberId: null,
      memberDetail: null,
      loadingDetail: false,
      detailError: null,
    });
  });

  it('setFilter: updates partial filters correctly', () => {
    useProductivityStore.getState().setFilter({ overdueOnly: true, memberIds: [10, 20] });
    const f = useProductivityStore.getState().filter;
    expect(f.overdueOnly).toBe(true);
    expect(f.memberIds).toEqual([10, 20]);
  });

  it('resetFilter: restores initial filter state with given dates', () => {
    useProductivityStore.getState().setFilter({ overdueOnly: true, memberIds: [10] });
    useProductivityStore.getState().resetFilter('2026-09-01', '2026-09-30');
    const f = useProductivityStore.getState().filter;
    expect(f.overdueOnly).toBe(false);
    expect(f.memberIds).toEqual([]);
    expect(f.from).toBe('2026-09-01');
    expect(f.to).toBe('2026-09-30');
  });

  it('fetchReport: loads report data and clears loading state', async () => {
    vi.mocked(reportService.getProductivityReport).mockResolvedValueOnce({
      success: true,
      message: 'OK',
      data: mockReport,
    } as any);

    await useProductivityStore.getState().fetchReport(1);

    expect(useProductivityStore.getState().loading).toBe(false);
    expect(useProductivityStore.getState().report).toEqual(mockReport);
    expect(useProductivityStore.getState().error).toBeNull();
  });

  it('fetchReport: handles failure and sets error message', async () => {
    vi.mocked(reportService.getProductivityReport).mockRejectedValueOnce({
      response: { data: { message: 'Không có quyền truy cập' } },
    });

    await useProductivityStore.getState().fetchReport(1);

    expect(useProductivityStore.getState().loading).toBe(false);
    expect(useProductivityStore.getState().report).toBeNull();
    expect(useProductivityStore.getState().error).toBe('Không có quyền truy cập');
  });

  it('selectMember: fetches and sets member detail', async () => {
    vi.mocked(reportService.getMemberProductivityDetail).mockResolvedValueOnce({
      success: true,
      message: 'OK',
      data: mockMemberDetail,
    } as any);

    await useProductivityStore.getState().selectMember(1, 10);

    expect(useProductivityStore.getState().selectedMemberId).toBe(10);
    expect(useProductivityStore.getState().memberDetail).toEqual(mockMemberDetail);
    expect(useProductivityStore.getState().loadingDetail).toBe(false);
  });

  it('selectMember: unselects when userId is null', async () => {
    await useProductivityStore.getState().selectMember(1, null);

    expect(useProductivityStore.getState().selectedMemberId).toBeNull();
    expect(useProductivityStore.getState().memberDetail).toBeNull();
  });

  it('exportReport: calls exportProductivityReport service', async () => {
    vi.mocked(reportService.exportProductivityReport).mockResolvedValueOnce(undefined);

    await useProductivityStore.getState().exportReport(1);

    expect(reportService.exportProductivityReport).toHaveBeenCalledWith(1, expect.any(Object));
    expect(useProductivityStore.getState().exporting).toBe(false);
  });
});
