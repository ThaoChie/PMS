import { describe, it, expect, beforeEach } from 'vitest';
import { useProjectStore } from '../store/projectStore';
import type { Project } from '../types';

const mockProject1: Project = {
  id: '1',
  name: 'thiết kế hệ thống',
  key: 'TKHT',
  description: '',
  status: 'Active',
  color: '#3B82F6',
  icon: 'folder',
  openIssues: 5,
  memberCount: 2,
  createdAt: '2026-01-01',
  myRole: 'pm',
};

const mockProject2: Project = {
  id: '2',
  name: 'test',
  key: 'TEST',
  description: '',
  status: 'Active',
  color: '#EF4444',
  icon: 'folder',
  openIssues: 2,
  memberCount: 1,
  createdAt: '2026-01-02',
  myRole: 'developer',
};

describe('projectStore', () => {
  beforeEach(() => {
    useProjectStore.setState({
      projects: [mockProject1, mockProject2],
      currentProject: mockProject2,
      myProjectRole: 'developer',
    });
  });

  it('switches currentProject properly', () => {
    useProjectStore.getState().setCurrentProject(mockProject1);
    const state = useProjectStore.getState();
    expect(state.currentProject?.id).toBe('1');
    expect(state.currentProject?.name).toBe('thiết kế hệ thống');
    expect(state.myProjectRole).toBe('pm');
  });

  it('keeps currentProject selection when setProjects is called with matching ID (string or number)', () => {
    useProjectStore.getState().setCurrentProject(mockProject1);
    
    // Server returns list with number ID or fresh data
    const updatedList: Project[] = [
      { ...mockProject2, name: 'test updated' },
      { ...mockProject1, name: 'thiết kế hệ thống updated' },
    ];
    useProjectStore.getState().setProjects(updatedList);

    const state = useProjectStore.getState();
    expect(state.currentProject?.id).toBe('1');
    expect(state.currentProject?.name).toBe('thiết kế hệ thống updated');
  });

  it('adds new project and sets it as current project without resetting', () => {
    const newProj: Project = {
      id: '3',
      name: 'dự án mới tạo',
      key: 'DAMT',
      description: '',
      status: 'Active',
      color: '#10B981',
      icon: 'sparkles',
      openIssues: 0,
      memberCount: 1,
      createdAt: '2026-01-03',
      myRole: 'pm',
    };

    useProjectStore.getState().addProject(newProj);
    const state = useProjectStore.getState();
    expect(state.currentProject?.id).toBe('3');
    expect(state.currentProject?.name).toBe('dự án mới tạo');
    expect(state.projects[0].id).toBe('3');
  });
});
