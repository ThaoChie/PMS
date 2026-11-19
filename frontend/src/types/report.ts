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

export type WorkloadLevel = 'UNDERLOAD' | 'BALANCED' | 'OVERLOAD';

export interface MemberProductivity {
  userId: number;
  fullName: string;
  email: string;
  avatarUrl?: string;
  projectRole?: string;
  assignedIssues?: number;
  completedIssues: number;
  inProgressIssues: number;
  todoIssues?: number;
  onTimeCompletedCount?: number;
  onTimeRate?: number;
  overdueIssues?: number;
  estimatedHours?: number;
  totalLoggedHours?: number;
  variancePercentage?: number;
  avgResolutionTimeHours?: number;
  bugsAssigned?: number;
  bugsResolved?: number;
  bugsReopened?: number;
  workloadLevel?: WorkloadLevel;
  workloadRatio?: number;
  velocity: number;
}

export interface ProductivityReportResponse {
  projectId: number;
  from: string;
  to: string;
  scope: 'MEMBER_DETAIL' | 'PROJECT_SUMMARY';
  totalAssigned?: number;
  totalCompleted: number;
  totalInProgress: number;
  totalTodo?: number;
  totalOverdue?: number;
  overallOnTimeRate?: number;
  totalEstimatedHours?: number;
  avgResolutionTimeHours?: number;
  totalLoggedHours?: number;
  totalBugsAssigned?: number;
  totalBugsResolved?: number;
  totalBugsReopened?: number;
  page?: number;
  size?: number;
  totalMembers?: number;
  totalPages?: number;
  members: MemberProductivity[];
  points: ProductivityPoint[];
}

export interface ProductivityFilter {
  from?: string;
  to?: string;
  memberIds?: number[];
  roles?: string[];
  issueTypes?: string[];
  priorities?: string[];
  statuses?: string[];
  sprintId?: number;
  overdueOnly?: boolean;
  sort?: string;
  page?: number;
  size?: number;
}

export interface MemberProductivityIssue {
  id: number;
  key: string;
  summary: string;
  type: string;
  priority: string;
  status: string;
  statusCategory?: string;
  dueDate?: string;
  overdue: boolean;
  originalEstimateMin?: number;
  estimatedHours?: number;
  timeSpentMin?: number;
  loggedHours?: number;
  variancePercentage?: number;
  createdAt?: string;
  completedAt?: string;
  onTime?: boolean;
}

export interface MemberProductivityWorklog {
  id: number;
  issueId?: number;
  issueKey?: string;
  issueSummary?: string;
  workDate: string;
  timeSpentMin: number;
  timeSpentHours?: number;
  comment?: string;
  createdAt?: string;
}

export interface MemberDetailProductivityResponse {
  projectId: number;
  userId: number;
  from: string;
  to: string;
  member: MemberProductivity;
  issues: MemberProductivityIssue[];
  worklogs: MemberProductivityWorklog[];
  totalIssues: number;
  totalWorklogs: number;
  totalLoggedHours: number;
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
