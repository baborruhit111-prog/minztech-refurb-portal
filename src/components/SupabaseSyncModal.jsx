import React, { useState, useEffect } from "react";
import { 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Copy, 
  Download, 
  Upload, 
  ShieldCheck, 
  CloudOff, 
  Cloud,
  FileCode,
  Layers,
  ArrowDownCircle,
  ExternalLink
} from "lucide-react";
import { 
  getSupabaseConfig, 
  initSupabaseClient, 
  syncAllDataWithSupabase, 
  getSyncQueue, 
  clearSyncQueue,
  SUPABASE_SQL_SCHEMA 
} from "../services/supabaseClient";
import { 
  getUsers, 
  getCustomers, 
  getStockOffers, 
  getSocialPosts, 
  getMediaAssets, 
  getTasks,
  exportFullBackup,
  importFullBackup 
} from "../services/storage";

export default function SupabaseSyncModal({ isOpen, onClose }) {
  const [config, setConfig] = useState(getSupabaseConfig());
  const [urlInput, setUrlInput] = useState(config.url);
  const [keyInput, setKeyInput] = useState(config.key);
  const [syncQueue, setSyncQueue] = useState(getSyncQueue());
  const [syncing, setSyncing] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [activeTab, setActiveTab] = useState("connect"); // 'connect' | 'schema' | 'backup'
  const [toastMessage, setToastMessage] = useState("");

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  useEffect(() => {
    if (isOpen) {
      const cfg = getSupabaseConfig();
      setConfig(cfg);
      setUrlInput(cfg.url);
      setKeyInput(cfg.key);
      setSyncQueue(getSyncQueue());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveConfig = () => {
    if (!urlInput.trim() || !keyInput.trim()) {
      alert("Please provide both Supabase Project URL and Anon Key.");
      return;
    }
    const client = initSupabaseClient(urlInput, keyInput);
    if (client) {
      setConfig(getSupabaseConfig());
      showToast("Supabase configuration saved!");
      handleForceSync();
    } else {
      alert("Failed to initialize Supabase client with given credentials.");
    }
  };

  const handleForceSync = async () => {
    setSyncing(true);
    setStatusMessage("Synchronizing all local data with Supabase Cloud...");
    
    const localData = {
      users: getUsers(),
      customers: getCustomers(),
      stockOffers: getStockOffers(),
      socialPosts: getSocialPosts(),
      mediaAssets: getMediaAssets(),
      tasks: getTasks()
    };

    const res = await syncAllDataWithSupabase(localData);
    setSyncQueue(getSyncQueue());
    setSyncing(false);
    
    if (res.success) {
      setStatusMessage("All data safely synchronized with Supabase!");
      showToast("Sync completed successfully!");
    } else {
      setStatusMessage(res.message);
    }
  };

  const handleRemoveQueueItem = (id) => {
    const updated = syncQueue.filter(item => item.id !== id);
    setSyncQueue(updated);
    localStorage.setItem("minztech_sync_queue", JSON.stringify(updated));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("minztech_sync_updated", { detail: { queueCount: updated.length } }));
    }
    showToast("Operation dismissed from queue.");
  };

  const copySqlSchema = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    showToast("Supabase SQL Schema copied! Paste into Supabase SQL Editor.");
  };

  const handleExportBackup = () => {
    const backup = exportFullBackup();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backup, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `minztech_portal_backup_${new Date().toISOString().split("T")[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast("Full backup file downloaded!");
  };

  const handleImportBackup = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        importFullBackup(json);
        showToast("Backup data restored successfully!");
        handleForceSync();
      } catch (err) {
        alert("Invalid backup file JSON.");
      }
    };
    reader.readAsText(file);
  };
  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 backdrop-blur-md">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-brand-neon text-brand-black px-4 py-2 rounded-xl font-bold shadow-2xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="bg-brand-surface border border-brand-border rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-brand-neon/10 text-brand-neon">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Supabase Cloud Synchronization Engine</h2>
              <p className="text-xs text-gray-400">Zero-data-loss resilient synchronization hub</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-lg font-bold">✕</button>
        </div>

        {/* Modal Tabs */}
        <div className="flex items-center gap-1 bg-brand-dark p-1 rounded-xl border border-brand-border text-xs font-semibold">
          <button
            onClick={() => setActiveTab("connect")}
            className={`flex-1 py-2 rounded-lg transition-all ${
              activeTab === "connect" ? "bg-brand-neon text-brand-black font-bold" : "text-gray-400 hover:text-white"
            }`}
          >
            Cloud Connection & Queue
          </button>
          <button
            onClick={() => setActiveTab("schema")}
            className={`flex-1 py-2 rounded-lg transition-all ${
              activeTab === "schema" ? "bg-brand-neon text-brand-black font-bold" : "text-gray-400 hover:text-white"
            }`}
          >
            Database SQL Schema
          </button>
          <button
            onClick={() => setActiveTab("backup")}
            className={`flex-1 py-2 rounded-lg transition-all ${
              activeTab === "backup" ? "bg-brand-neon text-brand-black font-bold" : "text-gray-400 hover:text-white"
            }`}
          >
            Physical Backup (.JSON)
          </button>
        </div>

        {/* Tab 1: Connect & Sync */}
        {activeTab === "connect" && (
          <div className="space-y-4 text-xs">
            {/* Status card */}
            <div className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${
              config.isConfigured 
                ? "bg-brand-neon/10 border-brand-neon/30 text-white" 
                : "bg-amber-500/10 border-amber-500/30 text-amber-200"
            }`}>
              <div className="flex items-center gap-2.5">
                {config.isConfigured ? (
                  <Cloud className="w-5 h-5 text-brand-neon flex-shrink-0" />
                ) : (
                  <CloudOff className="w-5 h-5 text-amber-400 flex-shrink-0" />
                )}
                <div>
                  <div className="font-bold">
                    {config.isConfigured ? "Connected to Supabase Cloud" : "Offline / Local Store Active"}
                  </div>
                  <div className="text-[11px] text-gray-300">
                    {config.isConfigured 
                      ? "All changes automatically push to PostgreSQL tables." 
                      : "Changes are preserved locally and queued for automatic cloud upload."}
                  </div>
                </div>
              </div>

              <span className="px-2.5 py-1 rounded-full font-mono font-bold text-[11px] bg-brand-dark">
                {syncQueue.length} Queued
              </span>
            </div>

            {/* Missing Schema / Error Quick Helper */}
            {syncQueue.some(item => item.lastError) && (
              <div className="p-3 bg-amber-500/15 border border-amber-500/40 rounded-xl text-amber-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>Tables need to be updated in Supabase (e.g. notifications table).</span>
                </div>
                <button
                  onClick={() => setActiveTab("schema")}
                  className="px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-black font-bold rounded-lg text-[11px] whitespace-nowrap"
                >
                  View SQL Schema
                </button>
              </div>
            )}

            {/* Inputs */}
            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-gray-300 font-semibold mb-1">
                  Supabase Project URL (e.g. https://xyz.supabase.co):
                </label>
                <input
                  type="text"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://your-project-id.supabase.co"
                  className="w-full px-3 py-2 bg-brand-dark border border-brand-border rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-brand-neon font-mono"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">
                  Supabase Anon Public API Key:
                </label>
                <input
                  type="password"
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full px-3 py-2 bg-brand-dark border border-brand-border rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-brand-neon font-mono"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={handleSaveConfig}
                  className="px-4 py-2 bg-brand-dark hover:bg-brand-hover text-brand-neon border border-brand-border font-bold rounded-xl"
                >
                  Save Credentials
                </button>

                <button
                  onClick={handleForceSync}
                  disabled={syncing}
                  className="flex items-center gap-1.5 px-5 py-2 bg-brand-neon hover:bg-brand-lime text-brand-black font-bold rounded-xl shadow-md disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
                  <span>{syncing ? "Syncing..." : "Force Sync Now"}</span>
                </button>
              </div>

              {statusMessage && (
                <div className="p-3 bg-brand-dark rounded-xl border border-brand-border text-gray-300 text-[11px] font-mono">
                  {statusMessage}
                </div>
              )}
            </div>

            {/* Offline Queue Items (if any) */}
            {syncQueue.length > 0 && (
              <div className="mt-4 pt-4 border-t border-brand-border">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-gray-300">Pending Sync Operations ({syncQueue.length}):</h4>
                  <button
                    onClick={() => {
                      clearSyncQueue();
                      setSyncQueue([]);
                      showToast("Sync queue cleared.");
                    }}
                    className="text-[11px] text-red-400 hover:text-red-300"
                  >
                    Clear Queue
                  </button>
                </div>
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {syncQueue.map((item) => (
                    <div key={item.id} className="p-2 bg-brand-dark rounded-lg text-[11px] text-gray-400 font-mono space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-200">
                          {item.action.toUpperCase()} on <code className="text-brand-neon">{item.table}</code>
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 text-[10px]">{new Date(item.timestamp).toLocaleTimeString()}</span>
                          <button
                            onClick={() => handleRemoveQueueItem(item.id)}
                            className="text-gray-500 hover:text-red-400 font-bold px-1"
                            title="Dismiss this pending operation"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                      {item.lastError && (
                        <div className="text-[10px] text-amber-400 bg-amber-950/30 px-1.5 py-0.5 rounded border border-amber-500/20 truncate">
                          {item.lastError}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: SQL Schema Generator */}
        {activeTab === "schema" && (
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <p className="text-gray-300">
                Run this SQL script in your Supabase project (<strong>Database &gt; SQL Editor</strong>) to create all 7 tables and policies with 1 click:
              </p>
              <button
                onClick={copySqlSchema}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-neon hover:bg-brand-lime text-brand-black font-bold rounded-lg shadow-sm"
              >
                <Copy className="w-3 h-3" />
                <span>Copy SQL Script</span>
              </button>
            </div>

            <div className="p-3 bg-brand-dark rounded-xl border border-brand-border font-mono text-[11px] text-gray-300 max-h-64 overflow-y-auto leading-relaxed">
              <pre>{SUPABASE_SQL_SCHEMA}</pre>
            </div>

            <p className="text-[11px] text-gray-400">
              💡 Pre-seeds default Super Admin credentials (<code className="text-brand-neon">mt206.ruhit</code> / <code className="text-brand-neon">Ruhit@mt</code>) and establishes open RLS policies.
            </p>
          </div>
        )}

        {/* Tab 3: Physical Backup */}
        {activeTab === "backup" && (
          <div className="space-y-4 text-xs">
            <p className="text-gray-300">
              Download complete snapshots of your customer lists, stock lots, social posts, media assets, tasks, and users.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-brand-dark rounded-xl border border-brand-border space-y-3">
                <div className="flex items-center gap-2 text-white font-bold">
                  <Download className="w-4 h-4 text-brand-neon" />
                  <span>Download Backup File</span>
                </div>
                <p className="text-gray-400 text-[11px]">
                  Exports all portal data to a single offline <code className="text-brand-lime">.json</code> file.
                </p>
                <button
                  onClick={handleExportBackup}
                  className="w-full py-2 bg-brand-surface hover:bg-brand-neon hover:text-brand-black text-brand-neon font-bold rounded-lg border border-brand-neon/40 transition-colors"
                >
                  Export JSON Backup
                </button>
              </div>

              <div className="p-4 bg-brand-dark rounded-xl border border-brand-border space-y-3">
                <div className="flex items-center gap-2 text-white font-bold">
                  <Upload className="w-4 h-4 text-brand-lime" />
                  <span>Restore from Backup</span>
                </div>
                <p className="text-gray-400 text-[11px]">
                  Upload a previously saved <code className="text-brand-lime">.json</code> backup to restore data.
                </p>
                <label className="block text-center py-2 bg-brand-surface hover:bg-brand-hover text-gray-200 font-bold rounded-lg border border-brand-border cursor-pointer transition-colors">
                  <span>Select JSON File</span>
                  <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
                </label>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
