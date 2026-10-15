import { create } from 'zustand';
import type { Project, Role } from '../types';
import { projectService } from '../services/projectService';

export function mapProjectResponseToProject(raw: any): Project {
  if (!raw) return raw;
  return {
    id: String(raw.id),
    name: raw.name || '',
    key: raw.projectKey || raw.key || '',
    description: raw.description || '',
    status: raw.status === 'CLOSED' || raw.status === 'Closed' ? 'Closed' : 'Active',
    openIssues: raw.openIssuesCount ?? raw.openIssues ?? 0,
    members: raw.members || [],
    createdAt: raw.createdAt || new Date().toISOString(),
  };
}

interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  myProjectRole: Role;
  isLoading: boolean;

  setCurrentProject: (project: Project | null) => void;
  setProjects: (projects: Project[]) => void;
  setMyProjectRole: (role: Role) => void;
  addProject: (project: Project) => void;
  updateProject: (id: string, data: Partial<Project>) => void;
  fetchProjects: (params?: { q?: string; sort?: string }) => Promise<Project[]>;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  currentProject: null,
  myProjectRole: 'member',
  isLoading: false,

  setCurrentProject: (currentProject) => set({ currentProject }),
  setProjects: (projects) => {
    const cur = get().currentProject;
    set({
      projects,
      currentProject: cur && projects.some((p) => p.id === cur.id) ? cur : projects[0] || null,
    });
  },
  setMyProjectRole: (myProjectRole) => set({ myProjectRole }),

  addProject: (project) =>
    set((state) => ({
      projects: [project, ...state.projects],
      currentProject: project,
    })),

  updateProject: (id, data) =>
    set((state) => ({
      projects: state.projects.map((p) => (p.id === id ? { ...p, ...data } : p)),
      currentProject:
        state.currentProject?.id === id
          ? { ...state.currentProject, ...data }
          : state.currentProject,
    })),

  fetchProjects: async (params) => {
    set({ isLoading: true });
    try {
      const res = await projectService.getProjects(params);
      const rawList = res?.data?.content || res?.data?.items || (Array.isArray(res?.data) ? res.data : []);
      const list = rawList.map(mapProjectResponseToProject);
      const cur = get().currentProject;
      set({
        projects: list,
        currentProject: cur && list.some((p) => p.id === cur.id) ? cur : list[0] || null,
        isLoading: false,
      });
      return list;
    } catch {
      set({ isLoading: false });
      return [];
    }
  },
}));
