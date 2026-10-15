import React, { useState, useEffect } from 'react';
import { Plus, Search } from 'lucide-react';
import type { Role, Project } from '../../../types';
import ProjectCard from '../components/ProjectCard';
import { useProjectStore } from '../../../store/projectStore';

interface ProjectListProps {
  role: Role;
  onCreateProject: () => void;
  onSettings: () => void;
  onSelectProject?: (project: Project) => void;
}

export default function ProjectList({
  role,
  onCreateProject,
  onSettings,
  onSelectProject,
}: ProjectListProps) {
  const { projects, fetchProjects, setCurrentProject, isLoading } = useProjectStore();
  const [filter, setFilter] = useState<'all' | 'Active' | 'Closed'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'recent'>('recent');

  const canCreate = role === 'pm' || role === 'admin' || projects.length === 0;

  useEffect(() => {
    fetchProjects({ q: searchTerm, sort: sortBy });
  }, [searchTerm, sortBy]);

  const filtered = filter === 'all' ? projects : projects.filter((p) => p.status === filter);

  function handleCardClick(p: Project) {
    setCurrentProject(p);
    if (onSelectProject) {
      onSelectProject(p);
    }
    onSettings();
  }

  return (
    <div className="h-full overflow-y-auto bg-white">
      <div className="max-w-5xl mx-auto px-8 py-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-xl font-bold text-[#1A1A1A]">Projects</h1>
            <p className="text-sm text-[#6B6B70] mt-0.5">
              {projects.filter((p) => p.status === 'Active').length} active projects
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm kiếm dự án…"
                className="pl-8 pr-3 py-1.5 border border-[#E5E5E7] rounded-lg text-xs text-[#1A1A1A] placeholder:text-[#9B9B9F] focus:outline-none focus:border-[#1A1A1A] transition-colors"
              />
              <Search className="w-3.5 h-3.5 text-[#9B9B9F] absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>

            {/* Sort Select */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'recent')}
              className="px-2.5 py-1.5 border border-[#E5E5E7] rounded-lg text-xs text-[#1A1A1A] bg-white focus:outline-none focus:border-[#1A1A1A] transition-colors"
            >
              <option value="recent">Mới nhất</option>
              <option value="name">Tên (A-Z)</option>
            </select>

            {/* Status Filter */}
            <div className="flex border border-[#E5E5E7] rounded-lg p-0.5">
              {(['all', 'Active', 'Closed'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors capitalize ${
                    filter === f
                      ? 'bg-[#1A1A1A] text-white'
                      : 'text-[#6B6B70] hover:text-[#1A1A1A]'
                  }`}
                >
                  {f === 'all' ? 'All' : f}
                </button>
              ))}
            </div>

            {canCreate && (
              <button
                type="button"
                onClick={onCreateProject}
                className="flex items-center gap-1.5 px-3 py-2 bg-[#E53E3E] text-white text-xs font-medium rounded-lg hover:bg-[#C53030] transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> New Project
              </button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-xs text-[#6B6B70]">
            Đang tải danh sách dự án…
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-14 h-14 mb-4 text-[#E5E5E7]">
              <svg viewBox="0 0 56 56" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="8" y="16" width="40" height="32" rx="4" strokeLinecap="round" />
                <path d="M20 16v-4a4 4 0 018 0v4" strokeLinecap="round" />
                <path d="M20 32h16M20 38h8" strokeLinecap="round" />
              </svg>
            </div>
            <p className="text-sm font-medium text-[#1A1A1A] mb-1">No projects found</p>
            <p className="text-xs text-[#6B6B70] mb-4">Create your first project to get started</p>
            {canCreate && (
              <button
                type="button"
                onClick={onCreateProject}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#E53E3E] text-white text-xs font-medium rounded-lg hover:bg-[#C53030] transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> New Project
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onClick={() => handleCardClick(project)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
