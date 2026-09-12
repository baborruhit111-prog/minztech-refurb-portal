import React, { useState, useEffect } from "react";
import { useAuth } from "./context/AuthContext";
import Login from "./components/Login";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import Dashboard from "./components/Dashboard";
import CustomersCRM from "./components/CustomersCRM";
import StockOffers from "./components/StockOffers";
import SocialCalendar from "./components/SocialCalendar";
import MediaGallery from "./components/MediaGallery";
import TasksManager from "./components/TasksManager";
import UserManagement from "./components/UserManagement";
import SupabaseSyncModal from "./components/SupabaseSyncModal";
import NotificationCenter from "./components/NotificationCenter";
import InAppNotificationBanner from "./components/InAppNotificationBanner";
import { startAutoSyncBackgroundLoop } from "./services/supabaseClient";
import { deliverIncomingNotificationToDevice } from "./services/notifications";
import { syncRemoteUsersToLocal } from "./services/storage";

export default function App() {
  const { user, loading, isAdmin, isSuperAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState({ status: "idle", message: "" });

  // Fast background multi-device synchronization & mentions loop
  useEffect(() => {
    if (!user?.username) return;
    const cleanup = startAutoSyncBackgroundLoop(user.username);

    const handleRemoteNotif = (e) => {
      if (e.detail && user?.username) {
        deliverIncomingNotificationToDevice(e.detail, user.username);
      }
    };

    const handleRemoteUsers = (e) => {
      if (e.detail && Array.isArray(e.detail)) {
        syncRemoteUsersToLocal(e.detail);
      }
    };

    window.addEventListener("minztech_remote_notification_received", handleRemoteNotif);
    window.addEventListener("minztech_remote_users_received", handleRemoteUsers);

    return () => {
      cleanup();
      window.removeEventListener("minztech_remote_notification_received", handleRemoteNotif);
      window.removeEventListener("minztech_remote_users_received", handleRemoteUsers);
    };
  }, [user?.username]);

  // Restrict User Access tab strictly to Super Admin / Owner
  useEffect(() => {
    if (activeTab === "users" && !isSuperAdmin) {
      setActiveTab("dashboard");
    }
  }, [activeTab, isSuperAdmin]);

  if (loading) {
    return (
      <div className="min-h-screen min-h-[100dvh] w-full bg-brand-black flex items-center justify-center text-brand-neon">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-brand-neon border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-mono tracking-wider">Loading MiNZTECH Portal...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="min-h-screen min-h-[100dvh] bg-brand-black text-gray-100 flex flex-row overflow-x-hidden selection:bg-brand-neon selection:text-brand-black">
      {/* Interactive In-App Notification Banner for Mobile & Desktop */}
      <InAppNotificationBanner 
        setActiveTab={setActiveTab} 
        onOpenNotifications={() => setIsNotificationsOpen(true)} 
      />

      {/* Left Sidebar (Fixed on Desktop >= lg, Slide-in Drawer on Mobile < lg) */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        onOpenSyncModal={() => { if (isSuperAdmin) setIsSyncModalOpen(true); }}
      />

      {/* Main Content Area (Automatically fills 100% of remaining screen width) */}
      <div className="flex-1 min-w-0 w-full flex flex-col min-h-screen min-h-[100dvh] lg:pl-64 xl:pl-72 transition-all duration-200">
        {/* Sticky Top Header Bar */}
        <Navbar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          onOpenSyncModal={() => { if (isSuperAdmin) setIsSyncModalOpen(true); }}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          syncStatus={syncStatus}
        />

        {/* Dynamic Main Viewport Container */}
        <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 2xl:px-10 py-6">
          {activeTab === "dashboard" && (
            <Dashboard 
              setActiveTab={setActiveTab} 
              onOpenSyncModal={() => { if (isSuperAdmin) setIsSyncModalOpen(true); }} 
            />
          )}
          {activeTab === "customers" && <CustomersCRM />}
          {activeTab === "stock" && <StockOffers setActiveTab={setActiveTab} />}
          {activeTab === "calendar" && <SocialCalendar />}
          {activeTab === "media" && <MediaGallery />}
          {activeTab === "tasks" && <TasksManager />}
          {activeTab === "users" && isSuperAdmin && <UserManagement />}
        </main>

        {/* Sticky Enterprise Footer */}
        <footer className="bg-brand-surface/60 border-t border-brand-border/60 py-4 mt-auto text-xs text-gray-500 w-full">
          <div className="w-full px-4 sm:px-6 lg:px-8 2xl:px-10 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-neon animate-pulse"></span>
              <span className="text-gray-300 font-semibold">MiNZTECH Operations Hub</span>
              <span>— Microsoft Authorized Refurbisher Partner</span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-400">
              <span>USA HQ (Texas)</span>
              <span>•</span>
              <span>Guadalajara Warehouse</span>
              <span>•</span>
              <span>Dubai Warehouse (UAE)</span>
              <span>•</span>
              <span>Miami Warehouse (FL)</span>
            </div>
          </div>
        </footer>
      </div>

      {/* Notification Center Modal / Drawer */}
      <NotificationCenter
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        setActiveTab={setActiveTab}
      />

      {/* Supabase Sync Management Modal */}
      <SupabaseSyncModal 
        isOpen={isSyncModalOpen} 
        onClose={() => setIsSyncModalOpen(false)} 
      />
    </div>
  );
}
