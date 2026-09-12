import React, { useState, useEffect } from "react";
import { Bell, X, ArrowRight, Sparkles, MessageSquare } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function InAppNotificationBanner({ setActiveTab, onOpenNotifications }) {
  const { user } = useAuth();
  const [activeNotification, setActiveNotification] = useState(null);

  useEffect(() => {
    const handleNewNotif = (e) => {
      const notif = e.detail;
      if (!notif) return;

      // RECIPIENT VALIDATION: Strictly verify this banner is addressed to currently logged in user
      const recipient = (notif.recipientUsername || notif.recipient_username || "").toLowerCase();
      if (!user?.username || !recipient || recipient !== user.username.toLowerCase()) {
        return; // Do NOT show banner on sender's screen or unrelated users' screens
      }

      setActiveNotification(notif);

      // Auto-dismiss after 8 seconds
      const timer = setTimeout(() => {
        setActiveNotification((prev) => (prev?.id === notif.id ? null : prev));
      }, 8000);

      return () => clearTimeout(timer);
    };

    window.addEventListener("minztech_in_app_notification", handleNewNotif);
    return () => window.removeEventListener("minztech_in_app_notification", handleNewNotif);
  }, [user?.username]);

  if (!activeNotification) return null;

  const handleAction = () => {
    if (activeNotification.targetTab && setActiveTab) {
      setActiveTab(activeNotification.targetTab);
    } else if (onOpenNotifications) {
      onOpenNotifications();
    }
    setActiveNotification(null);
  };

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-lg animate-in slide-in-from-top-4 fade-in duration-300">
      <div className="bg-[#1c1c1c]/95 border-2 border-brand-neon/70 rounded-2xl p-4 shadow-[0_10px_35px_rgba(0,0,0,0.8),0_0_20px_rgba(204,255,0,0.25)] backdrop-blur-xl flex items-start justify-between gap-3 text-white">
        {/* Left Icon with pulse */}
        <div className="p-2.5 rounded-xl bg-brand-neon/20 border border-brand-neon/40 text-brand-neon flex-shrink-0 animate-bounce">
          <Bell className="w-5 h-5" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-brand-neon uppercase tracking-wider font-mono">
              New Team Mention
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-brand-neon animate-ping"></span>
          </div>

          <p className="text-xs font-semibold text-white mt-0.5 truncate">
            {activeNotification.senderName || "Team Member"} (@{activeNotification.senderUsername || "staff"})
          </p>

          <p className="text-xs text-gray-300 mt-1 line-clamp-2 leading-relaxed">
            {activeNotification.message}
          </p>

          {/* Action button */}
          <div className="mt-2.5 flex items-center gap-2">
            <button
              onClick={handleAction}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-neon hover:bg-brand-lime text-brand-black font-bold text-xs rounded-lg transition-all shadow-md active:scale-95"
            >
              <span>View Mention</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setActiveNotification(null)}
              className="px-2.5 py-1 text-xs text-gray-400 hover:text-white transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={() => setActiveNotification(null)}
          className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-brand-surface transition-colors flex-shrink-0"
          title="Close notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
