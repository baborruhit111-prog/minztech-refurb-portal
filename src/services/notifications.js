import { getUsers } from "./storage.js";
import { addToSyncQueue, safeSupabaseExec } from "./supabaseClient.js";
import { sendDesktopNotification } from "./desktopNotifications.js";
import { triggerNotificationAlert } from "./audioHelper.js";

const NOTIFICATIONS_KEY = "minztech_notifications";

export const INITIAL_NOTIFICATIONS = [
  {
    id: "notif_01",
    recipientUsername: "mt206.ruhit",
    senderName: "Carlos Mendoza",
    senderUsername: "carlos.mex",
    type: "mention",
    message: "@mt206.ruhit We received 280 units of Lenovo ThinkPad T14 at the Guadalajara warehouse. All MAR certified.",
    targetType: "media_asset",
    targetId: "med_03",
    targetTitle: "Mexico Warehouse Pallet Arrival",
    targetTab: "media",
    read: false,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: "notif_02",
    recipientUsername: "mt206.ruhit",
    senderName: "Sarah Jenkins",
    senderUsername: "sarah.ops",
    type: "mention",
    message: "@mt206.ruhit Sarah commented on social post: Ready for TikTok drop tomorrow morning.",
    targetType: "social_post",
    targetId: "post_01",
    targetTitle: "Massive Lot: 500x HP EliteBook 840 G8",
    targetTab: "calendar",
    read: false,
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString()
  }
];

export const loadRawNotifications = () => {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_KEY);
    return raw ? JSON.parse(raw) : INITIAL_NOTIFICATIONS;
  } catch (e) {
    return INITIAL_NOTIFICATIONS;
  }
};

export const getNotifications = (username) => {
  try {
    const all = loadRawNotifications();
    if (!username) return all;
    // Strictly return notifications directed to this specific user
    return all.filter(n => {
      const rec = (n.recipientUsername || n.recipient_username || "").toLowerCase();
      return rec === username.toLowerCase();
    });
  } catch (e) {
    return INITIAL_NOTIFICATIONS;
  }
};

export const saveNotificationsList = (list) => {
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(list));
};

