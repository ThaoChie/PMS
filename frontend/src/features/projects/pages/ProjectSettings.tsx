import React, { useState } from 'react';
import type { Role } from '../../../types';
import EditProjectForm from '../components/EditProjectForm';
import CloseProjectPanel from '../components/CloseProjectPanel';
import { useProjectStore } from '../../../store/projectStore';
import { projectService } from '../../../services/projectService';

interface ProjectSettingsProps {
  role: Role;
}

export default function ProjectSettings({ role }: ProjectSettingsProps) {
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

  async function handleSave(name: string, description: string) {
    if (!currentProject) return;
    setError(null);
    setStatusMsg(null);
    try {
      await projectService.updateProject(currentProject.id, { name, description });
      updateProject(currentProject.id, { name, description });
      setStatusMsg('Đã cập nhật thông tin dự án thành công');
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
        <div className="mb-8">
          <h1 className="text-xl font-bold text-[#1A1A1A]">Cài đặt dự án</h1>
          <p className="text-xs font-mono text-[#9B9B9F] mt-0.5">{currentProject.key}</p>
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

        {/* Edit project general info */}
        <EditProjectForm project={currentProject} canEdit={canEdit} onSave={handleSave} />

        {/* Danger zone */}
        {canEdit && currentProject.status !== 'Closed' && (
          <CloseProjectPanel project={currentProject} onCloseProject={handleCloseProject} />
        )}
      </div>
    </div>
  );
}
