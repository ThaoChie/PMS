import React, { useState } from 'react';
import { X } from 'lucide-react';
import { users, projects } from '../../../data/mockData';
import type { IssueType, Priority, IssueStatus } from '../../../types';

interface CreateIssueModalProps {
  onClose: () => void;
  onSubmitSuccess?: () => void;
}

export default function CreateIssueModal({ onClose, onSubmitSuccess }: CreateIssueModalProps) {
  const [form, setForm] = useState({
    summary: '',
    description: '',
    type: 'Task' as IssueType,
    status: 'To Do' as IssueStatus,
    priority: 'Medium' as Priority,
    assignee: '',
    labels: '',
    estimates: '',
    dueDate: '',
    environment: '',
    epicLink: '',
    project: 'p1',
  });
  const [saving, setSaving] = useState(false);

  function set<K extends keyof typeof form>(key: K, val: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.summary.trim()) return;
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      onSubmitSuccess?.();
      onClose();
    }, 500);
  }

  function Field({
    label,
    children,
    optional = false,
  }: {
    label: string;
    children: React.ReactNode;
    optional?: boolean;
  }) {
    return (
      <div>
        <label className="flex items-center gap-1.5 text-xs font-medium text-[#1A1A1A] mb-1.5">
          {label}
          {optional && <span className="text-[10px] text-[#9B9B9F] font-normal">optional</span>}
        </label>
        {children}
      </div>
    );
  }

  const inputCls =
    'w-full px-3 py-2.5 border border-[#E5E5E7] rounded-lg text-sm text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] transition-colors placeholder:text-[#9B9B9F]';
  const selectCls = `${inputCls} appearance-none bg-white`;

  return (
    <div
      className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 modal-backdrop px-4"
      onClick={onClose}
    >
      <div
        className="bg-white border border-[#E5E5E7] rounded-xl w-full max-w-2xl shadow-xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E5E7] shrink-0">
          <h2 className="text-sm font-semibold text-[#1A1A1A]">Create issue</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-[#9B9B9F] hover:text-[#1A1A1A] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="overflow-y-auto flex-1 px-6 py-5">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <Field label="Project">
                <select
                  value={form.project}
                  onChange={(e) => set('project', e.target.value)}
                  className={selectCls}
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Issue type">
                <select
                  value={form.type}
                  onChange={(e) => set('type', e.target.value as IssueType)}
                  className={selectCls}
                >
                  {(['Story', 'Bug', 'Task', 'Epic', 'Sub-task'] as IssueType[]).map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="mb-4">
              <Field label="Summary">
                <input
                  value={form.summary}
                  onChange={(e) => set('summary', e.target.value)}
                  placeholder="Short, clear description of the issue"
                  className={inputCls}
                  required
                />
              </Field>
            </div>

            <div className="mb-4">
              <Field label="Description" optional>
                <textarea
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                  placeholder="Describe the issue in detail, steps to reproduce, expected vs. actual behavior…"
                  rows={4}
                  className={`${inputCls} resize-none`}
                />
              </Field>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
              <Field label="Status">
                <select
                  value={form.status}
                  onChange={(e) => set('status', e.target.value as IssueStatus)}
                  className={selectCls}
                >
                  {['To Do', 'In Progress', 'Pending Approval', 'Done'].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Priority">
                <select
                  value={form.priority}
                  onChange={(e) => set('priority', e.target.value as Priority)}
                  className={selectCls}
                >
                  {(['Critical', 'High', 'Medium', 'Low'] as Priority[]).map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Assignee" optional>
                <select
                  value={form.assignee}
                  onChange={(e) => set('assignee', e.target.value)}
                  className={selectCls}
                >
                  <option value="">Unassigned</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <Field label="Labels" optional>
                <input
                  value={form.labels}
                  onChange={(e) => set('labels', e.target.value)}
                  placeholder="e.g. security, ux, api (comma-separated)"
                  className={inputCls}
                />
              </Field>
              <Field label="Estimate" optional>
                <input
                  value={form.estimates}
                  onChange={(e) => set('estimates', e.target.value)}
                  placeholder="e.g. 3 days, 2h30m"
                  className={inputCls}
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <Field label="Due date" optional>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => set('dueDate', e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="Environment" optional>
                <input
                  value={form.environment}
                  onChange={(e) => set('environment', e.target.value)}
                  placeholder="e.g. Production, Staging"
                  className={inputCls}
                />
              </Field>
            </div>

            <div className="mb-2">
              <Field label="Epic link" optional>
                <input
                  value={form.epicLink}
                  onChange={(e) => set('epicLink', e.target.value)}
                  placeholder="e.g. EPMS-50"
                  className={`${inputCls} font-mono text-[13px]`}
                />
              </Field>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#E5E5E7] shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-[#E5E5E7] text-xs text-[#6B6B70] rounded-lg hover:bg-[#F7F7F8] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !form.summary.trim()}
              className="px-4 py-2 bg-[#E53E3E] text-white text-xs font-medium rounded-lg hover:bg-[#C53030] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? 'Creating…' : 'Create issue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