// Add a notification sent from the current user
// IMPORTANT: The SENDER must NOT receive audio chimes, vibrations, or popups for their own sent mention!
export const addNotification = (notif) => {
  const newNotif = {
    id: notif.id || `notif_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    recipientUsername: (notif.recipientUsername || notif.recipient_username || "").toLowerCase(),
    senderName: notif.senderName || notif.sender_name || "Team Member",
    senderUsername: (notif.senderUsername || notif.sender_username || "user").toLowerCase(),
    type: notif.type || "mention",
    message: notif.message,
    targetType: notif.targetType || notif.target_type || "",
    targetId: notif.targetId || notif.target_id || "",
    targetTitle: notif.targetTitle || notif.target_title || "",
    targetTab: notif.targetTab || notif.target_tab || "calendar",
    read: false,
    createdAt: notif.createdAt || new Date().toISOString()
  };

  // 1. Save in local cache
  const all = loadRawNotifications();
  const updated = [newNotif, ...all.filter(n => n.id !== newNotif.id)];
  saveNotificationsList(updated);

  // 2. Prepare payload for Supabase Cloud (PostgreSQL snake_case schema)
  const supabasePayload = {
    id: newNotif.id,
    recipient_username: newNotif.recipientUsername,
    sender_name: newNotif.senderName,
    sender_username: newNotif.senderUsername,
    type: newNotif.type,
    message: newNotif.message,
    target_type: newNotif.targetType,
    target_id: newNotif.targetId,
    target_title: newNotif.targetTitle,
    target_tab: newNotif.targetTab,
    read: false,
    created_at: newNotif.createdAt
  };

  // 3. Queue for synchronization & flush immediately to Supabase
  addToSyncQueue("refurb_notifications", "upsert", supabasePayload);
  safeSupabaseExec((sb) => sb.from("refurb_notifications").upsert(supabasePayload));

  // Notice: We intentionally do NOT call triggerNotificationAlert,
  // do NOT dispatch minztech_in_app_notification, and do NOT call sendDesktopNotification here.
  // The sender is creating the mention; only the RECIPIENT should be alerted.

  return newNotif;
};

// Deliver an incoming notification directly to the recipient's device (phone/PC)
export const deliverIncomingNotificationToDevice = (incomingNotif, activeUsername) => {
  if (!incomingNotif || !activeUsername) return false;

  const recipient = (incomingNotif.recipientUsername || incomingNotif.recipient_username || "").toLowerCase();
  if (recipient !== activeUsername.toLowerCase()) {
    return false; // Not addressed to this user
  }

  const normalized = {
    id: incomingNotif.id,
    recipientUsername: recipient,
    senderName: incomingNotif.senderName || incomingNotif.sender_name || "Team Member",
    senderUsername: incomingNotif.senderUsername || incomingNotif.sender_username || "user",
    type: incomingNotif.type || "mention",
    message: incomingNotif.message,
    targetType: incomingNotif.targetType || incomingNotif.target_type || "",
    targetId: incomingNotif.targetId || incomingNotif.target_id || "",
    targetTitle: incomingNotif.targetTitle || incomingNotif.target_title || "",
    targetTab: incomingNotif.targetTab || incomingNotif.target_tab || "calendar",
    read: !!incomingNotif.read,
    createdAt: incomingNotif.createdAt || incomingNotif.created_at || new Date().toISOString()
  };

  // 1. Cache to local notifications
  const all = loadRawNotifications();
  if (!all.some(n => n.id === normalized.id)) {
    const updated = [normalized, ...all];
    saveNotificationsList(updated);
  }

  // 2. Play sound chime and mobile vibration on the RECIPIENT device
  triggerNotificationAlert();

  // 3. Trigger In-App Notification Banner on RECIPIENT screen
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("minztech_in_app_notification", { detail: normalized }));
    window.dispatchEvent(new CustomEvent("minztech_data_refreshed", { detail: { type: "notifications" } }));
  }

  // 4. Trigger desktop/browser notification if permitted
  sendDesktopNotification(
    `MiNZTECH Mention from ${normalized.senderName}`,
    normalized.message,
    "/brand/logo-white.png"
  );

  return true;
};

export const markNotificationAsRead = (id) => {
  const all = loadRawNotifications();
  const updated = all.map(n => n.id === id ? { ...n, read: true } : n);
  saveNotificationsList(updated);
  safeSupabaseExec((sb) => sb.from("refurb_notifications").update({ read: true }).eq("id", id));
};

export const markAllNotificationsAsRead = (username) => {
  const all = loadRawNotifications();
  const updated = all.map(n => {
    const rec = (n.recipientUsername || n.recipient_username || "").toLowerCase();
    if (!username || rec === username.toLowerCase()) {
      return { ...n, read: true };
    }
    return n;
  });
  saveNotificationsList(updated);
  if (username) {
    safeSupabaseExec((sb) => sb.from("refurb_notifications").update({ read: true }).eq("recipient_username", username.toLowerCase()));
  }
};

export const clearNotifications = (username) => {
  const all = loadRawNotifications();
  const remaining = username 
    ? all.filter(n => (n.recipientUsername || n.recipient_username || "").toLowerCase() !== username.toLowerCase()) 
    : [];
  saveNotificationsList(remaining);
  if (username) {
    safeSupabaseExec((sb) => sb.from("refurb_notifications").delete().eq("recipient_username", username.toLowerCase()));
  }
};

// Helper: Parse @mentions in text and dispatch notifications
export const processCommentMentions = ({
  commentText,
  currentUser,
  targetType,
  targetId,
  targetTitle,
  targetTab
}) => {
  if (!commentText) return [];

  let users = [];
  try {
    users = getUsers() || [];
  } catch (e) {
    users = [];
  }

  const mentionMatches = commentText.match(/@([a-zA-Z0-9_.-]+)/g);
  if (!mentionMatches) return [];

  const notifiedUsernames = new Set();
  const currentCleanUser = (currentUser?.username || "").trim().toLowerCase();

  mentionMatches.forEach(tag => {
    const rawTag = tag.replace("@", "").trim().toLowerCase();
    if (!rawTag) return;

    // 1. Try to find matching user by username or name in local list
    const matched = users.find(u => 
      (u.username || "").toLowerCase() === rawTag || 
      (u.name || "").toLowerCase().replace(/\s+/g, "") === rawTag ||
      (u.name || "").toLowerCase().includes(rawTag)
    );

    // 2. Resolve target recipient: prefer matched account username, or fallback to raw tag directly
    const targetUsername = matched ? (matched.username || "").toLowerCase() : rawTag;

    // 3. Prevent self-mentions and duplicate alerts
    if (targetUsername && targetUsername !== currentCleanUser && !notifiedUsernames.has(targetUsername)) {
      notifiedUsernames.add(targetUsername);
      addNotification({
        recipientUsername: targetUsername,
        senderName: currentUser?.name || currentUser?.username || "Team Member",
        senderUsername: currentUser?.username || "user",
        type: "mention",
        message: commentText,
        targetType,
        targetId,
        targetTitle,
        targetTab
      });
    }
  });

  return Array.from(notifiedUsernames);
};

