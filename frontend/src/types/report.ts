export interface ProgressPoint {
  day?: string;
  date?: string;
  ideal?: number;
  idealRemaining?: number;
  actualRemaining?: number;
  remaining?: number;
  completed?: number;
  totalScope?: number;
}

export interface ProgressReportResponse {
  projectId: number;
  from: string;
  to: string;
  metric: string;
  hasEnoughData: boolean;
  totalScope: number;
  currentRemaining: number;
  currentCompleted: number;
  isAtRisk: boolean;
  series: ProgressPoint[];
}

export interface ProductivityPoint {
  member: string;
  completed: number;
  inProgress: number;
  velocity: number;
}

export interface MemberProductivity {
  userId: number;
  fullName: string;
  email: string;
  avatarUrl?: string;
  completedIssues: number;
  inProgressIssues: number;
  avgResolutionTimeHours?: number;
  totalLoggedHours?: number;
  velocity: number;
}

export interface ProductivityReportResponse {
  projectId: number;
  from: string;
  to: string;
  scope: 'MEMBER_DETAIL' | 'PROJECT_SUMMARY';
  totalCompleted: number;
  totalInProgress: number;
  avgResolutionTimeHours?: number;
  totalLoggedHours?: number;
  members: MemberProductivity[];
  points: ProductivityPoint[];
}

export interface BugReportItem {
  priority: string;
  severity?: string;
  resolved: number;
  unresolved: number;
  count: number;
}

export interface BugReportResponse {
  projectId: number;
  from: string;
  to: string;
  totalBugs: number;
  resolvedBugs: number;
  unresolvedBugs: number;
  resolutionRate: number;
  avgClosingTimeHours?: number;
  byPriority: BugReportItem[];
  openBugsByPriority: Record<string, number>;
}
