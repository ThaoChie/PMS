import React from 'react';
import { FolderOpen, Users } from 'lucide-react';
import type { Project } from '../../../types';
import UserAvatar from '../../../components/common/UserAvatar';
import ProjectBadge from './ProjectBadge';

interface ProjectCardProps {
  project: Project;
  onClick?: () => void;
}

export default function ProjectCard({ project, onClick }: ProjectCardProps) {
  const memberCount = project.memberCount ?? (project.members?.length || 1);

  return (
    <div
      className="bg-white border border-[#E5E5E7] rounded-xl p-5 hover:border-[#C5C5C8] hover:shadow-sm transition-all cursor-pointer group flex flex-col justify-between"
      onClick={onClick}
    >
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-2.5 min-w-0 flex-1">
            <ProjectBadge
              color={project.color}
              icon={project.icon}
              projectKey={project.key}
              size="md"
              className="mt-0.5"
            />
            <div className="min-w-0 flex-1">
              <h3
                className="text-sm font-semibold text-[#1A1A1A] line-clamp-2 group-hover:text-[#E53E3E] transition-colors leading-snug break-words"
                title={project.name}
              >
                {project.name}
              </h3>
              <p className="text-[10px] font-mono text-[#9B9B9F] mt-0.5">{project.key}</p>
            </div>
          </div>
          <span
            className={`shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full border mt-0.5 ${
              project.status === 'Active'
                ? 'bg-[#F7F7F8] text-[#1A1A1A] border-[#E5E5E7]'
                : 'bg-[#F7F7F8] text-[#9B9B9F] border-[#E5E5E7]'
            }`}
          >
            {project.status === 'Active' ? 'Đang hoạt động' : 'Đã đóng'}
          </span>
        </div>

        <p className="text-xs text-[#6B6B70] line-clamp-2 mb-4 min-h-[32px] break-words">
          {project.description || <span className="italic text-[#9B9B9F]">Không có mô tả dự án</span>}
        </p>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-[#F0F0F2] gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <FolderOpen className="w-3.5 h-3.5 text-[#9B9B9F] shrink-0" />
          <span className="text-xs text-[#6B6B70] truncate">
            {(project.openIssues || 0) > 0 ? `${project.openIssues} việc mở` : 'Không có việc mở'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {(project.members || []).length > 0 && (
            <div className="flex items-center -space-x-1.5 shrink-0 mr-0.5">
              {(project.members || []).slice(0, 3).map((m: any) => (
                <div key={m.id} className="ring-2 ring-white rounded-full">
                  <UserAvatar initials={m.initials} avatarUrl={m.avatarUrl} size="xs" />
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center gap-1 text-xs text-[#6B6B70]">
            <Users className="w-3.5 h-3.5 text-[#9B9B9F] shrink-0" />
            <span>{memberCount} thành viên</span>
          </div>
        </div>
      </div>
    </div>
  );
}
