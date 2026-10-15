import type { User, Project, Issue, Notification, SavedFilter, WorkflowTransition } from '../types';

export const users: User[] = [];
export const currentUser: User | undefined = undefined;
export const projects: Project[] = [];
export const issues: Issue[] = [];
export const notifications: Notification[] = [];
export const savedFilters: SavedFilter[] = [];
export const workflowTransitions: WorkflowTransition[] = [];
