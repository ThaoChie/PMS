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
        <h2 className="text-sm font-semibold text-[#1A1A1A] mb-1">Danger zone</h2>
        <p className="text-xs text-[#6B6B70] mb-4">
          Closing this project is irreversible. Closed projects cannot receive new issues, and all
          active assignments will be frozen.
        </p>
        <div className="flex items-start gap-3 bg-[#FDECEC] border border-[#E53E3E]/20 rounded-lg p-3 mb-4">
          <AlertTriangle className="w-4 h-4 text-[#E53E3E] shrink-0 mt-0.5" />
          <p className="text-xs text-[#E53E3E]">
            Closing a project will prevent all team members from creating or moving issues. This
            action cannot be undone.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCloseConfirm(true)}
          className="px-4 py-2 border border-[#E53E3E] text-[#E53E3E] text-xs font-medium rounded-lg hover:bg-[#E53E3E] hover:text-white transition-colors"
        >
          Close project…
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
                <h3 className="text-sm font-semibold text-[#1A1A1A]">Close project</h3>
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
              This will permanently close{' '}
              <strong className="text-[#1A1A1A]">{project.name}</strong>. To confirm, type the
              project name below.
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
                Cancel
              </button>
              <button
                type="button"
                disabled={closeConfirmText !== project.name}
                className="px-4 py-2 bg-[#E53E3E] text-white text-xs font-medium rounded-lg hover:bg-[#C53030] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                onClick={handleConfirmClose}
              >
                Close project
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
