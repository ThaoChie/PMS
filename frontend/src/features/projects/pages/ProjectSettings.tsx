import { useState } from 'react';
import { Sliders, ArrowRight } from 'lucide-react';
import type { Role, Screen } from '../../../types';
import EditProjectForm from '../components/EditProjectForm';
import CloseProjectPanel from '../components/CloseProjectPanel';
import ProjectBadge from '../components/ProjectBadge';
import { useProjectStore } from '../../../store/projectStore';
import { projectService } from '../../../services/projectService';

interface ProjectSettingsProps {
  role: Role;
  onNavigate?: (screen: Screen) => void;
}

export default function ProjectSettings({ role, onNavigate }: ProjectSettingsProps) {
  const { currentProject, updateProject } = useProjectStore();
  const [error, setError] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const canEdit = role === 'pm' || role === 'admin';

  if (!currentProject) {
    return (
      <div className="h-full flex items-center justify-center p-8 text-center text-sm text-[#6B6B70]">
        Chưa có dự án nào được chọn. Vui lòng chọn hoặc tạo dự án mới từ danh sách dự án.
      </div>
    );
  }

  async function handleSave(name: string, description: string, color?: string, icon?: string) {
    if (!currentProject) return;
    setError(null);
    setStatusMsg(null);
    try {
      await projectService.updateProject(currentProject.id, { name, description, color, icon });
      updateProject(currentProject.id, { name, description, color, icon });
      setStatusMsg('Đã cập nhật thông tin và nhận diện dự án thành công');
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Không thể cập nhật dự án');
    }
  }

  async function handleCloseProject() {
    if (!currentProject) return;
    setError(null);
    try {
      await projectService.closeProject(currentProject.id);
      updateProject(currentProject.id, { status: 'Closed' });
      setStatusMsg('Dự án đã được đóng thành công');
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Không thể đóng dự án');
    }
  }

  return (
    <div className="h-full overflow-y-auto bg-white">
      <div className="max-w-2xl mx-auto px-8 py-10">
        <div className="mb-8 flex items-center gap-3.5">
          <ProjectBadge
            color={currentProject.color}
            icon={currentProject.icon}
            projectKey={currentProject.key}
            size="lg"
          />
          <div>
            <h1 className="text-xl font-bold text-[#1A1A1A]">{currentProject.name}</h1>
            <p className="text-xs font-mono text-[#9B9B9F] mt-0.5">{currentProject.key}</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-medium">
            {error}
          </div>
        )}

        {statusMsg && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-medium">
            {statusMsg}
          </div>
        )}

        {/* Edit project general info & Branding */}
        <EditProjectForm project={currentProject} canEdit={canEdit} onSave={handleSave} />

        {/* Dedicated Custom Fields Screen Link (PM / Admin) */}
        {canEdit && (
          <div className="bg-white border border-[#E5E5E7] rounded-xl p-5 shadow-sm mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#FAF9F8] border border-[#E5E5E7] flex items-center justify-center text-[#1A1A1A] shrink-0">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#1A1A1A]">Quản lý trường tùy chỉnh</h3>
                <p className="text-xs text-[#6B6B70] mt-0.5">
                  Cấu hình các trường dữ liệu mở rộng cho công việc (Sprint, Module, Release,...)
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigate?.('custom-fields')}
              className="flex items-center justify-center gap-1.5 px-4 py-2 border border-[#E5E5E7] rounded-lg text-xs font-medium text-[#1A1A1A] hover:bg-[#F7F7F8] transition-colors shadow-xs whitespace-nowrap shrink-0 self-end sm:self-auto"
            >
              <span>Vào màn quản lý</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#6B6B70]" />
            </button>
          </div>
        )}

        {/* Danger zone */}
        {canEdit && currentProject.status !== 'Closed' && (
          <CloseProjectPanel project={currentProject} onCloseProject={handleCloseProject} />
        )}
      </div>
    </div>
  );
}
