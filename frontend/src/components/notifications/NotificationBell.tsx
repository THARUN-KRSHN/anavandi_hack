import React, { useState, useEffect } from 'react';
import { Bell, CheckCheck, MessageSquare, AlertCircle } from 'lucide-react';
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  type DepotNotification,
} from '../../services/notificationService';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const NotificationBell: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const depotId = user?.depotId;

  const [notifications, setNotifications] = useState<DepotNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const loadNotifications = async () => {
    const list = await fetchNotifications(depotId);
    setNotifications(list);
  };

  useEffect(() => {
    loadNotifications();

    const handleStorageChange = () => {
      loadNotifications();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('anavandi_realtime_sync', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('anavandi_realtime_sync', handleStorageChange);
    };
  }, [depotId]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleNotificationClick = async (notif: DepotNotification) => {
    await markNotificationAsRead(notif.id);
    loadNotifications();
    setIsOpen(false);
    if (notif.referenceId) {
      navigate(`/depot/complaints`);
    }
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsAsRead(depotId);
    loadNotifications();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-10 h-10 rounded-full bg-white border border-[#EAECF0] shadow-sm flex items-center justify-center text-[#171717] hover:bg-gray-50 active:scale-95 transition-all"
        title="Notifications"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4 text-[#171717]" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-[#D92D20] text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-full min-w-[18px] text-center border-2 border-white animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-[#EAECF0] shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="p-3 bg-gray-50 border-b border-[#EAECF0] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#D92D20]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#171717]">
                Depot Alerts & Messages
              </h3>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[11px] font-semibold text-[#16A34A] hover:underline flex items-center gap-1"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#667085]">
                No notifications for this depot.
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`w-full text-left p-3.5 hover:bg-gray-50 transition-colors flex items-start gap-3 ${
                    !n.read ? 'bg-red-50/40' : ''
                  }`}
                >
                  <div
                    className={`p-2 rounded-full shrink-0 ${
                      n.type === 'admin_message'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-red-100 text-[#D92D20]'
                    }`}
                  >
                    {n.type === 'admin_message' ? (
                      <MessageSquare className="w-4 h-4" />
                    ) : (
                      <AlertCircle className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs font-bold text-[#171717] truncate">{n.title}</p>
                      {!n.read && (
                        <span className="w-2 h-2 rounded-full bg-[#D92D20] shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-[#667085] mt-0.5 line-clamp-2">{n.message}</p>
                    <span className="text-[10px] text-[#667085] mt-1 block">
                      {new Date(n.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
