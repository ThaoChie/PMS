export interface ProgressPoint {
  date: string;
  idealRemaining: number;
  actualRemaining: number;
  completed: number;
}

export interface ProductivityPoint {
  member: string;
  completed: number;
  inProgress: number;
  velocity: number;
}

export interface BugReportItem {
  severity: string;
  count: number;
  resolved: number;
}
