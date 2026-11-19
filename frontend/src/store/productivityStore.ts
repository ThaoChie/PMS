import { create } from 'zustand';
import { reportService } from '../services/reportService';
import { toast } from './toastStore';
import { MESSAGES } from '../constants/messages';
import type {
  ProductivityFilter,
  ProductivityReportResponse,
  MemberDetailProductivityResponse,
} from '../types';

interface ProductivityState {
  filter: ProductivityFilter;
  report: ProductivityReportResponse | null;
  loading: boolean;
  error: string | null;
  exporting: boolean;

  // Member detail drawer
  selectedMemberId: number | null;
  memberDetail: MemberDetailProductivityResponse | null;
  loadingDetail: boolean;
  detailError: string | null;

  // Actions
  setFilter: (patch: Partial<ProductivityFilter>) => void;
  resetFilter: (defaultFrom?: string, defaultTo?: string) => void;
  fetchReport: (projectId: number) => Promise<void>;
  selectMember: (projectId: number, userId: number | null) => Promise<void>;
  exportReport: (projectId: number) => Promise<void>;
}

const getDefaultDates = () => {
  const to = new Date().toISOString().split('T')[0];
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - 30);
  const from = fromDate.toISOString().split('T')[0];
  return { from, to };
};

const initialDates = getDefaultDates();

export const useProductivityStore = create<ProductivityState>((set, get) => ({
  filter: {
    from: initialDates.from,
    to: initialDates.to,
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

  setFilter: (patch) => {
    set((state) => ({
      filter: { ...state.filter, ...patch },
    }));
  },

  resetFilter: (defaultFrom, defaultTo) => {
    const dates = defaultFrom && defaultTo ? { from: defaultFrom, to: defaultTo } : getDefaultDates();
    set({
      filter: {
        from: dates.from,
        to: dates.to,
        memberIds: [],
        roles: [],
        issueTypes: [],
        priorities: [],
        statuses: [],
        overdueOnly: false,
        sort: 'completed_desc',
      },
    });
  },

  fetchReport: async (projectId: number) => {
    if (!projectId) return;
    set({ loading: true, error: null });
    try {
      const res: any = await reportService.getProductivityReport(projectId, get().filter);
      const payload = res?.data || res;
      set({ report: payload, loading: false });
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || MESSAGES.COMMON.ACTION_FAILED;
      set({ error: msg, loading: false, report: null });
    }
  },

  selectMember: async (projectId: number, userId: number | null) => {
    if (!userId) {
      set({ selectedMemberId: null, memberDetail: null, loadingDetail: false, detailError: null });
      return;
    }
    set({ selectedMemberId: userId, loadingDetail: true, detailError: null });
    try {
      const res: any = await reportService.getMemberProductivityDetail(projectId, userId, get().filter);
      const payload = res?.data || res;
      set({ memberDetail: payload, loadingDetail: false });
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || MESSAGES.COMMON.ACTION_FAILED;
      set({ detailError: msg, loadingDetail: false, memberDetail: null });
      toast.error(msg);
    }
  },

  exportReport: async (projectId: number) => {
    if (!projectId) return;
    set({ exporting: true });
    try {
      await reportService.exportProductivityReport(projectId, get().filter);
      toast.success(MESSAGES.REPORTS.EXPORT_SUCCESS);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || MESSAGES.COMMON.ACTION_FAILED;
      toast.error(msg);
    } finally {
      set({ exporting: false });
    }
  },
}));
