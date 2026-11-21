export type NotificationType = 'mention' | 'assignment' | 'workflow' | 'approval' | 'invite';

export interface Notification {
  id: string;
  type: NotificationType;
  rawType?: string;
  title: string;
  description: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
  sourceId?: string;
}

export type NotificationItem = Notification;
