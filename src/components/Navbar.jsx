import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { 
  Menu, 
  Bell, 
  Database, 
  Globe2, 
  Layers, 
  Search, 
  Laptop,
  CheckCircle2
} from "lucide-react";
import { getSupabaseConfig, getSyncQueue } from "../services/supabaseClient";
import { getNotifications } from "../services/notifications";

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  onToggleMobileMenu,
  onOpenSyncModal, 
  onOpenNotifications, 
  syncStatus 
}) {
  const { user } = useAuth();
  const [queueCount, setQueueCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const config = getSupabaseConfig();

  useEffect(() => {
    const updateStats = () => {
      setQueueCount(getSyncQueue().length);
      const notifs = getNotifications(user?.username);
      setUnreadCount(notifs.filter(n => !n.read).length);
    };
    updateStats();
    const interval = setInterval(updateStats, 3000);
    return () => clearInterval(interval);
  }, [user?.username]);

  const pageTitles = {
    dashboard: { title: "Executive Operations Dashboard", subtitle: "Real-time enterprise metrics & inventory intake" },
    customers: { title: "Customer Lists & CRM", subtitle: "Warm Prospects & Cold B2B wholesale buyers" },
    stock: { title: "Stock Offers Catalog", subtitle: "A+ certified HP, Dell & Lenovo laptop inventory" },
    calendar: { title: "Dual-Market Social Calendar", subtitle: "USA B2B & Mexico Warehouse social scheduling" },
    media: { title: "Google Drive Media Gallery", subtitle: "Automatic previews, video clips & team comments" },
    tasks: { title: "Daily Member Task Tracker", subtitle: "Operations quotas, assignments & progress" },
    users: { title: "User Access & Permissions", subtitle: "Team accounts, roles & Supabase authentication" },
  };

  const currentInfo = pageTitles[activeTab] || { title: "Operations Portal", subtitle: "MiNZTECH Refurbisher" };

  return (
    <header className="sticky top-0 z-20 bg-[#161616]/95 backdrop-blur-md border-b border-brand-border/80 w-full shadow-sm">
      <div className="w-full px-4 sm:px-6 lg:px-8 2xl:px-10 h-16 flex items-center justify-between gap-4">
        {/* Left Side: Mobile Menu Button or Desktop Breadcrumb */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Mobile Hamburger Toggle Button */}
          <button
            onClick={onToggleMobileMenu}
            className="lg:hidden p-2 rounded-xl bg-brand-surface hover:bg-brand-hover text-gray-300 hover:text-white border border-brand-border transition-colors flex-shrink-0"
            title="Toggle Navigation Menu"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5 text-brand-neon" />
          </button>

          {/* Mobile Logo (< lg) */}
          <div className="lg:hidden flex items-center gap-2">
            <img 
              src="/brand/logo-white.png" 
              alt="MiNZTECH" 
              className="h-7 w-auto object-contain" 
            />
          </div>

          {/* Desktop Breadcrumb & Section Title (>= lg) */}
          <div className="hidden lg:block min-w-0">
            <h1 className="text-base font-extrabold text-white tracking-tight truncate">
              {currentInfo.title}
            </h1>
            <p className="text-xs text-gray-400 truncate">
              {currentInfo.subtitle}
            </p>
          </div>
        </div>

        {/* Right Side: Global Status & Notifications */}
        <div className="flex items-center gap-2.5 sm:gap-3 flex-shrink-0">
          {/* Top Micro Active Operations Pill (Desktop) */}
          <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-brand-dark border border-brand-border/80 text-xs text-gray-300">
            <Globe2 className="w-3.5 h-3.5 text-brand-neon" />
            <span className="font-semibold text-white">USA HQ</span>
            <span className="text-gray-500">•</span>
            <span className="text-brand-lime font-medium">Mexico Warehouse</span>
          </div>

          {/* Supabase Cloud Live Sync Pill */}
          <button
            onClick={onOpenSyncModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all bg-brand-surface border border-brand-border hover:border-brand-neon/50 group"
            title="Click to view Supabase database connection & sync queue"
          >
            <Database className="w-3.5 h-3.5 text-brand-neon group-hover:rotate-12 transition-transform" />
            <span className="hidden sm:inline text-gray-300">Supabase:</span>
            {config.isConfigured ? (
              <span className="text-brand-neon font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-neon animate-pulse"></span>
                <span className="text-[11px]">Online</span>
              </span>
            ) : (
              <span className="text-amber-400 font-medium text-[11px]">Local</span>
            )}

            {queueCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 bg-amber-500 text-brand-black font-bold rounded-full text-[10px]">
                {queueCount}
              </span>
            )}
          </button>

          {/* Notification Center Bell Button */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 rounded-xl bg-brand-surface hover:bg-brand-hover border border-brand-border text-gray-300 hover:text-white transition-colors"
            title="Notification Center & Mentions"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4 text-brand-neon" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-brand-neon text-brand-black font-extrabold text-[10px] flex items-center justify-center animate-pulse shadow-sm">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
