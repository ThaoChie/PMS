import React from 'react';
import { KanbanSquare, ListTodo, Bug, Clock } from 'lucide-react';
import { issues, notifications } from '../../data/mockData';
import type { Role } from '../../types';
import { AssignedIssuesWidget } from './AssignedIssuesWidget';
import { RecentActivityWidget } from './RecentActivityWidget';
import { WatchingWidget } from './WatchingWidget';
import { SavedFiltersWidget } from './SavedFiltersWidget';

interface DashboardProps {
  role: Role;
  onSelectIssue: (id: string) => void;
  onNavigate: (screen: any) => void;
}

export default function Dashboard({ role, onSelectIssue, onNavigate }: DashboardProps) {
  const p1Issues = issues.filter(i => i.projectId === 'p1');
  const openIssues = p1Issues.filter(i => i.status !== 'Done');
  const bugCount = p1Issues.filter(i => i.type === 'Bug').length;
  const pendingApproval = p1Issues.filter(i => i.status === 'Pending Approval').length;
  const overdueIssues = p1Issues.filter(
    i => i.dueDate && new Date(i.dueDate) < new Date() && i.status !== 'Done'
  );

  const myIssues = p1Issues.filter(i => i.assignee?.id === 'u1' && i.status !== 'Done').slice(0, 5);
  const watchingIssues = p1Issues.filter(i => i.status !== 'Done').slice(2, 5);
  const recentActivity = notifications.slice(0, 4);

  const stats = [
    { label: 'Open issues', value: openIssues.length, icon: ListTodo, sub: 'EPMS Platform' },
    { label: 'Bugs open', value: bugCount, icon: Bug, sub: 'across all types', atRisk: bugCount > 2 },
    { label: 'Pending approval', value: pendingApproval, icon: KanbanSquare, sub: 'awaiting review' },
    {
      label: 'Overdue',
      value: overdueIssues.length,
      icon: Clock,
      sub: 'past due date',
      atRisk: overdueIssues.length > 0,
    },
  ];

  return (
    <div className="h-full overflow-y-auto bg-white">
      <div className="max-w-5xl mx-auto px-8 py-10">
        <div className="mb-8">
          <h1 className="text-xl font-bold text-[#1A1A1A]">Dashboard</h1>
          <p className="text-sm text-[#6B6B70] mt-0.5">
            Welcome back, Alex — here's what needs your attention
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {stats.map(s => (
            <div
              key={s.label}
              className={`border rounded-xl p-5 ${
                s.atRisk ? 'border-[#E53E3E]/30 bg-[#FDECEC]' : 'border-[#E5E5E7] bg-white'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <p className="text-[10px] font-medium text-[#9B9B9F] uppercase tracking-wider">
                  {s.label}
                </p>
                <s.icon className={`w-4 h-4 ${s.atRisk ? 'text-[#E53E3E]' : 'text-[#C5C5C8]'}`} />
              </div>
              <p className={`text-3xl font-bold ${s.atRisk ? 'text-[#E53E3E]' : 'text-[#1A1A1A]'}`}>
                {s.value}
              </p>
              <p className={`text-xs mt-0.5 ${s.atRisk ? 'text-[#E53E3E]' : 'text-[#6B6B70]'}`}>
                {s.sub}
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* My issues */}
          <AssignedIssuesWidget
            issues={myIssues}
            onSelectIssue={onSelectIssue}
            onNavigate={onNavigate}
          />

          {/* Recent activity */}
          <RecentActivityWidget
            notifications={recentActivity}
            onNavigate={onNavigate}
          />
        </div>
      </div>
    </div>
  );
}
