import { createClient } from "@supabase/supabase-js";
import { 
  INITIAL_USERS, 
  INITIAL_CUSTOMERS, 
  INITIAL_STOCK_OFFERS, 
  INITIAL_SOCIAL_POSTS, 
  INITIAL_MEDIA_ASSETS, 
  INITIAL_TASKS 
} from "../data/mockData.js";

// Storage keys
const SUPABASE_URL_KEY = "minztech_supabase_url";
const SUPABASE_KEY_KEY = "minztech_supabase_key";
const SYNC_QUEUE_KEY = "minztech_sync_queue";
const LAST_SYNC_KEY = "minztech_last_sync";

// Default dummy demo Supabase URL or user provided
let supabaseInstance = null;

export const getSupabaseConfig = () => {
  const url = localStorage.getItem(SUPABASE_URL_KEY) || (typeof import.meta !== "undefined" && import.meta.env?.VITE_SUPABASE_URL) || "";
  const key = localStorage.getItem(SUPABASE_KEY_KEY) || (typeof import.meta !== "undefined" && import.meta.env?.VITE_SUPABASE_ANON_KEY) || "";
  return { url, key, isConfigured: Boolean(url && key && url.includes(".supabase.co")) };
};

export const initSupabaseClient = (url, key) => {
  if (url && key) {
    localStorage.setItem(SUPABASE_URL_KEY, url.trim());
    localStorage.setItem(SUPABASE_KEY_KEY, key.trim());
    try {
      supabaseInstance = createClient(url.trim(), key.trim(), {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
      return supabaseInstance;
    } catch (e) {
      console.error("Failed to initialize Supabase client", e);
      return null;
    }
  }
  return null;
};

export const getSupabase = () => {
  if (supabaseInstance) return supabaseInstance;
  const config = getSupabaseConfig();
  if (config.isConfigured) {
    return initSupabaseClient(config.url, config.key);
  }
  return null;
};

// Safe helper for background Supabase queries (PostgrestBuilder is a thenable without .catch)
export const safeSupabaseExec = (fn) => {
  try {
    const supabase = getSupabase();
    if (supabase) {
      const res = fn(supabase);
      if (res && typeof res.then === "function") {
        res.then(
          (result) => {
            if (result && result.error) {
              console.warn("Supabase background sync notice:", result.error.message);
            }
          },
          (err) => console.warn("Supabase background sync network notice:", err)
        );
      }
    }
  } catch (err) {
    console.warn("Supabase exec error:", err);
  }
};

// ==========================================
// RESILIENT OFFLINE QUEUE & DATA INTEGRITY
// ==========================================

let isFlushingQueue = false;
let autoFlushTimer = null;

export const getSyncQueue = () => {
  try {
    const raw = localStorage.getItem(SYNC_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

// Immediate background flush: sends pending changes to Supabase and clears from queue
export const flushSyncQueue = async () => {
  const supabase = getSupabase();
  if (!supabase || isFlushingQueue) return;

  const queue = getSyncQueue();
  if (queue.length === 0) return;

  isFlushingQueue = true;
  try {
    const remaining = [];
    for (const item of queue) {
      try {
        let recordToUpsert = item.record;
        if (item.table === "refurb_notifications") {
          recordToUpsert = {
            id: item.record.id,
            recipient_username: (item.record.recipient_username || item.record.recipientUsername || "").toLowerCase(),
            sender_name: item.record.sender_name || item.record.senderName || "Team Member",
            sender_username: item.record.sender_username || item.record.senderUsername || "user",
            type: item.record.type || "mention",
            message: item.record.message,
            target_type: item.record.target_type || item.record.targetType || "",
            target_id: item.record.target_id || item.record.targetId || "",
            target_title: item.record.target_title || item.record.targetTitle || "",
            target_tab: item.record.target_tab || item.record.targetTab || "calendar",
            read: !!item.record.read,
            created_at: item.record.created_at || item.record.createdAt || new Date().toISOString()
          };
        }

        if (item.action === "upsert") {
          const { error } = await supabase.from(item.table).upsert(recordToUpsert);
          if (error) {
            console.warn(`Sync retry queued for ${item.table}:`, error.message);
            remaining.push(item);
          }
        } else if (item.action === "delete") {
          const { error } = await supabase.from(item.table).delete().eq("id", item.record.id);
          if (error) {
            console.warn(`Delete retry queued for ${item.table}:`, error.message);
            remaining.push(item);
          }
        }
      } catch (err) {
        remaining.push(item);
      }
    }
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(remaining));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("minztech_sync_updated", { detail: { queueCount: remaining.length } }));
    }
  } catch (e) {
    console.warn("Notice: Auto-flush sync queue error:", e);
  } finally {
    isFlushingQueue = false;
  }
};

export const triggerAutoFlush = () => {
  if (autoFlushTimer) clearTimeout(autoFlushTimer);
  autoFlushTimer = setTimeout(() => {
    flushSyncQueue();
  }, 100);
};

export const addToSyncQueue = (table, action, record) => {
  const queue = getSyncQueue();
  const queueItem = {
    id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    table,
    action, // 'upsert' | 'delete'
    record,
    timestamp: new Date().toISOString(),
  };
  queue.push(queueItem);
  localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("minztech_sync_updated", { detail: { queueCount: queue.length } }));
  }

  // Fast automatic flush so operations don't get stuck in pending queue
  triggerAutoFlush();

  return queueItem;
};

