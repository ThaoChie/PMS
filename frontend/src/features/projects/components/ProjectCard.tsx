import React from 'react';
import { FolderOpen } from 'lucide-react';
import type { Project } from '../../../types';
import UserAvatar from '../../../components/common/UserAvatar';

interface ProjectCardProps {
  project: Project;
  onClick?: () => void;
}

export default function ProjectCard({ project, onClick }: ProjectCardProps) {
  return (
    <div
      className="bg-white border border-[#E5E5E7] rounded-xl p-5 hover:border-[#C5C5C8] hover:shadow-sm transition-all cursor-pointer group"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#1A1A1A] flex items-center justify-center text-white text-xs font-bold shrink-0">
            {(project.key || 'PR').slice(0, 2)}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-[#1A1A1A] truncate group-hover:text-[#E53E3E] transition-colors">
              {project.name}
            </h3>
            <p className="text-[10px] font-mono text-[#9B9B9F]">{project.key}</p>
          </div>
        </div>
        <span
          className={`shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full border ${
            project.status === 'Active'
              ? 'bg-[#F7F7F8] text-[#1A1A1A] border-[#E5E5E7]'
              : 'bg-[#F7F7F8] text-[#9B9B9F] border-[#E5E5E7]'
          }`}
        >
          {project.status === 'Active' ? 'Đang hoạt động' : 'Đã đóng'}
        </span>
      </div>

      <p className="text-xs text-[#6B6B70] line-clamp-2 mb-4 min-h-[32px]">
        {project.description}
      </p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <FolderOpen className="w-3.5 h-3.5 text-[#9B9B9F]" />
          <span className="text-xs text-[#6B6B70]">
            {(project.openIssues || 0) > 0 ? `${project.openIssues} việc mở` : 'Không có việc mở'}
          </span>
        </div>
        <div className="flex items-center -space-x-1.5">
          {(project.members || []).slice(0, 4).map((m) => (
            <div key={m.id} className="ring-2 ring-white rounded-full">
              <UserAvatar initials={m.initials} size="xs" />
            </div>
          ))}
          {(project.members || []).length > 4 && (
            <div className="ring-2 ring-white rounded-full w-5 h-5 bg-[#E5E5E7] flex items-center justify-center text-[9px] text-[#6B6B70] font-medium">
              +{(project.members || []).length - 4}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
