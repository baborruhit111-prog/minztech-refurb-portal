// Desktop HTML5 Notifications Service

export const isNotificationSupported = () => {
  return typeof window !== "undefined" && "Notification" in window;
};

export const getNotificationPermission = () => {
  if (!isNotificationSupported()) return "unsupported";
  return Notification.permission; // 'default' | 'granted' | 'denied'
};

export const requestNotificationPermission = async () => {
  if (!isNotificationSupported()) {
    return { success: false, status: "unsupported", error: "Browser does not support desktop notifications" };
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      // Show confirmation test notification
      sendDesktopNotification(
        "MiNZTECH Portal Notifications Enabled",
        "You will now receive desktop alerts when a team member mentions you (@) or assigns a task.",
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

export const sendDesktopNotification = (title, body, icon = "/brand/logo-white.png", onClick) => {
  if (!isNotificationSupported() || Notification.permission !== "granted") {
    return false;
  }

  try {
    const notif = new Notification(title, {
      body,
      icon,
      badge: icon,
      silent: false,
    });

    if (onClick) {
      notif.onclick = () => {
        window.focus();
        onClick();
        notif.close();
      };
    }

    return true;
  } catch (err) {
    console.warn("Could not trigger desktop notification", err);
    return false;
  }
};
