import React from "react";
import { useAuth } from "../context/AuthContext";
import { 
  LayoutDashboard, 
  Users, 
  CalendarDays, 
  FolderGit2, 
  CheckSquare, 
  ShieldAlert, 
  LogOut, 
  Database, 
  Laptop2, 
  Globe2, 
  X, 
  ShieldCheck,
  ChevronRight,
  Sparkles
} from "lucide-react";
import { getSupabaseConfig, getSyncQueue } from "../services/supabaseClient";

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  isOpen, 
  onClose, 
  onOpenSyncModal 
}) {
  const { user, isAdmin, isSuperAdmin, logout } = useAuth();
  const config = getSupabaseConfig();
  const queueCount = getSyncQueue().length;

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "customers", label: "Customer Lists", icon: Users, badge: "Warm & Cold" },
    { id: "stock", label: "Stock Offers", icon: Laptop2 },
    { id: "calendar", label: "Social Calendar", icon: CalendarDays, badge: "USA / LATAM" },
    { id: "media", label: "Media Gallery", icon: FolderGit2, badge: "Drive" },
    { id: "tasks", label: "Tasks Manager", icon: CheckSquare },
  ];

  // User Access ONLY for Super Admin / Owner!
  if (isSuperAdmin) {
    navItems.push({ id: "users", label: "User Access", icon: ShieldAlert, badge: "Admin" });
  }

  const handleNavClick = (tabId) => {
    setActiveTab(tabId);
    if (onClose) onClose();
  };

  const NavContent = () => (
    <div className="flex flex-col h-full justify-between select-none">
      {/* Top: Brand & Navigation Links */}
      <div className="space-y-6">
        {/* Brand Header */}
        <div className="px-5 pt-5 pb-4 border-b border-brand-border/60">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => handleNavClick("dashboard")} 
              className="flex items-center gap-3.5 group text-left focus:outline-none"
            >
              <img 
                src="/brand/logo-white.png" 
                alt="MiNZTECH" 
                className="h-14 w-auto object-contain transition-transform group-hover:scale-105 drop-shadow-md" 
              />
              <div>
                <span className="block text-[9px] uppercase font-bold tracking-widest text-brand-neon">
                  Microsoft Authorized
                </span>
                <span className="text-[11px] text-gray-400 font-medium">Refurbisher Portal</span>
              </div>
            </button>

            {/* Mobile close button */}
            <button
              onClick={onClose}
              className="lg:hidden p-2 rounded-xl text-gray-400 hover:text-white hover:bg-brand-hover"
              title="Close navigation"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="px-3 space-y-1">
          <div className="px-3 pb-1 text-[10px] font-mono uppercase tracking-wider text-gray-500 font-semibold">
            Main Operations
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                  isActive
                    ? "bg-brand-neon text-brand-black shadow-lg shadow-brand-neon/20 font-bold"
                    : "text-gray-300 hover:text-white hover:bg-brand-hover"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-brand-black" : "text-gray-400 group-hover:text-brand-neon"}`} />
                  <span className="truncate">{item.label}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {item.badge && !isActive && (
                    <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-brand-dark/90 text-brand-lime font-mono border border-brand-border/60">
                      {item.badge}
                    </span>
                  )}
                  {isActive && (
                    <ChevronRight className="w-3.5 h-3.5 text-brand-black/70 stroke-[3]" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom: Operations Status, Supabase & User Profile */}
      <div className="p-3.5 space-y-3 border-t border-brand-border/60 bg-[#161616]">
        {/* Active Operations Card */}
        <div className="p-3 rounded-xl bg-brand-dark/80 border border-brand-border/60 text-xs space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-gray-400 flex items-center gap-1.5 font-medium">
              <Globe2 className="w-3.5 h-3.5 text-brand-neon" />
              <span>Operations</span>
            </span>
            <span className="px-1.5 py-0.2 rounded bg-brand-neon/20 text-brand-neon text-[9px] font-mono uppercase font-bold">
              Active
            </span>
          </div>
          <div className="space-y-1 text-[11px]">
            <div className="text-white font-semibold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-neon animate-pulse"></span>
              <span>USA HQ (Texas)</span>
            </div>
            <div className="text-gray-300 pl-3">Mexico Warehouse (GDL)</div>
            <div className="text-gray-300 pl-3">Dubai Warehouse (UAE)</div>
            <div className="text-gray-300 pl-3">Miami Warehouse (FL)</div>
          </div>
          <div className="text-[10px] text-brand-lime font-mono pt-1 border-t border-brand-border/40">
            Global Operations • Grade A+
          </div>
        </div>

        {/* Supabase Sync Button - ONLY for Super Admin / Owner */}
        {isSuperAdmin && (
          <button
            onClick={onOpenSyncModal}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-brand-surface hover:bg-brand-hover border border-brand-border hover:border-brand-neon/40 text-xs text-gray-300 transition-colors"
            title="Manage cloud database sync"
          >
            <div className="flex items-center gap-2">
              <Database className="w-3.5 h-3.5 text-brand-neon" />
              <span className="font-semibold text-white">Supabase Cloud</span>
            </div>
            <div className="flex items-center gap-1">
              {config.isConfigured ? (
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-semibold">
                  Online
                </span>
              ) : (
                <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-mono font-semibold">
                  Local
                </span>
              )}
              {queueCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-brand-black text-[9px] font-bold">
                  {queueCount}
                </span>
              )}
            </div>
          </button>
        )}

        {/* User Session & Logout */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-brand-neon text-brand-black flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-sm">
              {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-white truncate">{user?.name || "Team Member"}</div>
              <div className="text-[10px] text-brand-neon font-mono truncate">{user?.role || "Member"}</div>
            </div>
          </div>

          <button
            onClick={logout}
            className="p-2 rounded-xl bg-brand-dark hover:bg-red-500/20 text-gray-400 hover:text-red-400 border border-brand-border transition-colors flex-shrink-0"
            title="Log out from session"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Left Sidebar */}
      <aside className="hidden lg:flex flex-col fixed inset-y-0 left-0 w-64 xl:w-72 bg-[#181818] border-r border-brand-border/80 z-30 shadow-2xl">
        <NavContent />
      </aside>

      {/* Mobile Slide-in Drawer with Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop overlay */}
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={onClose}
          />

          {/* Drawer panel */}
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-[#181818] border-r border-brand-border shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            <NavContent />
          </div>
        </div>
      )}
    </>
  );
}
