import type { Notification, Screen } from '../types';
import { useProjectStore } from '../store/projectStore';
import { isInviteeNotification } from './invitationStatus';

export type NotificationNavigationTarget =
  | { kind: 'screen'; screen: Screen; projectIdOrKey?: string }
  | { kind: 'issue'; issueKey: string; projectIdOrKey?: string }
  | { kind: 'none' };

function extractProjectFromPath(link?: string, segment?: string): string | undefined {
  if (!link || !segment) return undefined;
  const regex = new RegExp(`\\/projects\\/([^/?#]+)\\/${segment}(?:\\/|$|\\?|#)`, 'i');
  const match = link.match(regex);
  return match ? decodeURIComponent(match[1]) : undefined;
}

function extractProjectFromMembersLink(link?: string): string | undefined {
  return (
    extractProjectFromPath(link, 'settings\\/members') ||
    extractProjectFromPath(link, 'members')
  );
}

function extractIssueTarget(
  n: Notification,
): { issueKey: string; projectIdOrKey?: string } | null {
  if (n.link) {
    const projectIssueMatch = n.link.match(/\/projects\/([^/?#]+)\/issues\/([A-Za-z0-9_-]+)/);
    if (projectIssueMatch && projectIssueMatch[2].toLowerCase() !== 'issues') {
      return {
        projectIdOrKey: decodeURIComponent(projectIssueMatch[1]),
        issueKey: projectIssueMatch[2],
      };
    }
    const directIssueMatch = n.link.match(/\/issues\/([A-Za-z0-9_-]+)/);
    if (directIssueMatch && directIssueMatch[1].toLowerCase() !== 'issues') {
      return { issueKey: directIssueMatch[1] };
    }
  }
  const fallbackKey = String(n.sourceId || '').trim();
  if (fallbackKey) {
    return { issueKey: fallbackKey };
  }
  return null;
}

/**
 * Phân giải đích điều hướng khi người dùng bấm vào một thông báo trên Chuông (`bell`)
 * hoặc trong Trung tâm thông báo (`center`).
 */
export function resolveNotificationTarget(
  n: Notification,
  surface: 'bell' | 'center' = 'bell',
): NotificationNavigationTarget {
  if (n.type === 'invite') {
    if (isInviteeNotification(n)) {
      return surface === 'bell' ? { kind: 'screen', screen: 'invitations' } : { kind: 'none' };
    }
    const projectIdOrKey =
      extractProjectFromMembersLink(n.link) ||
      String(n.sourceId || (n as any).data || '').trim() ||
      undefined;
    return { kind: 'screen', screen: 'members-roles', projectIdOrKey };
  }

  if (n.link?.includes('/approval-requests')) {
    return {
      kind: 'screen',
      screen: 'approvals' as Screen,
      projectIdOrKey: extractProjectFromPath(n.link, 'approval-requests'),
    };
  }

  // Nếu link chỉ định tường minh đường dẫn /issues/{key} thì ưu tiên mở chi tiết công việc đó
  if (n.link && /\/issues\/[A-Za-z0-9_-]+/.test(n.link)) {
    const explicitIssue = extractIssueTarget(n);
    if (explicitIssue) {
      return { kind: 'issue', ...explicitIssue };
    }
  }

  const titleLower = (n.title || '').toLowerCase();
  if (
    String(n.type || '').toUpperCase() === 'APPROVAL' ||
    titleLower.includes('phê duyệt') ||
    titleLower.includes('yêu cầu phê duyệt')
  ) {
    return { kind: 'screen', screen: 'approvals' as Screen };
  }

  const issueTarget = extractIssueTarget(n);
  if (issueTarget) {
    return { kind: 'issue', ...issueTarget };
  }

  return surface === 'bell' ? { kind: 'screen', screen: 'board' } : { kind: 'none' };
}

/**
 * Thực thi chuyển dự án đang chọn (nếu có `projectIdOrKey`) và điều hướng tới màn hình đích.
 */
export async function executeNotificationNavigation(
  target: NotificationNavigationTarget,
  onNavigate?: (screen: Screen) => void,
): Promise<void> {
  if (target.kind === 'none') return;

  if (target.projectIdOrKey) {
    const keyLower = target.projectIdOrKey.toLowerCase();
    let projectList = useProjectStore.getState().projects;
    if (projectList.length === 0) {
      projectList = await useProjectStore.getState().fetchProjects();
    }
    const matched = projectList.find(
      (p) => String(p.id) === target.projectIdOrKey || p.key.toLowerCase() === keyLower,
    );
    if (matched) {
      useProjectStore.getState().setCurrentProject(matched);
    }
  }

  if (target.kind === 'screen') {
    onNavigate?.(target.screen);
    return;
  }

  if (target.kind === 'issue' && typeof window !== 'undefined') {
    const path = target.projectIdOrKey
      ? `/projects/${encodeURIComponent(target.projectIdOrKey)}/issues/${encodeURIComponent(target.issueKey)}`
      : `/issues/${encodeURIComponent(target.issueKey)}`;
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }
}
