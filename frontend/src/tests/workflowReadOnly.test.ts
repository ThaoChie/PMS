import { describe, it, expect } from 'vitest';
import { computeWorkflowPermissions } from '../features/workflow/utils/workflowPermission';
import type { Project, User } from '../types';

describe('Workflow Settings Read-Only Permissions', () => {
  const pmUser: User = {
    id: '1',
    name: 'PM User',
    email: 'pm@epms.com',
    initials: 'PU',
    role: 'pm',
    status: 'Active',
  };

  const devUser: User = {
    id: '2',
    name: 'Dev User',
    email: 'dev@epms.com',
    initials: 'DU',
    role: 'member',
    status: 'Active',
  };

  const qaUser: User = {
    id: '3',
    name: 'QA User',
    email: 'qa@epms.com',
    initials: 'QU',
    role: 'member',
    status: 'Active',
  };

  const adminUser: User = {
    id: '99',
    name: 'System Admin',
    email: 'admin@epms.com',
    initials: 'SA',
    role: 'admin',
    status: 'Active',
  };

  const activeProject: Project = {
    id: '100',
    name: 'Active Project',
    key: 'ACT',
    description: 'Active Project Desc',
    status: 'Active',
    openIssues: 0,
    members: [
      { id: '1', name: 'PM User', email: 'pm@epms.com', role: 'pm' },
      { id: '2', name: 'Dev User', email: 'dev@epms.com', role: 'developer' },
      { id: '3', name: 'QA User', email: 'qa@epms.com', role: 'qa' },
    ],
    createdAt: new Date().toISOString(),
    myRole: 'pm',
  };

  const closedProject: Project = {
    id: '101',
    name: 'Closed Project',
    key: 'CLO',
    description: 'Closed Project Desc',
    status: 'Closed',
    openIssues: 0,
    members: [
      { id: '1', name: 'PM User', email: 'pm@epms.com', role: 'pm' },
      { id: '2', name: 'Dev User', email: 'dev@epms.com', role: 'developer' },
    ],
    createdAt: new Date().toISOString(),
    myRole: 'pm',
  };

  describe('Trường hợp A: Dự án đã Đóng (CLOSED)', () => {
    it('PM truy cập dự án đã đóng -> bắt buộc khóa chế độ chỉ-xem (isReadOnly = true)', () => {
      const res = computeWorkflowPermissions(closedProject, pmUser, 'pm', 'pm');
      expect(res.isProjectClosed).toBe(true);
      expect(res.isReadOnly).toBe(true);
      expect(res.isPmOrAdmin).toBe(true);
    });

    it('Admin truy cập dự án đã đóng -> vẫn bị khóa chế độ chỉ-xem (isReadOnly = true)', () => {
      const res = computeWorkflowPermissions(closedProject, adminUser, 'admin', 'admin');
      expect(res.isProjectClosed).toBe(true);
      expect(res.isReadOnly).toBe(true);
      expect(res.isPmOrAdmin).toBe(true);
    });

    it('Xử lý đúng khi trạng thái dự án lưu dạng chữ in hoa "CLOSED"', () => {
      const closedUpperProject = { ...closedProject, status: 'CLOSED' as any };
      const res = computeWorkflowPermissions(closedUpperProject, pmUser, 'pm', 'pm');
      expect(res.isProjectClosed).toBe(true);
      expect(res.isReadOnly).toBe(true);
    });
  });

  describe('Trường hợp B: Thành viên thường (Developer / QA / Member) vào thẳng URL', () => {
    it('Developer mở link quy trình của dự án Active -> bị khóa chỉ-xem (isReadOnly = true, isPmOrAdmin = false)', () => {
      const projectForDev: Project = { ...activeProject, myRole: 'developer' as any };
      const res = computeWorkflowPermissions(projectForDev, devUser, 'member', 'developer');
      expect(res.isProjectClosed).toBe(false);
      expect(res.isPmOrAdmin).toBe(false);
      expect(res.isReadOnly).toBe(true);
      expect(res.effectiveRole).toBe('developer');
    });

    it('QA mở link quy trình của dự án Active -> bị khóa chỉ-xem (isReadOnly = true, isPmOrAdmin = false)', () => {
      const projectForQa: Project = { ...activeProject, myRole: 'qa' as any };
      const res = computeWorkflowPermissions(projectForQa, qaUser, 'member', 'qa');
      expect(res.isProjectClosed).toBe(false);
      expect(res.isPmOrAdmin).toBe(false);
      expect(res.isReadOnly).toBe(true);
      expect(res.effectiveRole).toBe('qa');
    });

    it('Member thông thường mở link -> bị khóa chỉ-xem', () => {
      const projectForMember: Project = { ...activeProject, myRole: 'member' as any };
      const res = computeWorkflowPermissions(projectForMember, devUser, 'member', 'member');
      expect(res.isProjectClosed).toBe(false);
      expect(res.isPmOrAdmin).toBe(false);
      expect(res.isReadOnly).toBe(true);
    });
  });

  describe('Trường hợp hợp lệ: PM / Admin truy cập dự án đang hoạt động (Active)', () => {
    it('PM của dự án Active -> toàn quyền cấu hình (isReadOnly = false, isPmOrAdmin = true)', () => {
      const res = computeWorkflowPermissions(activeProject, pmUser, 'pm', 'pm');
      expect(res.isProjectClosed).toBe(false);
      expect(res.isPmOrAdmin).toBe(true);
      expect(res.isReadOnly).toBe(false);
      expect(res.effectiveRole).toBe('pm');
    });

    it('System Admin trên dự án Active -> toàn quyền cấu hình (isReadOnly = false, isPmOrAdmin = true)', () => {
      const res = computeWorkflowPermissions(activeProject, adminUser, 'admin', 'admin');
      expect(res.isProjectClosed).toBe(false);
      expect(res.isPmOrAdmin).toBe(true);
      expect(res.isReadOnly).toBe(false);
    });
  });
});
