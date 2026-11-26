import { describe, it, expect } from 'vitest';
import type { CustomField } from '../types';
import {
  getMissingCreateIssueFieldError,
  isCreateIssueFormValid,
  type CreateIssueFormFields,
} from '../features/issues/utils/createIssueValidation';

const validBaseForm: CreateIssueFormFields = {
  projectId: '7',
  type: 'BUG',
  summary: 'Sửa lỗi đăng nhập',
  assigneeId: '12',
  dueDate: '2026-12-01',
};

describe('createIssueValidation', () => {
  it('disables submit when only summary is entered (missing assigneeId and dueDate)', () => {
    const form: CreateIssueFormFields = {
      projectId: '7',
      type: 'TASK',
      summary: 'Chỉ mới nhập tiêu đề',
      assigneeId: '',
      dueDate: '',
    };

    expect(isCreateIssueFormValid(form, [], {})).toBe(false);
    expect(getMissingCreateIssueFieldError(form, [], {})).toBe('Vui lòng chọn người thực hiện.');
  });

  it('requires dueDate even when summary and assigneeId are filled', () => {
    const form: CreateIssueFormFields = {
      ...validBaseForm,
      dueDate: '',
    };

    expect(isCreateIssueFormValid(form, [], {})).toBe(false);
    expect(getMissingCreateIssueFieldError(form, [], {})).toBe('Vui lòng chọn hạn chót.');
  });

  it('requires projectId, type, and non-blank summary', () => {
    expect(isCreateIssueFormValid({ ...validBaseForm, projectId: '' }, [], {})).toBe(false);
    expect(isCreateIssueFormValid({ ...validBaseForm, type: '' }, [], {})).toBe(false);
    expect(isCreateIssueFormValid({ ...validBaseForm, summary: '   ' }, [], {})).toBe(false);
  });

  it('enables submit when all required base fields are filled and custom fields are optional', () => {
    const optionalField: CustomField = {
      id: 1,
      name: 'Ghi chú',
      fieldKey: 'ghi_chu',
      type: 'TEXT',
      required: false,
      position: 0,
    };

    expect(isCreateIssueFormValid(validBaseForm, [optionalField], {})).toBe(true);
    expect(getMissingCreateIssueFieldError(validBaseForm, [optionalField], {})).toBeNull();
  });

  it('disables submit until all required custom fields (including CHECKBOX) are filled', () => {
    const requiredText: CustomField = {
      id: 1,
      name: 'Module',
      fieldKey: 'module',
      type: 'DROPDOWN',
      options: 'Auth, Order',
      required: true,
      position: 0,
    };
    const requiredCheckbox: CustomField = {
      id: 2,
      name: 'Xác nhận QA',
      fieldKey: 'qa_confirm',
      type: 'CHECKBOX',
      required: true,
      position: 1,
    };

    const fields = [requiredText, requiredCheckbox];

    expect(isCreateIssueFormValid(validBaseForm, fields, {})).toBe(false);
    expect(isCreateIssueFormValid(validBaseForm, fields, { module: 'Auth', qa_confirm: 'false' })).toBe(false);
    expect(isCreateIssueFormValid(validBaseForm, fields, { module: '   ', qa_confirm: 'true' })).toBe(false);
    expect(isCreateIssueFormValid(validBaseForm, fields, { module: 'Auth', qa_confirm: 'true' })).toBe(true);
  });
});
