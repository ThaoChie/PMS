import React, { useState } from 'react';
import type { Issue } from '../../../types';
import UserAvatar from '../../../components/common/UserAvatar';
import PriorityTag from '../../../components/common/PriorityTag';
import { Paperclip, Pencil, UserMinus, Calendar, Clock, Monitor } from 'lucide-react';

interface AttributesPanelProps {
  issue: Issue;
  projectMembers?: Array<{ id: string; name: string }>;
  canEdit?: boolean;
  onUpdateField?: (field: string, value: any) => Promise<void>;
}

export default function AttributesPanel({
  issue,
  projectMembers = [],
  canEdit = true,
  onUpdateField,
}: AttributesPanelProps) {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editingCustomField, setEditingCustomField] = useState<string | null>(null);

  function AttrRow({ label, children }: { label: string; children: React.ReactNode }) {
    return (
      <div className="flex items-center gap-3 py-2 px-3 border-b border-[#F0F0F1] last:border-0 hover:bg-[#FAF9F8] transition-colors">
        <span className="text-xs text-[#9B9B9F] w-28 shrink-0">{label}</span>
        <div className="flex-1 text-xs text-[#1A1A1A] min-w-0">{children}</div>
      </div>
    );
  }

  return (
    <div className="border border-[#E5E5E7] rounded-lg overflow-hidden bg-white shadow-sm">
      {/* Assignee */}
      <AttrRow label="Người thực hiện">
        {editingField === 'assignee' && canEdit && onUpdateField ? (
          <select
            autoFocus
            defaultValue={issue.assignee?.id || ''}
            onChange={async (e) => {
              const val = e.target.value;
              setEditingField(null);
              await onUpdateField('assigneeId', val ? Number(val) : null);
            }}
            onBlur={() => setEditingField(null)}
            className="w-full text-xs text-[#1A1A1A] bg-white border border-[#1A1A1A] rounded px-2 py-1 focus:outline-none"
          >
            <option value="">-- Chưa phân công --</option>
            {projectMembers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        ) : (
          <button
            type="button"
            disabled={!canEdit}
            onClick={() => canEdit && onUpdateField && setEditingField('assignee')}
            className={`flex items-center justify-between w-full text-left py-1 px-1.5 -mx-1.5 rounded transition-colors group ${
              canEdit && onUpdateField ? 'hover:bg-[#F0F0F1] cursor-pointer' : 'cursor-default'
            }`}
            title={canEdit ? 'Nhấp để thay đổi người thực hiện' : undefined}
          >
            <div className="flex items-center gap-2 min-w-0">
              {issue.assignee ? (
                <>
                  <UserAvatar initials={issue.assignee.initials} size="xs" />
                  <span className="truncate">{issue.assignee.name}</span>
                </>
              ) : (
                <div className="flex items-center gap-1.5 text-[#9B9B9F]">
                  <UserMinus className="w-3.5 h-3.5" />
                  <span className="italic">Chưa phân công</span>
                </div>
              )}
            </div>
            {canEdit && onUpdateField && (
              <Pencil className="w-3 h-3 text-[#9B9B9F] opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1" />
            )}
          </button>
        )}
      </AttrRow>

      {/* Reporter (informational) */}
      <AttrRow label="Người báo cáo">
        <div className="flex items-center gap-2 py-1">
          <UserAvatar initials={issue.reporter.initials} size="xs" />
          <span className="truncate">{issue.reporter.name}</span>
        </div>
      </AttrRow>

      {/* Priority */}
      <AttrRow label="Độ ưu tiên">
        {editingField === 'priority' && canEdit && onUpdateField ? (
          <select
            autoFocus
            defaultValue={issue.priority}
            onChange={async (e) => {
              const val = e.target.value;
              setEditingField(null);
              await onUpdateField('priority', val);
            }}
            onBlur={() => setEditingField(null)}
            className="w-full text-xs text-[#1A1A1A] bg-white border border-[#1A1A1A] rounded px-2 py-1 focus:outline-none"
          >
            <option value="LOW">Thấp (Low)</option>
            <option value="MEDIUM">Trung bình (Medium)</option>
            <option value="HIGH">Cao (High)</option>
            <option value="CRITICAL">Khẩn cấp (Critical)</option>
          </select>
        ) : (
          <button
            type="button"
            disabled={!canEdit}
            onClick={() => canEdit && onUpdateField && setEditingField('priority')}
            className={`flex items-center justify-between w-full text-left py-1 px-1.5 -mx-1.5 rounded transition-colors group ${
              canEdit && onUpdateField ? 'hover:bg-[#F0F0F1] cursor-pointer' : 'cursor-default'
            }`}
            title={canEdit ? 'Nhấp để thay đổi mức ưu tiên' : undefined}
          >
            <PriorityTag priority={issue.priority} />
            {canEdit && onUpdateField && (
              <Pencil className="w-3 h-3 text-[#9B9B9F] opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1" />
            )}
          </button>
        )}
      </AttrRow>

      {/* Due Date */}
      <AttrRow label="Hạn chót">
        {editingField === 'dueDate' && canEdit && onUpdateField ? (
          <div className="flex items-center gap-1.5">
            <input
              type="date"
              autoFocus
              defaultValue={issue.dueDate || ''}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  (e.target as HTMLInputElement).blur();
                } else if (e.key === 'Escape') {
                  setEditingField(null);
                }
              }}
              onBlur={async (e) => {
                setEditingField(null);
                const val = e.target.value;
                if (val !== (issue.dueDate || '')) {
                  await onUpdateField('dueDate', val || null);
                }
              }}
              className="text-xs text-[#1A1A1A] bg-white border border-[#1A1A1A] rounded px-2 py-0.5 focus:outline-none"
            />
            {issue.dueDate && (
              <button
                type="button"
                onClick={async () => {
                  setEditingField(null);
                  await onUpdateField('dueDate', null);
                }}
                className="text-[11px] text-[#E53E3E] hover:underline px-1"
                title="Xóa hạn chót"
              >
                Xóa
              </button>
            )}
          </div>
        ) : (
          <button
            type="button"
            disabled={!canEdit}
            onClick={() => canEdit && onUpdateField && setEditingField('dueDate')}
            className={`flex items-center justify-between w-full text-left py-1 px-1.5 -mx-1.5 rounded transition-colors group ${
              canEdit && onUpdateField ? 'hover:bg-[#F0F0F1] cursor-pointer' : 'cursor-default'
            }`}
            title={canEdit ? 'Nhấp để đặt hạn chót' : undefined}
          >
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#9B9B9F]" />
              {issue.dueDate ? (
                <span
                  className={
                    new Date(issue.dueDate) < new Date() ? 'text-[#E53E3E] font-medium' : 'text-[#1A1A1A]'
                  }
                >
                  {issue.dueDate}
                </span>
              ) : (
                <span className="text-[#9B9B9F] italic">+ Thêm hạn chót</span>
              )}
            </div>
            {canEdit && onUpdateField && (
              <Pencil className="w-3 h-3 text-[#9B9B9F] opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1" />
            )}
          </button>
        )}
      </AttrRow>

      {/* Estimates */}
      <AttrRow label="Ước tính">
        {editingField === 'estimates' && canEdit && onUpdateField ? (
          <input
            type="text"
            autoFocus
            defaultValue={issue.estimates || ''}
            placeholder="Ví dụ: 2d 4h, 30m"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                (e.target as HTMLInputElement).blur();
              } else if (e.key === 'Escape') {
                setEditingField(null);
              }
            }}
            onBlur={async (e) => {
              setEditingField(null);
              const val = e.target.value.trim();
              if (val !== (issue.estimates || '')) {
                await onUpdateField('estimates', val || null);
              }
            }}
            className="w-full text-xs text-[#1A1A1A] bg-white border border-[#1A1A1A] rounded px-2 py-0.5 focus:outline-none"
          />
        ) : (
          <button
            type="button"
            disabled={!canEdit}
            onClick={() => canEdit && onUpdateField && setEditingField('estimates')}
            className={`flex items-center justify-between w-full text-left py-1 px-1.5 -mx-1.5 rounded transition-colors group ${
              canEdit && onUpdateField ? 'hover:bg-[#F0F0F1] cursor-pointer' : 'cursor-default'
            }`}
            title={canEdit ? 'Nhấp để cập nhật ước tính thời gian' : undefined}
          >
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#9B9B9F]" />
              {issue.estimates ? (
                <span>{issue.estimates}</span>
              ) : (
                <span className="text-[#9B9B9F] italic">+ Thêm ước tính</span>
              )}
            </div>
            {canEdit && onUpdateField && (
              <Pencil className="w-3 h-3 text-[#9B9B9F] opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1" />
            )}
          </button>
        )}
      </AttrRow>

      {/* Environment */}
      <AttrRow label="Môi trường">
        {editingField === 'environment' && canEdit && onUpdateField ? (
          <input
            type="text"
            autoFocus
            defaultValue={issue.environment || ''}
            placeholder="Ví dụ: Staging, Production"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                (e.target as HTMLInputElement).blur();
              } else if (e.key === 'Escape') {
                setEditingField(null);
              }
            }}
            onBlur={async (e) => {
              setEditingField(null);
              const val = e.target.value.trim();
              if (val !== (issue.environment || '')) {
                await onUpdateField('environment', val || null);
              }
            }}
            className="w-full text-xs text-[#1A1A1A] bg-white border border-[#1A1A1A] rounded px-2 py-0.5 focus:outline-none"
          />
        ) : (
          <button
            type="button"
            disabled={!canEdit}
            onClick={() => canEdit && onUpdateField && setEditingField('environment')}
            className={`flex items-center justify-between w-full text-left py-1 px-1.5 -mx-1.5 rounded transition-colors group ${
              canEdit && onUpdateField ? 'hover:bg-[#F0F0F1] cursor-pointer' : 'cursor-default'
            }`}
            title={canEdit ? 'Nhấp để cập nhật môi trường' : undefined}
          >
            <div className="flex items-center gap-1.5">
              <Monitor className="w-3.5 h-3.5 text-[#9B9B9F]" />
              {issue.environment ? (
                <span className="truncate">{issue.environment}</span>
              ) : (
                <span className="text-[#9B9B9F] italic">+ Thêm môi trường</span>
              )}
            </div>
            {canEdit && onUpdateField && (
              <Pencil className="w-3 h-3 text-[#9B9B9F] opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1" />
            )}
          </button>
        )}
      </AttrRow>

      {/* Custom Fields */}
      {issue.customFields && issue.customFields.map((cf) => {
        const isEditing = editingCustomField === cf.fieldKey;
        const optionsList = cf.options ? cf.options.split(',').map((s) => s.trim()).filter(Boolean) : [];

        return (
          <AttrRow key={cf.fieldKey} label={cf.name + (cf.required ? ' *' : '')}>
            {isEditing && canEdit && onUpdateField ? (
              cf.type === 'DROPDOWN' ? (
                <select
                  autoFocus
                  defaultValue={cf.value || ''}
                  onChange={async (e) => {
                    const val = e.target.value;
                    setEditingCustomField(null);
                    await onUpdateField('customFields', { [cf.fieldKey]: val });
                  }}
                  onBlur={() => setEditingCustomField(null)}
                  className="w-full text-xs text-[#1A1A1A] bg-white border border-[#1A1A1A] rounded px-2 py-1 focus:outline-none"
                >
                  <option value="">-- Chọn {cf.name} --</option>
                  {optionsList.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              ) : cf.type === 'CHECKBOX' ? (
                <div className="flex items-center gap-2 py-1">
                  <input
                    type="checkbox"
                    autoFocus
                    defaultChecked={cf.value === 'true'}
                    onChange={async (e) => {
                      const checked = e.target.checked;
                      setEditingCustomField(null);
                      await onUpdateField('customFields', { [cf.fieldKey]: String(checked) });
                    }}
                    onBlur={() => setEditingCustomField(null)}
                    className="rounded border-[#C5C5C8] text-[#1A1A1A] focus:ring-0"
                  />
                  <span className="text-xs text-[#6B6B70]">{cf.value === 'true' ? 'Đã bật' : 'Chưa bật'}</span>
                </div>
              ) : (
                <input
                  type={cf.type === 'NUMBER' ? 'number' : cf.type === 'DATE' ? 'date' : 'text'}
                  autoFocus
                  defaultValue={cf.value || ''}
                  onKeyDown={async (e) => {
                    if (e.key === 'Enter') {
                      const val = (e.target as HTMLInputElement).value;
                      setEditingCustomField(null);
                      await onUpdateField('customFields', { [cf.fieldKey]: val });
                    } else if (e.key === 'Escape') {
                      setEditingCustomField(null);
                    }
                  }}
                  onBlur={async (e) => {
                    const val = e.target.value;
                    setEditingCustomField(null);
                    if (val !== (cf.value || '')) {
                      await onUpdateField('customFields', { [cf.fieldKey]: val });
                    }
                  }}
                  placeholder={`Nhập ${cf.name}...`}
                  className="w-full text-xs text-[#1A1A1A] bg-white border border-[#1A1A1A] rounded px-2 py-1 focus:outline-none"
                />
              )
            ) : (
              <button
                type="button"
                disabled={!canEdit}
                onClick={() => {
                  if (canEdit && onUpdateField) {
                    setEditingCustomField(cf.fieldKey);
                  }
                }}
                className={`flex items-center justify-between w-full text-left py-1 px-1.5 -mx-1.5 rounded transition-colors group ${
                  canEdit && onUpdateField ? 'hover:bg-[#F0F0F1] cursor-pointer' : 'cursor-default'
                }`}
                title={canEdit ? `Nhấp để sửa ${cf.name}` : undefined}
              >
                <div className="flex items-center gap-1.5 truncate">
                  {cf.value ? (
                    cf.type === 'CHECKBOX' ? (
                      <span className={`text-xs font-medium ${cf.value === 'true' ? 'text-emerald-600' : 'text-[#9B9B9F]'}`}>
                        {cf.value === 'true' ? '✓ Có' : '✗ Không'}
                      </span>
                    ) : (
                      <span className="truncate">{cf.value}</span>
                    )
                  ) : (
                    <span className="text-[#9B9B9F] italic">+ Thêm {cf.name}</span>
                  )}
                </div>
                {canEdit && onUpdateField && (
                  <Pencil className="w-3 h-3 text-[#9B9B9F] opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1" />
                )}
              </button>
            )}
          </AttrRow>
        );
      })}

      {/* Labels */}
      {issue.labels && issue.labels.length > 0 && (
        <AttrRow label="Nhãn">
          <div className="flex flex-wrap gap-1 py-1">
            {issue.labels.map((l) => (
              <span
                key={l}
                className="text-[10px] px-1.5 py-0.5 rounded bg-[#F7F7F8] border border-[#E5E5E7] text-[#6B6B70]"
              >
                {l}
              </span>
            ))}
          </div>
        </AttrRow>
      )}

      {/* Epic Link */}
      {issue.epicLink && (
        <AttrRow label="Liên kết Epic">
          <span className="font-mono text-[11px] text-[#6B6B70]">{issue.epicLink}</span>
        </AttrRow>
      )}

      {/* Attachments */}
      {issue.attachments && issue.attachments.length > 0 && (
        <AttrRow label="Tệp đính kèm">
          <div className="space-y-1 py-1">
            {issue.attachments.map((a) => (
              <div
                key={a}
                className="flex items-center gap-1.5 text-[#6B6B70] hover:text-[#1A1A1A] cursor-pointer"
              >
                <Paperclip className="w-3 h-3" />
                <span className="text-[11px]">{a}</span>
              </div>
            ))}
          </div>
        </AttrRow>
      )}
    </div>
  );
}
