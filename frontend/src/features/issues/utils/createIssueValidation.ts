import type { CustomField } from '../../../types';

export interface CreateIssueFormFields {
  projectId: string | number;
  type: string;
  summary: string;
  assigneeId: string | number;
  dueDate: string;
}

function isCustomFieldValueFilled(cf: CustomField, rawValue?: string): boolean {
  if (cf.type === 'CHECKBOX') {
    return rawValue === 'true';
  }
  return Boolean(rawValue && rawValue.trim());
}

/**
 * Returns the Vietnamese validation message for the first missing required field,
 * or null if all required fields are filled.
 */
export function getMissingCreateIssueFieldError(
  form: CreateIssueFormFields,
  customFields: CustomField[],
  customFieldValues: Record<string, string>,
): string | null {
  if (!String(form.projectId ?? '').trim()) {
    return 'Vui lòng chọn dự án.';
  }
  if (!String(form.type ?? '').trim()) {
    return 'Vui lòng chọn loại công việc.';
  }
  if (!form.summary || !form.summary.trim()) {
    return 'Vui lòng nhập tóm tắt công việc.';
  }
  if (!String(form.assigneeId ?? '').trim()) {
    return 'Vui lòng chọn người thực hiện.';
  }
  if (!form.dueDate || !form.dueDate.trim()) {
    return 'Vui lòng chọn hạn chót.';
  }

  for (const cf of customFields) {
    if (cf.required && !isCustomFieldValueFilled(cf, customFieldValues[cf.fieldKey])) {
      return `Trường "${cf.name}" là bắt buộc.`;
    }
  }

  return null;
}

export function isCreateIssueFormValid(
  form: CreateIssueFormFields,
  customFields: CustomField[],
  customFieldValues: Record<string, string>,
): boolean {
  return getMissingCreateIssueFieldError(form, customFields, customFieldValues) === null;
}
