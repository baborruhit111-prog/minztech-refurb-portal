// Cross-Platform Notifications Service (Desktop PC & Mobile Android/PWA)

export const isNotificationSupported = () => {
  return typeof window !== "undefined" && ("Notification" in window || "serviceWorker" in navigator);
};

export const getNotificationPermission = () => {
  if (!isNotificationSupported()) return "unsupported";
  return typeof Notification !== "undefined" ? Notification.permission : "default";
};

// Register Service Worker for Mobile Notifications
export const registerServiceWorker = async () => {
  if (typeof window !== "undefined" && "serviceWorker" in navigator) {
    try {
      const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      return reg;
    } catch (err) {
      console.warn("ServiceWorker registration note:", err);
      return null;
    }
  }
  return null;
};

export const requestNotificationPermission = async () => {
  if (!isNotificationSupported()) {
    return { success: false, status: "unsupported", error: "Device does not support push notifications" };
  }

  try {
    // Ensure service worker is registered
    await registerServiceWorker();

    let permission = "default";
    if (typeof Notification !== "undefined" && Notification.requestPermission) {
      permission = await Notification.requestPermission();
    }

    if (permission === "granted") {
      // Show confirmation alert on mobile/desktop
      sendDesktopNotification(
        "MiNZTECH Portal Notifications Active",
        "You will now receive instant alerts on your phone whenever a team member mentions you (@).",
        "/brand/logo-white.png"
      );
      return { success: true, status: "granted" };
    }
    return { success: false, status: permission };
  } catch (err) {
    console.error("Error requesting notification permission", err);
    return { success: false, status: "error", error: err.message };
  }
};

export const sendDesktopNotification = async (title, body, icon = "/brand/logo-white.png", onClick, data = {}) => {
  if (!isNotificationSupported()) return false;

  const perm = getNotificationPermission();
  if (perm !== "granted") return false;

  const notifOptions = {
    body,
    icon,
    badge: icon,
    vibrate: [200, 100, 200, 100, 200],
    tag: `minztech_${Date.now()}`,
    renotify: true,
    requireInteraction: true,
    data: {
      url: window.location.href,
      ...data
    }
  };

  // 1. Mobile Android & PWA: Use ServiceWorkerRegistration.showNotification()
  // (Android Chrome throws 'Illegal constructor' if new Notification() is used directly)
  if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
    try {
      let reg = await navigator.serviceWorker.getRegistration();
      if (!reg) {
        reg = await registerServiceWorker();
      }
      if (reg && reg.showNotification) {
        await reg.showNotification(title, notifOptions);
        return true;
      }
    } catch (swErr) {
      console.warn("Service Worker notification note:", swErr);
    }
  }

  // 2. Desktop Browser Fallback
  if (typeof Notification !== "undefined") {
    try {
      const notif = new Notification(title, notifOptions);
      if (onClick) {
        notif.onclick = () => {
          window.focus();
          onClick();
          notif.close();
        };
      }
      return true;
    } catch (err) {
      console.warn("Desktop notification fallback notice:", err);
    }
  }

  return false;
};

