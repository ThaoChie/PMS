import React, { useState } from 'react';
import type { Project } from '../../../types';

interface EditProjectFormProps {
  project: Project;
  canEdit: boolean;
  onSave?: (name: string, description: string) => void;
}

export default function EditProjectForm({ project, canEdit, onSave }: EditProjectFormProps) {
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description);
  const [saved, setSaved] = useState(false);

  React.useEffect(() => {
    setName(project.name);
    setDescription(project.description);
  }, [project]);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaved(true);
    onSave?.(name, description);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="bg-white border border-[#E5E5E7] rounded-xl p-6 mb-5">
      <h2 className="text-sm font-semibold text-[#1A1A1A] mb-5">General</h2>
      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-[#1A1A1A] mb-1.5">Project name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={!canEdit}
            className="w-full px-3 py-2.5 border border-[#E5E5E7] rounded-lg text-sm text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] disabled:bg-[#F7F7F8] disabled:text-[#9B9B9F] disabled:cursor-not-allowed transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#1A1A1A] mb-1.5">Project key</label>
          <input
            value={project.key}
            disabled
            className="w-full px-3 py-2.5 border border-[#E5E5E7] rounded-lg text-sm text-[#9B9B9F] bg-[#F7F7F8] cursor-not-allowed font-mono"
          />
          <p className="text-[10px] text-[#9B9B9F] mt-1">
            Project key cannot be changed after creation.
          </p>
        </div>
        <div>
          <label className="block text-xs font-medium text-[#1A1A1A] mb-1.5">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={!canEdit}
            rows={3}
            className="w-full px-3 py-2.5 border border-[#E5E5E7] rounded-lg text-sm text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] resize-none disabled:bg-[#F7F7F8] disabled:text-[#9B9B9F] disabled:cursor-not-allowed transition-colors"
          />
        </div>
        {canEdit && (
          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="px-4 py-2 bg-[#E53E3E] text-white text-xs font-medium rounded-lg hover:bg-[#C53030] transition-colors"
            >
              Save changes
            </button>
            {saved && <span className="text-xs text-[#1A1A1A]">Saved ✓</span>}
          </div>
        )}
      </form>
    </div>
  );
}
