import type { WorkflowStatus, WorkflowTransition } from '../../../types';

/**
 * Computes orphan (no incoming transition) and bottleneck (no outgoing transition)
 * warnings directly from the current statuses & transitions in the editor,
 * mirroring backend WorkflowServiceImpl.findOrphanStatusWarnings.
 */
export function computeWorkflowWarnings(
  statuses: WorkflowStatus[],
  transitions: WorkflowTransition[],
): string[] {
  if (!statuses || statuses.length === 0) return [];

  const validStatusNames = new Set(
    statuses.map((s) => (s.name || '').trim().toLowerCase()).filter(Boolean),
  );

  const hasIncoming = new Set<string>();
  const hasOutgoing = new Set<string>();

  for (const t of transitions || []) {
    if (!t?.from || !t?.to) continue;
    const fromKey = t.from.trim().toLowerCase();
    const toKey = t.to.trim().toLowerCase();
    if (!validStatusNames.has(fromKey) || !validStatusNames.has(toKey)) continue;
    hasOutgoing.add(fromKey);
    hasIncoming.add(toKey);
  }

  const warnings: string[] = [];
  for (const s of statuses) {
    const key = (s.name || '').trim().toLowerCase();
    if (!key) continue;
    const isInitial = Boolean(s.isInitial);
    const isDone = s.category === 'DONE';
    if (!isInitial && !hasIncoming.has(key)) {
      warnings.push(`Trạng thái '${s.name}' không có luồng chuyển vào (mồ côi)`);
    }
    if (!isDone && !hasOutgoing.has(key)) {
      warnings.push(`Trạng thái '${s.name}' không có luồng chuyển tiếp (điểm nghẽn)`);
    }
  }

  return warnings;
}
