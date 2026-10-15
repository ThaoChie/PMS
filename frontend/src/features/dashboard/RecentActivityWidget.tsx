import React from 'react';
import { ArrowRight } from 'lucide-react';
import type { NotificationItem } from '../../types';

function formatRelTime(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

interface RecentActivityWidgetProps {
  notifications: NotificationItem[];
  onNavigate?: (screen: any) => void;
}

export const RecentActivityWidget: React.FC<RecentActivityWidgetProps> = ({
  notifications,
  onNavigate,
}) => {
  return (
    <div className="border border-[#E5E5E7] rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-[#E5E5E7] flex items-center justify-between">
        <h2 className="text-xs font-semibold text-[#1A1A1A]">Recent activity</h2>
        {onNavigate && (
          <button
            onClick={() => onNavigate('notifications')}
            className="text-[10px] text-[#6B6B70] hover:text-[#E53E3E] flex items-center gap-1 transition-colors"
          >
            View all <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>
      {notifications.length === 0 ? (
        <div className="py-12 text-center text-xs text-[#9B9B9F]">
          No recent activity
        </div>
      ) : (
        <div className="divide-y divide-[#F0F0F1]">
          {notifications.map(n => (
            <div
              key={n.id}
              className={`flex items-start gap-3 px-5 py-3 ${!n.isRead ? 'bg-[#FAFAFA]' : ''}`}
            >
              <div
                className="w-1.5 h-1.5 rounded-full bg-[#6B6B70] mt-2 shrink-0"
                style={{ opacity: n.isRead ? 0 : 1 }}
              />
              <div className="flex-1 min-w-0">
                <p
                  className={`text-xs ${
                    !n.isRead ? 'font-medium text-[#1A1A1A]' : 'text-[#1A1A1A]'
                  } truncate`}
                >
                  {n.title}
                </p>
                <p className="text-[10px] text-[#6B6B70] mt-0.5 line-clamp-1">
                  {n.description}
                </p>
                <p className="text-[10px] text-[#9B9B9F] mt-1">{formatRelTime(n.createdAt)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
