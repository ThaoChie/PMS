export interface InlineIssueUpdates {
  summary?: string;
  description?: string;
  type?: any;
  priority?: any;
  assigneeId?: number | null;
  dueDate?: string | null;
  estimates?: string | null;
  environment?: string | null;
  customFields?: Record<string, string>;
}

/**
 * Returns true only for optimistic-locking version conflicts (`CONCURRENT_MODIFICATION`),
 * avoiding false positives on other HTTP 409 responses such as `PROJECT_CLOSED` or
 * database constraint errors.
 */
export function isConcurrentModificationError(err: any): boolean {
  if (!err) return false;
  const errorCode = err?.errorCode || err?.response?.data?.errorCode;
  if (errorCode) {
    return errorCode === 'CONCURRENT_MODIFICATION';
  }
  const status = err?.status || err?.response?.status;
  if (status !== 409) return false;
  const msg = String(err?.message || err?.response?.data?.message || '').toLowerCase();
  return msg.includes('modified by another user') || msg.includes('expected version');
}

/**
 * Builds a minimal partial-update payload containing only the field(s) changed inline
 * plus the optimistic-locking `version`.
 */
export function buildInlineUpdatePayload(
  updates: InlineIssueUpdates,
  version?: number,
): Record<string, any> {
  const payload: Record<string, any> = {};

  if (updates.summary !== undefined) payload.summary = updates.summary;
  if (updates.description !== undefined) payload.description = updates.description;
  if (updates.type !== undefined) payload.type = updates.type;
  if (updates.priority !== undefined) payload.priority = updates.priority;
  if (updates.estimates !== undefined) payload.estimates = updates.estimates;
  if (updates.environment !== undefined) payload.environment = updates.environment;
  if (updates.customFields !== undefined) payload.customFields = updates.customFields;

  if (updates.assigneeId !== undefined) {
    payload.assigneeId = updates.assigneeId;
    if (updates.assigneeId === null) {
      payload.clearAssignee = true;
    }
  }
  if (updates.dueDate !== undefined) {
    payload.dueDate = updates.dueDate;
    if (updates.dueDate === null) {
      payload.clearDueDate = true;
    }
  }
  if (version !== undefined) {
    payload.version = version;
  }

  return payload;
}

export async function executeInlineIssueUpdate<T extends { version?: number }>(params: {
  issueKey: string;
  currentVersion?: number;
  updates: InlineIssueUpdates;
  updateFn: (issueKey: string, payload: Record<string, any>, version?: number) => Promise<any>;
  fetchLatestFn: (issueKey: string) => Promise<T | null | undefined>;
}): Promise<any> {
  const { issueKey, currentVersion, updates, updateFn, fetchLatestFn } = params;
  const initialPayload = buildInlineUpdatePayload(updates, currentVersion);

  try {
    return await updateFn(issueKey, initialPayload, currentVersion);
  } catch (err: any) {
    if (!isConcurrentModificationError(err)) {
      throw err;
    }

    const latest = await fetchLatestFn(issueKey);
    if (!latest || latest.version === undefined || latest.version === null) {
      throw err;
    }

    const retryPayload = buildInlineUpdatePayload(updates, latest.version);
    return await updateFn(issueKey, retryPayload, latest.version);
  }
}
