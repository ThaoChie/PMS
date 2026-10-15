import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import type { Project } from '../../../types';

interface CloseProjectPanelProps {
  project: Project;
  onCloseProject?: () => void;
}

export default function CloseProjectPanel({ project, onCloseProject }: CloseProjectPanelProps) {
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [closeConfirmText, setCloseConfirmText] = useState('');

  function handleConfirmClose() {
    onCloseProject?.();
    setShowCloseConfirm(false);
  }

  return (
    <>
      <div className="bg-white border border-[#E53E3E]/30 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-[#1A1A1A] mb-1">Vùng nguy hiểm</h2>
        <p className="text-xs text-[#6B6B70] mb-4">
          Đóng dự án là thao tác không thể hoàn tác. Dự án đã đóng sẽ không thể tạo công việc mới và toàn bộ
          phân công hiện tại sẽ bị đóng băng.
        </p>
        <div className="flex items-start gap-3 bg-[#FDECEC] border border-[#E53E3E]/20 rounded-lg p-3 mb-4">
          <AlertTriangle className="w-4 h-4 text-[#E53E3E] shrink-0 mt-0.5" />
          <p className="text-xs text-[#E53E3E]">
            Đóng dự án sẽ ngăn tất cả thành viên trong nhóm tạo mới hoặc chuyển trạng thái công việc.
            Hành động này không thể hoàn tác.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCloseConfirm(true)}
          className="px-4 py-2 border border-[#E53E3E] text-[#E53E3E] text-xs font-medium rounded-lg hover:bg-[#E53E3E] hover:text-white transition-colors"
        >
          Đóng dự án…
        </button>
      </div>

      {showCloseConfirm && (
        <div
          className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 modal-backdrop"
          onClick={() => setShowCloseConfirm(false)}
        >
          <div
            className="bg-white border border-[#E5E5E7] rounded-xl p-6 w-full max-w-md shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#FDECEC] flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-[#E53E3E]" />
                </div>
                <h3 className="text-sm font-semibold text-[#1A1A1A]">Đóng dự án</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCloseConfirm(false)}
                className="text-[#6B6B70] hover:text-[#1A1A1A]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-[#6B6B70] mb-4">
              Thao tác này sẽ đóng vĩnh viễn dự án{' '}
              <strong className="text-[#1A1A1A]">{project.name}</strong>. Để xác nhận, vui lòng nhập lại chính xác tên
              dự án vào ô bên dưới.
            </p>
            <input
              value={closeConfirmText}
              onChange={(e) => setCloseConfirmText(e.target.value)}
              placeholder={project.name}
              className="w-full px-3 py-2.5 border border-[#E5E5E7] rounded-lg text-sm text-[#1A1A1A] focus:outline-none focus:border-[#E53E3E] transition-colors mb-4"
            />
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowCloseConfirm(false)}
                className="px-4 py-2 border border-[#E5E5E7] text-xs text-[#6B6B70] rounded-lg hover:bg-[#F7F7F8] transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={closeConfirmText !== project.name}
                className="px-4 py-2 bg-[#E53E3E] text-white text-xs font-medium rounded-lg hover:bg-[#C53030] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                onClick={handleConfirmClose}
              >
                Xác nhận đóng dự án
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
