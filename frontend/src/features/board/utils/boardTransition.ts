export interface TransitionOptionLike {
  id: string | number;
  name?: string;
  toStatusName?: string;
  to?: string;
}

/**
 * Matches an available workflow transition returned by the server against the target column status.
 * Strictly requires an explicit transition to the target status; never bypasses workflow rules by role.
 */
export function findTransitionForTargetStatus<T extends TransitionOptionLike>(
  availableTransitions: T[],
  targetStatusName: string,
): T | undefined {
  const targetLower = targetStatusName.trim().toLowerCase();
  if (!targetLower) return undefined;

  return availableTransitions.find((t) => {
    const dest = (t.toStatusName || t.to || '').trim().toLowerCase();
    if (dest) {
      return dest === targetLower;
    }
    return (t.name || '').trim().toLowerCase() === targetLower;
  });
}
