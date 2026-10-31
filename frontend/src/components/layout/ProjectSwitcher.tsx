import React, { useState } from 'react';
import { ChevronDown, Plus } from 'lucide-react';
import type { Project } from '../../types';
import ProjectBadge from '../../features/projects/components/ProjectBadge';

interface ProjectSwitcherProps {
  projects: Project[];
  selectedProject: Project | null;
  onSelectProject: (project: Project) => void;
  onCreateProject?: () => void;
}

export default function ProjectSwitcher({
  projects,
  selectedProject,
  onSelectProject,
  onCreateProject,
}: ProjectSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-[#E5E5E7] text-sm hover:bg-white/80 transition-colors"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((o) => !o);
        }}
      >
        <ProjectBadge
          color={selectedProject?.color}
          icon={selectedProject?.icon}
          projectKey={selectedProject?.key}
          size="xs"
        />
        <span className="flex-1 text-left font-medium text-[#1A1A1A] truncate text-xs min-w-0">
          {selectedProject?.name || 'Chọn dự án'}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-[#6B6B70] shrink-0" />
      </button>

      {isOpen && (
        <div
          className="absolute left-0 mt-1 w-56 bg-white border border-[#E5E5E7] rounded-lg shadow-sm z-50 overflow-hidden fade-in"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="py-1">
            {projects.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left hover:bg-[#F7F7F8] transition-colors ${
                  p.id === selectedProject?.id ? 'bg-[#F7F7F8]' : ''
                }`}
                onClick={() => {
                  onSelectProject(p);
                  setIsOpen(false);
                }}
              >
                <ProjectBadge
                  color={p.color}
                  icon={p.icon}
                  projectKey={p.key}
                  size="xs"
                />
                <span className="truncate text-[#1A1A1A] flex-1 min-w-0" title={p.name}>
                  {p.name}
                </span>
                {p.status === 'Closed' && (
                  <span className="ml-2 text-[10px] text-[#6B6B70] shrink-0">Đã đóng</span>
                )}
              </button>
            ))}

            {onCreateProject && (
              <div className="border-t border-[#E5E5E7] mt-1 pt-1">
                <button
                  type="button"
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#E53E3E] hover:bg-[#F7F7F8] transition-colors"
                  onClick={() => {
                    onCreateProject();
                    setIsOpen(false);
                  }}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Tạo dự án mới
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
