import React, { useState, useEffect } from "react";
import { 
  Bell, 
  Check, 
  Trash2, 
  ExternalLink, 
  Sparkles, 
  AtSign, 
  CheckCircle2, 
  Volume2, 
  ShieldCheck,
  X
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { 
  getNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead, 
  clearNotifications 
} from "../services/notifications";
import { 
  requestNotificationPermission, 
  getNotificationPermission, 
  sendDesktopNotification 
} from "../services/desktopNotifications";

export default function NotificationCenter({ isOpen, onClose, setActiveTab }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState(getNotifications(user?.username));
  const [permissionStatus, setPermissionStatus] = useState(getNotificationPermission());
  const [toastMessage, setToastMessage] = useState("");

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3000);
  };

  const refreshList = () => {
    setNotifications(getNotifications(user?.username));
    setPermissionStatus(getNotificationPermission());
  };

  useEffect(() => {
    refreshList();
    const interval = setInterval(refreshList, 3000);
    return () => clearInterval(interval);
  }, [user?.username]);

  if (!isOpen) return null;

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleEnableDesktop = async () => {
    const res = await requestNotificationPermission();
    setPermissionStatus(res.status);
    if (res.success) {
      showToast("Desktop notifications enabled successfully!");
    } else {
      alert(`Notification permission: ${res.status}. If blocked, allow notifications in your browser site settings.`);
    }
  };

  const handleTestDesktop = () => {
    sendDesktopNotification(
      "MiNZTECH Desktop Alert Test",
      "Desktop notifications are working! You will be alerted whenever someone mentions (@) you.",
      "/brand/logo-white.png"
    );
    showToast("Test notification sent to your desktop!");
  };

  const handleItemClick = (notif) => {
    markNotificationAsRead(notif.id);
    refreshList();
    if (notif.targetTab && setActiveTab) {
      setActiveTab(notif.targetTab);
    }
    onClose();
  };

  const handleMarkAllRead = () => {
    markAllNotificationsAsRead(user?.username);
    refreshList();
    showToast("All marked as read.");
  };

  const handleClear = () => {
    clearNotifications(user?.username);
    refreshList();
    showToast("Notifications cleared.");
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-start justify-end p-4 sm:p-6 backdrop-blur-sm animate-fadeIn">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-brand-neon text-brand-black px-4 py-2.5 rounded-xl font-bold shadow-2xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="bg-brand-surface border border-brand-border rounded-2xl max-w-md w-full shadow-2xl overflow-hidden flex flex-col max-h-[85vh] mt-12 animate-scaleIn">
        {/* Header */}
        <div className="p-4 bg-brand-dark/95 border-b border-brand-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-brand-neon/10 text-brand-neon">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Notification Center</h3>
              <p className="text-[11px] text-gray-400">
                {unreadCount > 0 ? `${unreadCount} unread mentions & updates` : "All caught up"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Desktop Notification Banner */}
        <div className="p-3 bg-brand-dark/60 border-b border-brand-border text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-brand-lime" />
            <div>
              <span className="text-gray-200 font-semibold block text-[11px]">Desktop Alerts:</span>
              <span className="text-[10px] text-gray-400">
                {permissionStatus === "granted" ? "Active (Alerts enabled)" : "Enable for live OS popups"}
              </span>
            </div>
          </div>

          {permissionStatus === "granted" ? (
            <button
              onClick={handleTestDesktop}
              className="px-2.5 py-1 bg-brand-surface hover:bg-brand-hover text-brand-neon border border-brand-neon/30 text-[10px] font-bold rounded-lg transition-colors"
            >
              Test Alert
            </button>
          ) : (
            <button
              onClick={handleEnableDesktop}
              className="px-3 py-1 bg-brand-neon hover:bg-brand-lime text-brand-black text-[10px] font-bold rounded-lg shadow-sm transition-all"
            >
              Enable Desktop
            </button>
          )}
        </div>

        {/* Actions bar */}
        <div className="px-4 py-2 bg-brand-surface border-b border-brand-border/40 flex items-center justify-between text-[11px] text-gray-400">
          <span>@{user?.username || "user"}</span>
          <div className="flex items-center gap-3">
            {notifications.length > 0 && (
              <>
                <button onClick={handleMarkAllRead} className="hover:text-brand-neon transition-colors">
                  Mark all read
                </button>
                <span>•</span>
                <button onClick={handleClear} className="hover:text-red-400 transition-colors">
                  Clear
                </button>
              </>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {notifications.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <Bell className="w-8 h-8 mx-auto text-gray-600 mb-2 opacity-50" />
              <p className="text-xs font-semibold text-white">No notifications yet</p>
              <p className="text-[11px] mt-1 text-gray-500">
                When a team member mentions you using <strong className="text-brand-lime">@{user?.username}</strong>, it will appear here.
              </p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleItemClick(notif)}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  notif.read 
                    ? "bg-brand-dark/40 border-brand-border/40 text-gray-300 opacity-80" 
                    : "bg-brand-dark border-brand-neon/40 shadow-sm text-white"
                } hover:border-brand-neon`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-brand-neon flex-shrink-0"></span>
                    <span className="font-bold text-xs text-brand-neon">{notif.senderName}</span>
                    <span className="text-[10px] text-gray-400 font-mono">(@{notif.senderUsername})</span>
                  </div>
                  <span className="text-[10px] text-gray-500 font-mono">
                    {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <p className="text-xs text-gray-200 line-clamp-2 pl-3.5 leading-relaxed">
                  {notif.message}
                </p>

                <div className="mt-2 pt-1.5 border-t border-brand-border/40 flex items-center justify-between text-[10px] text-gray-400 pl-3.5">
                  <span className="truncate max-w-[200px]">
                    Topic: <strong className="text-gray-200">{notif.targetTitle}</strong>
                  </span>
                  <span className="text-brand-lime flex items-center gap-0.5 font-semibold">
                    <span>View in {notif.targetTab === "media" ? "Media" : "Calendar"}</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
