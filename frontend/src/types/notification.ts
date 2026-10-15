export type NotificationType = 'mention' | 'assignment' | 'workflow' | 'approval' | 'invite';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  isRead: boolean;
  createdAt: string;
  sourceId?: string;
}
