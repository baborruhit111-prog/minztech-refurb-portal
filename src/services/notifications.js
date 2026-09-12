import { getUsers } from "./storage";
import { addToSyncQueue, safeSupabaseExec } from "./supabaseClient";
import { sendDesktopNotification } from "./desktopNotifications";
import { triggerNotificationAlert } from "./audioHelper";

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

export const getNotifications = (username) => {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_KEY);
    const all = raw ? JSON.parse(raw) : INITIAL_NOTIFICATIONS;
    if (!username) return all;
    // Return notifications directed to this user, or if super admin mt206.ruhit also allow seeing all
    return all.filter(n => !n.recipientUsername || n.recipientUsername.toLowerCase() === username.toLowerCase());
  } catch (e) {
    return INITIAL_NOTIFICATIONS;
  }
};

export const saveNotificationsList = (list) => {
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(list));
};

export const addNotification = (notif) => {
  const all = getNotifications();
  const newNotif = {
    id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    read: false,
    createdAt: new Date().toISOString(),
    ...notif
  };

  const updated = [newNotif, ...all];
  saveNotificationsList(updated);
  addToSyncQueue("refurb_notifications", "upsert", newNotif);

  // 1. Trigger audible chime and mobile vibration immediately
  triggerNotificationAlert();

  // 2. Dispatch interactive In-App notification event for phones & active screens
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("minztech_in_app_notification", { detail: newNotif }));
  }

  // 3. Trigger browser desktop notification if permitted
  sendDesktopNotification(
    `MiNZTECH Mention from ${notif.senderName || "Team Member"}`,
    notif.message,
    "/brand/logo-white.png"
  );

  safeSupabaseExec((sb) => sb.from("refurb_notifications").upsert(newNotif));

  return newNotif;
};

export const markNotificationAsRead = (id) => {
  const all = getNotifications();
  const updated = all.map(n => n.id === id ? { ...n, read: true } : n);
  saveNotificationsList(updated);
};

export const markAllNotificationsAsRead = (username) => {
  const all = getNotifications();
  const updated = all.map(n => {
    if (!username || n.recipientUsername === username) {
      return { ...n, read: true };
    }
    return n;
  });
  saveNotificationsList(updated);
};

export const clearNotifications = (username) => {
  const all = getNotifications();
  const remaining = username ? all.filter(n => n.recipientUsername !== username) : [];
  saveNotificationsList(remaining);
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

  const users = getUsers();
  const mentionMatches = commentText.match(/@([a-zA-Z0-9_.-]+)/g);
  if (!mentionMatches) return [];

  const notifiedUsernames = new Set();

  mentionMatches.forEach(tag => {
    const rawTag = tag.replace("@", "").toLowerCase();
    // Find matching user by username or name
    const matched = users.find(u => 
      u.username.toLowerCase() === rawTag || 
      u.name.toLowerCase().replace(/\s+/g, "") === rawTag ||
      u.name.toLowerCase().includes(rawTag)
    );

    if (matched && matched.username !== currentUser?.username && !notifiedUsernames.has(matched.username)) {
      notifiedUsernames.add(matched.username);
      addNotification({
        recipientUsername: matched.username,
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
