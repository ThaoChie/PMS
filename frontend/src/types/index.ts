export * from './api';
export * from './auth';
export * from './project';
export * from './issue';
export * from './workflow';
export * from './notification';
export * from './report';

// App specific navigation types
export type Screen =
  | 'board'
  | 'issues'
  | 'saved-filters'
  | 'reports'
  | 'profile'
  | 'notifications'
  | 'projects'
  | 'project-settings'
  | 'members-roles'
  | 'workflow'
  | 'dashboard'
  | 'invitations';

export interface SavedFilter {
  id: string;
  name: string;
  owner: import('./auth').User;
  sharedWith: import('./auth').User[];
  emailSubscription: boolean;
  frequency?: 'daily' | 'weekly';
  filters: {
    type?: import('./issue').IssueType[];
    status?: import('./issue').IssueStatus[];
    priority?: import('./issue').Priority[];
    assignee?: string[];
  };
}
