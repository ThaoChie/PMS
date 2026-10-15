import axiosClient from '../api/axiosClient';
import { downloadBlob } from '../utils/download';
import type { IssueSearchCriteria } from './searchService';

export const exportService = {
  async exportIssues(
    criteria: IssueSearchCriteria,
    format: 'xlsx' | 'csv' = 'xlsx',
  ): Promise<void> {
    const response = await axiosClient.post(`/issues/export`, criteria, {
      params: { format },
      responseType: 'blob',
    });

    const blob = new Blob([response as any], {
      type:
        format === 'xlsx'
          ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          : 'text/csv;charset=utf-8;',
    });

    const filename = `issues-export-${new Date().toISOString().slice(0, 10)}.${format}`;
    downloadBlob(blob, filename);
  },
};