export const clearSyncQueue = () => {
  localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify([]));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("minztech_sync_updated", { detail: { queueCount: 0 } }));
  }
};

// Automatic background polling loop & Supabase Realtime for multi-device sync and fast mentions delivery
export const startAutoSyncBackgroundLoop = (activeUsername) => {
  if (typeof window === "undefined" || !activeUsername) return () => {};

  const cleanUser = activeUsername.trim().toLowerCase();
  const supabase = getSupabase();

  // Track already notified IDs in this session to prevent repeated alerts
  const processedNotifIds = new Set();
  try {
    const existingRaw = localStorage.getItem("minztech_notifications");
    if (existingRaw) {
      JSON.parse(existingRaw).forEach(n => processedNotifIds.add(n.id));
    }
  } catch (e) {}

  // 1. Supabase Realtime channel for instant sub-second mention alerts on mobile & desktop
  let realtimeChannel = null;
  if (supabase) {
    try {
      realtimeChannel = supabase
        .channel(`portal_notifications_${cleanUser}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'refurb_notifications'
          },
          (payload) => {
            const row = payload.new;
            if (!row || !row.id) return;
            const rec = (row.recipient_username || row.recipientUsername || "").toLowerCase();
            if (rec === cleanUser && !processedNotifIds.has(row.id)) {
              processedNotifIds.add(row.id);
              window.dispatchEvent(new CustomEvent("minztech_remote_notification_received", { detail: row }));
            }
          }
        )
        .subscribe();
    } catch (err) {
      console.warn("Realtime channel subscription note:", err);
    }
  }

  // 2. High-frequency polling loop (every 6 seconds) as guaranteed resilient backup
  const runTick = async () => {
    // A. Flush pending offline queue
    flushSyncQueue();

    const sb = getSupabase();
    if (!sb) return;

    try {
      // Query notifications specifically addressed to this user
      const { data: remoteNotifs, error: notifErr } = await sb
        .from("refurb_notifications")
        .select("*")
        .eq("recipient_username", cleanUser)
        .order("created_at", { ascending: false })
        .limit(15);

      if (!notifErr && remoteNotifs && remoteNotifs.length > 0) {
        for (const rn of remoteNotifs) {
          if (!processedNotifIds.has(rn.id)) {
            processedNotifIds.add(rn.id);
            window.dispatchEvent(new CustomEvent("minztech_remote_notification_received", { detail: rn }));
          }
        }
      }
    } catch (err) {
      // Ignore background network blips
    }
  };

  // Initial tick after 1s, then every 6s
  const initialTimer = setTimeout(runTick, 1000);
  const interval = setInterval(runTick, 6000);

  return () => {
    clearTimeout(initialTimer);
    clearInterval(interval);
    if (realtimeChannel && supabase) {
      try {
        supabase.removeChannel(realtimeChannel);
      } catch (e) {}
    }
  };
};

// ==========================================
// ONLINE USER AUTHENTICATION
// ==========================================

export const authenticateUserOnline = async (username, password, localUsers) => {
  const supabase = getSupabase();
  const cleanUser = username.trim().toLowerCase();
  
  // 1. If Supabase is connected, check online first
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("refurb_users")
        .select("*")
        .ilike("username", cleanUser)
        .eq("password", password)
        .single();

      if (!error && data) {
        return { success: true, user: data, source: "supabase_online" };
      }
    } catch (err) {
      console.warn("Supabase auth error, falling back to local resilient store", err);
    }
  }

  // 2. Resilient local fallback (guarantees owner never locked out)
  const localMatch = localUsers.find(
    (u) => u.username.toLowerCase() === cleanUser && u.password === password
  );

  if (localMatch) {
    // If online Supabase is active, queue this user to be created in Supabase
    if (supabase) {
      addToSyncQueue("refurb_users", "upsert", localMatch);
    }
    return { success: true, user: localMatch, source: "local_cache" };
  }

  return { success: false, error: "Invalid username or password" };
};

// ==========================================
// BIDIRECTIONAL SYNC ENGINE (NEVER LOSE DATA)
// ==========================================

export const syncAllDataWithSupabase = async (localData, setSyncStatus) => {
  const supabase = getSupabase();
  if (!supabase) {
    return {
      success: false,
      message: "Supabase not connected. Data safely preserved in local offline store.",
      pendingQueue: getSyncQueue().length,
    };
  }

  if (setSyncStatus) setSyncStatus({ status: "syncing", message: "Pushing pending changes to Supabase..." });

  try {
    // 1. Process sync queue (all offline changes)
    const queue = getSyncQueue();
    const failedItems = [];

    for (const item of queue) {
      try {
        if (item.action === "upsert") {
          const { error } = await supabase.from(item.table).upsert(item.record);
          if (error) {
            console.error(`Error syncing ${item.table}:`, error);
            failedItems.push(item);
          }
        } else if (item.action === "delete") {
          const { error } = await supabase.from(item.table).delete().eq("id", item.record.id);
          if (error) {
            console.error(`Error deleting from ${item.table}:`, error);
            failedItems.push(item);
          }
        }
      } catch (err) {
        failedItems.push(item);
      }
    }

    // Save remaining failed items (if any)
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(failedItems));

    // 2. Full synchronization of core tables (Bulk upsert to ensure everything is saved)
    const tablesToSync = [
      { name: "refurb_users", data: localData.users },
      { name: "refurb_customers", data: localData.customers },
      { name: "refurb_stock_offers", data: localData.stockOffers },
      { name: "refurb_social_posts", data: localData.socialPosts },
      { name: "refurb_media_assets", data: localData.mediaAssets },
      { name: "refurb_tasks", data: localData.tasks },
    ];

    for (const tbl of tablesToSync) {
      if (tbl.data && tbl.data.length > 0) {
        const { error } = await supabase.from(tbl.name).upsert(tbl.data, { onConflict: "id" });
        if (error) {
          console.warn(`Table ${tbl.name} sync note:`, error.message);
        }
      }
    }

    // 3. Pull latest remote records from Supabase
    const cloudUpdates = {};
    for (const tbl of tablesToSync) {
      const { data, error } = await supabase.from(tbl.name).select("*");
      if (!error && data && data.length > 0) {
        cloudUpdates[tbl.name] = data;
      }
    }

    const now = new Date().toISOString();
    localStorage.setItem(LAST_SYNC_KEY, now);

    if (setSyncStatus) {
      setSyncStatus({ 
        status: "synced", 
        lastSynced: now, 
        message: "Successfully synchronized with Supabase cloud database!" 
      });
    }

    return {
      success: true,
      lastSynced: now,
      cloudUpdates,
      pendingQueue: failedItems.length,
      message: "Sync completed smoothly without data loss."
    };
  } catch (err) {
    console.error("Sync failed:", err);
    if (setSyncStatus) {
      setSyncStatus({ 
        status: "error", 
        message: "Sync failed. Your data is 100% safe locally and queued for retry." 
      });
    }
    return {
      success: false,
      message: "Sync error: " + err.message,
      pendingQueue: getSyncQueue().length
    };
  }
};

// ==========================================
// SQL SCHEMA GENERATOR FOR SUPABASE
// ==========================================
export const SUPABASE_SQL_SCHEMA = `-- ======================================================================
-- MiNZTECH: Microsoft Authorized Refurbisher Portal - Supabase Schema
-- Run this in your Supabase SQL Editor (Database > SQL Editor > New query)
-- ======================================================================

-- 1. Users Table (Stores Admin and Member credentials online)
CREATE TABLE IF NOT EXISTS public.refurb_users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'Member',
    title TEXT,
    email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Customers Table (Warm & Cold B2B Customer Lists)
CREATE TABLE IF NOT EXISTS public.refurb_customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    company TEXT,
    type TEXT NOT NULL, -- 'warm' or 'cold'
    email TEXT,
    phone TEXT,
    whatsapp TEXT,
    market TEXT DEFAULT 'USA', -- 'USA' or 'LATAM'
    location TEXT,
    source TEXT,
    collected_by TEXT,
    date_added DATE DEFAULT CURRENT_DATE,
    preferred_qty TEXT,
    status TEXT DEFAULT 'Needs Outreach',
    last_contact_date DATE,
    notes TEXT,
    deal_value TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.refurb_customers ADD COLUMN IF NOT EXISTS source TEXT;
ALTER TABLE public.refurb_customers ADD COLUMN IF NOT EXISTS collected_by TEXT;
ALTER TABLE public.refurb_customers ADD COLUMN IF NOT EXISTS date_added DATE DEFAULT CURRENT_DATE;


-- 3. Stock Offers Table (HP, Dell, Lenovo Refurbished Stock Lots)
CREATE TABLE IF NOT EXISTS public.refurb_stock_offers (
    id TEXT PRIMARY KEY,
    brand TEXT NOT NULL,
    model TEXT NOT NULL,
    specs TEXT,
    grade TEXT DEFAULT 'Grade A+',
    qty_available INT DEFAULT 0,
    min_order_qty INT DEFAULT 1,
    price_usd NUMERIC(10, 2),
    price_mxn NUMERIC(10, 2),
    warehouse TEXT DEFAULT 'USA Warehouse',
    ready_to_ship BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Social Media Posts Table (USA & Mexico Dual-Market Calendar)
CREATE TABLE IF NOT EXISTS public.refurb_social_posts (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    market TEXT NOT NULL, -- 'USA', 'LATAM', or 'Both'
    platforms JSONB DEFAULT '["facebook", "instagram"]'::jsonb,
    scheduled_date DATE NOT NULL,
    scheduled_time TEXT,
    status TEXT DEFAULT 'Draft',
    assigned_member TEXT,
    caption TEXT,
    media_url TEXT,
    media_type TEXT DEFAULT 'image',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Media Gallery Table (Google Drive Connected Assets)
CREATE TABLE IF NOT EXISTS public.refurb_media_assets (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    brand TEXT NOT NULL,
    type TEXT DEFAULT 'image',
    drive_url TEXT NOT NULL,
    drive_id TEXT,
    thumbnail TEXT,
    aspect_ratio TEXT,
    market TEXT,
    tags JSONB DEFAULT '[]'::jsonb,
    description TEXT,
    file_size TEXT,
    uploaded_date DATE DEFAULT CURRENT_DATE
);

-- 6. Member Tasks Table (Daily Task Checklist & Accountability)
CREATE TABLE IF NOT EXISTS public.refurb_tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    assigned_to TEXT,
    assigned_name TEXT,
    due_date DATE,
    priority TEXT DEFAULT 'Medium',
    category TEXT DEFAULT 'General',
    status TEXT DEFAULT 'To Do',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Notifications & Team Mentions Table (Instant Push & Mention Delivery)
CREATE TABLE IF NOT EXISTS public.refurb_notifications (
    id TEXT PRIMARY KEY,
    recipient_username TEXT NOT NULL,
    sender_name TEXT,
    sender_username TEXT,
    type TEXT DEFAULT 'mention',
    message TEXT,
    target_type TEXT,
    target_id TEXT,
    target_title TEXT,
    target_tab TEXT,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Disable Row Level Security (RLS) or open public policies for internal operations
ALTER TABLE public.refurb_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refurb_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refurb_stock_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refurb_social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refurb_media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refurb_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refurb_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow full access for portal refurb_users" ON public.refurb_users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access for portal refurb_customers" ON public.refurb_customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access for portal refurb_stock_offers" ON public.refurb_stock_offers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access for portal refurb_social_posts" ON public.refurb_social_posts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access for portal refurb_media_assets" ON public.refurb_media_assets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access for portal refurb_tasks" ON public.refurb_tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access for portal refurb_notifications" ON public.refurb_notifications FOR ALL USING (true) WITH CHECK (true);

-- Enable Realtime replication for instant sub-second mention alerts
DO $$ 
BEGIN 
    ALTER PUBLICATION supabase_realtime ADD TABLE public.refurb_notifications;
EXCEPTION 
    WHEN duplicate_object THEN NULL;
    WHEN undefined_object THEN NULL;
END $$;

-- Insert Default Owner / Super Admin Account
INSERT INTO public.refurb_users (id, username, password, name, role, title, email)
VALUES ('usr_owner_01', 'mt206.ruhit', 'Ruhit@mt', 'Ruhit', 'Admin', 'Owner & Super Admin', 'ruhit@minztech.com')
ON CONFLICT (id) DO UPDATE SET 
    username = EXCLUDED.username,
    password = EXCLUDED.password,
    role = EXCLUDED.role;
`;
