import { 
  INITIAL_USERS, 
  INITIAL_CUSTOMERS, 
  INITIAL_STOCK_OFFERS, 
  INITIAL_SOCIAL_POSTS, 
  INITIAL_MEDIA_ASSETS, 
  INITIAL_TASKS 
} from "../data/mockData";
import { addToSyncQueue, getSupabase } from "./supabaseClient";

const KEYS = {
  USERS: "minztech_users",
  CUSTOMERS: "minztech_customers",
  STOCK_OFFERS: "minztech_stock_offers",
  SOCIAL_POSTS: "minztech_social_posts",
  MEDIA_ASSETS: "minztech_media_assets",
  TASKS: "minztech_tasks"
};

// Generic safe loader
const load = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error(`Error loading ${key}`, e);
    return fallback;
  }
};

const save = (key, data) => {
  localStorage.setItem(key, JSON.stringify(data));
};

// ================= USERS =================
export const getUsers = () => load(KEYS.USERS, INITIAL_USERS);
export const saveUser = async (user) => {
  const users = getUsers();
  const index = users.findIndex((u) => u.id === user.id || u.username.toLowerCase() === user.username.toLowerCase());
  let updated;
  if (index >= 0) {
    users[index] = { ...users[index], ...user, updated_at: new Date().toISOString() };
    updated = users[index];
  } else {
    updated = {
      id: user.id || `usr_${Date.now()}`,
      ...user,
      created_at: new Date().toISOString()
    };
    users.push(updated);
  }
  save(KEYS.USERS, users);
  addToSyncQueue("refurb_users", "upsert", updated);
  
  // Try immediate sync to Supabase
  const supabase = getSupabase();
  if (supabase) {
    supabase.from("refurb_users").upsert(updated).catch(console.error);
  }
  return updated;
};

export const deleteUser = async (userId) => {
  const users = getUsers().filter((u) => u.id !== userId);
  save(KEYS.USERS, users);
  addToSyncQueue("refurb_users", "delete", { id: userId });
  const supabase = getSupabase();
  if (supabase) {
    supabase.from("refurb_users").delete().eq("id", userId).catch(console.error);
  }
};

// ================= CUSTOMERS =================
export const getCustomers = () => load(KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
export const saveCustomer = (customer) => {
  const list = getCustomers();
  const idx = list.findIndex((c) => c.id === customer.id);
  let updated;
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...customer, updated_at: new Date().toISOString() };
    updated = list[idx];
  } else {
    updated = {
      id: customer.id || `cust_${Date.now()}`,
      ...customer,
      created_at: new Date().toISOString()
    };
    list.unshift(updated);
  }
  save(KEYS.CUSTOMERS, list);
  addToSyncQueue("refurb_customers", "upsert", updated);
  const supabase = getSupabase();
  if (supabase) {
    supabase.from("refurb_customers").upsert(updated).catch(console.error);
  }
  return updated;
};

export const deleteCustomer = (id) => {
  const list = getCustomers().filter((c) => c.id !== id);
  save(KEYS.CUSTOMERS, list);
  addToSyncQueue("refurb_customers", "delete", { id });
  const supabase = getSupabase();
  if (supabase) {
    supabase.from("refurb_customers").delete().eq("id", id).catch(console.error);
  }
};

// Bulk Import Customers (e.g. CSV or JSON list)
export const bulkImportCustomers = (newCustomers) => {
  const existing = getCustomers();
  const merged = [...newCustomers, ...existing];
  save(KEYS.CUSTOMERS, merged);
  newCustomers.forEach((c) => {
    addToSyncQueue("refurb_customers", "upsert", c);
  });
  const supabase = getSupabase();
  if (supabase) {
    supabase.from("refurb_customers").upsert(newCustomers).catch(console.error);
  }
  return merged;
};

// Bulk Update Customers
export const bulkUpdateCustomers = (customerIds, updates) => {
  const idSet = new Set(customerIds);
  const list = getCustomers();
  const updatedRecords = [];
  const updatedList = list.map((c) => {
    if (idSet.has(c.id)) {
      const updated = { 
        ...c, 
        ...updates, 
        updated_at: new Date().toISOString() 
      };
      updatedRecords.push(updated);
      addToSyncQueue("refurb_customers", "upsert", updated);
      return updated;
    }
    return c;
  });
  save(KEYS.CUSTOMERS, updatedList);
  const supabase = getSupabase();
  if (supabase && updatedRecords.length > 0) {
    supabase.from("refurb_customers").upsert(updatedRecords).catch(console.error);
  }
  return updatedList;
};

// Bulk Delete Customers
export const bulkDeleteCustomers = (customerIds) => {
  const idSet = new Set(customerIds);
  const list = getCustomers().filter((c) => !idSet.has(c.id));
  save(KEYS.CUSTOMERS, list);
  customerIds.forEach((id) => {
    addToSyncQueue("refurb_customers", "delete", { id });
  });
  const supabase = getSupabase();
  if (supabase && customerIds.length > 0) {
    supabase.from("refurb_customers").delete().in("id", customerIds).catch(console.error);
  }
  return list;
};

// ================= CUSTOM BRANDS =================
const CUSTOM_BRANDS_KEY = "minztech_custom_brands";
export const getCustomBrands = () => {
  try {
    const raw = localStorage.getItem(CUSTOM_BRANDS_KEY);
    return raw ? JSON.parse(raw) : ["Apple", "Asus", "Acer", "Microsoft"];
  } catch (e) {
    return ["Apple", "Asus", "Acer", "Microsoft"];
  }
};

export const saveCustomBrand = (brandName) => {
  if (!brandName || !brandName.trim()) return getCustomBrands();
  const trimmed = brandName.trim();
  const list = getCustomBrands();
  if (!list.some(b => b.toLowerCase() === trimmed.toLowerCase())) {
    const updated = [...list, trimmed];
    localStorage.setItem(CUSTOM_BRANDS_KEY, JSON.stringify(updated));
    return updated;
  }
  return list;
};

export const deleteCustomBrand = (brandName) => {
  const list = getCustomBrands().filter(b => b.toLowerCase() !== brandName.toLowerCase());
  localStorage.setItem(CUSTOM_BRANDS_KEY, JSON.stringify(list));
  return list;
};


// ================= STOCK OFFERS =================
export const getStockOffers = () => load(KEYS.STOCK_OFFERS, INITIAL_STOCK_OFFERS);
export const saveStockOffer = (offer) => {
  const list = getStockOffers();
  const idx = list.findIndex((o) => o.id === offer.id);
  let updated;
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...offer };
    updated = list[idx];
  } else {
    updated = {
      id: offer.id || `stk_${Date.now()}`,
      ...offer,
      created_at: new Date().toISOString()
    };
    list.unshift(updated);
  }
  save(KEYS.STOCK_OFFERS, list);
  addToSyncQueue("refurb_stock_offers", "upsert", updated);
  const supabase = getSupabase();
  if (supabase) {
    supabase.from("refurb_stock_offers").upsert(updated).catch(console.error);
  }
  return updated;
};

export const deleteStockOffer = (id) => {
  const list = getStockOffers().filter((o) => o.id !== id);
  save(KEYS.STOCK_OFFERS, list);
  addToSyncQueue("refurb_stock_offers", "delete", { id });
  const supabase = getSupabase();
  if (supabase) {
    supabase.from("refurb_stock_offers").delete().eq("id", id).catch(console.error);
  }
};

// ================= SOCIAL POSTS =================
export const getSocialPosts = () => load(KEYS.SOCIAL_POSTS, INITIAL_SOCIAL_POSTS);
export const saveSocialPost = (post) => {
  const list = getSocialPosts();
  const idx = list.findIndex((p) => p.id === post.id);
  let updated;
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...post };
    updated = list[idx];
  } else {
    updated = {
      id: post.id || `post_${Date.now()}`,
      ...post,
      created_at: new Date().toISOString()
    };
    list.unshift(updated);
  }
  save(KEYS.SOCIAL_POSTS, list);
  addToSyncQueue("refurb_social_posts", "upsert", updated);
  const supabase = getSupabase();
  if (supabase) {
    supabase.from("refurb_social_posts").upsert(updated).catch(console.error);
  }
  return updated;
};

export const deleteSocialPost = (id) => {
  const list = getSocialPosts().filter((p) => p.id !== id);
  save(KEYS.SOCIAL_POSTS, list);
  addToSyncQueue("refurb_social_posts", "delete", { id });
  const supabase = getSupabase();
  if (supabase) {
    supabase.from("refurb_social_posts").delete().eq("id", id).catch(console.error);
  }
};

// ================= MEDIA ASSETS =================
export const getMediaAssets = () => load(KEYS.MEDIA_ASSETS, INITIAL_MEDIA_ASSETS);
export const saveMediaAsset = (asset) => {
  const list = getMediaAssets();
  const idx = list.findIndex((m) => m.id === asset.id);
  let updated;
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...asset };
    updated = list[idx];
  } else {
    updated = {
      id: asset.id || `med_${Date.now()}`,
      ...asset,
      uploadedDate: new Date().toISOString().split("T")[0]
    };
    list.unshift(updated);
  }
  save(KEYS.MEDIA_ASSETS, list);
  addToSyncQueue("refurb_media_assets", "upsert", updated);
  const supabase = getSupabase();
  if (supabase) {
    supabase.from("refurb_media_assets").upsert(updated).catch(console.error);
  }
  return updated;
};

export const deleteMediaAsset = (id) => {
  const list = getMediaAssets().filter((m) => m.id !== id);
  save(KEYS.MEDIA_ASSETS, list);
  addToSyncQueue("refurb_media_assets", "delete", { id });
  const supabase = getSupabase();
  if (supabase) {
    supabase.from("refurb_media_assets").delete().eq("id", id).catch(console.error);
  }
};

// Helper: Google Drive API Key storage
const GDRIVE_API_KEY_STORAGE = "minztech_gdrive_api_key";
export const getGoogleDriveApiKey = () => localStorage.getItem(GDRIVE_API_KEY_STORAGE) || import.meta.env.VITE_GOOGLE_DRIVE_API_KEY || "";
export const saveGoogleDriveApiKey = (key) => {
  if (key) {
    localStorage.setItem(GDRIVE_API_KEY_STORAGE, key.trim());
  } else {
    localStorage.removeItem(GDRIVE_API_KEY_STORAGE);
  }
};

// Clear media assets
export const clearMediaAssets = () => {
  save(KEYS.MEDIA_ASSETS, []);
};

// Helper: Convert Google Drive Link to preview & direct download URLs
export const parseGoogleDriveUrl = (url) => {
  if (!url) return { isFolder: false, previewUrl: "", downloadUrl: "", driveId: "" };
  const trimmed = url.trim();
  
  // Detect Google Drive Folders:
  // e.g. https://drive.google.com/drive/folders/FOLDER_ID or https://drive.google.com/drive/u/0/folders/FOLDER_ID
  const folderMatch = trimmed.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (folderMatch) {
    const folderId = folderMatch[1];
    return {
      isFolder: true,
      driveId: folderId,
      previewUrl: `https://drive.google.com/embeddedfolderview?id=${folderId}#grid`,
      folderEmbedUrl: `https://drive.google.com/embeddedfolderview?id=${folderId}#grid`,
      openUrl: `https://drive.google.com/drive/folders/${folderId}`,
      downloadUrl: `https://drive.google.com/drive/folders/${folderId}`,
      thumbnailUrl: `https://drive.google.com/thumbnail?id=${folderId}&sz=w800`
    };
  }

  // Extract file ID from drive links
  // Format 1: drive.google.com/file/d/FILE_ID/view
  // Format 2: drive.google.com/open?id=FILE_ID
  // Format 3: drive.google.com/uc?id=FILE_ID
  // Format 4: lh3.googleusercontent.com/d/FILE_ID
  let id = "";
  const match1 = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  const match2 = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  const match3 = trimmed.match(/googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/);
  
  if (match1) id = match1[1];
  else if (match2) id = match2[1];
  else if (match3) id = match3[1];
  
  if (id) {
    return {
      isFolder: false,
      driveId: id,
      previewUrl: `https://drive.google.com/file/d/${id}/preview`,
      thumbnailUrl: `https://drive.google.com/thumbnail?id=${id}&sz=w1000`,
      downloadUrl: `https://drive.google.com/uc?export=download&id=${id}`,
      openUrl: `https://drive.google.com/file/d/${id}/view?usp=sharing`
    };
  }
  
  // Direct image/video URL
  return {
    isFolder: false,
    driveId: "",
    previewUrl: trimmed,
    thumbnailUrl: trimmed,
    downloadUrl: trimmed,
    openUrl: trimmed
  };
};

// Helper: Extract all Google Drive file IDs and links from any multi-line paste or text block
export const extractDriveLinksFromText = (text) => {
  if (!text) return [];
  const results = [];
  const seenIds = new Set();

  // Match /file/d/{id}
  const fileRegex = /\/file\/d\/([a-zA-Z0-9_-]+)/g;
  let match;
  while ((match = fileRegex.exec(text)) !== null) {
    const id = match[1];
    if (!seenIds.has(id)) {
      seenIds.add(id);
      results.push({
        driveId: id,
        driveUrl: `https://drive.google.com/file/d/${id}/view`,
        previewUrl: `https://drive.google.com/file/d/${id}/preview`,
        thumbnailUrl: `https://drive.google.com/thumbnail?id=${id}&sz=w1000`,
        downloadUrl: `https://drive.google.com/uc?export=download&id=${id}`
      });
    }
  }

  // Match ?id={id} or &id={id}
  const idRegex = /[?&]id=([a-zA-Z0-9_-]+)/g;
  while ((match = idRegex.exec(text)) !== null) {
    const id = match[1];
    if (!seenIds.has(id)) {
      seenIds.add(id);
      results.push({
        driveId: id,
        driveUrl: `https://drive.google.com/file/d/${id}/view`,
        previewUrl: `https://drive.google.com/file/d/${id}/preview`,
        thumbnailUrl: `https://drive.google.com/thumbnail?id=${id}&sz=w1000`,
        downloadUrl: `https://drive.google.com/uc?export=download&id=${id}`
      });
    }
  }

  // Also check lines for direct image or video URLs
  const lines = text.split(/[\r\n,;\s]+/).map(l => l.trim()).filter(Boolean);
  lines.forEach(line => {
    if ((line.startsWith("http://") || line.startsWith("https://")) && !line.includes("drive.google.com")) {
      const isMedia = /\.(jpg|jpeg|png|webp|gif|mp4|webm|mov)(\?.*)?$/i.test(line);
      if (isMedia && !seenIds.has(line)) {
        seenIds.add(line);
        results.push({
          driveId: "",
          driveUrl: line,
          previewUrl: line,
          thumbnailUrl: line,
          downloadUrl: line,
          isDirectMedia: true
        });
      }
    }
  });

  return results;
};

// Probe Google Drive image accessibility via Image object in browser
export const checkDriveFileAccess = (driveId) => {
  return new Promise((resolve) => {
    if (!driveId) return resolve({ accessible: true });
    const img = new Image();
    img.referrerPolicy = "no-referrer";
    const timer = setTimeout(() => {
      resolve({ accessible: false, reason: "timeout" });
    }, 4500);

    img.onload = () => {
      clearTimeout(timer);
      resolve({ accessible: true });
    };

    img.onerror = () => {
      clearTimeout(timer);
      resolve({ accessible: false, reason: "restricted" });
    };

    img.src = `https://drive.google.com/thumbnail?id=${driveId}&sz=w400`;
  });
};

// Fetch files from Google Drive folder via Google Drive REST API v3
export const fetchGoogleDriveFolderFiles = async (folderId, apiKey) => {
  if (!apiKey) {
    return { success: false, error: "NO_API_KEY", message: "Google Drive API Key is required to scan folder directly." };
  }

  try {
    const query = encodeURIComponent(`'${folderId}' in parents and trashed = false`);
    const fields = encodeURIComponent("files(id,name,mimeType,size,thumbnailLink,webContentLink,webViewLink)");
    const endpoint = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=${fields}&pageSize=100&key=${apiKey.trim()}`;
    
    const res = await fetch(endpoint);
    const data = await res.json();

    if (!res.ok) {
      const isRestricted = res.status === 403 || res.status === 404 || 
        (data.error && data.error.errors && data.error.errors.some(e => e.reason === "notFound" || e.reason === "forbidden"));
      return { 
        success: false, 
        restricted: isRestricted, 
        error: data.error?.message || `HTTP ${res.status}`, 
        status: res.status 
      };
    }

    const files = (data.files || []).filter(f => {
      const mime = (f.mimeType || "").toLowerCase();
      return mime.startsWith("image/") || mime.startsWith("video/") || mime === "application/octet-stream";
    });

    return { success: true, files };
  } catch (err) {
    return { success: false, error: err.message, restricted: false };
  }
};

// ================= TASKS =================
export const getTasks = () => load(KEYS.TASKS, INITIAL_TASKS);
export const saveTask = (task) => {
  const list = getTasks();
  const idx = list.findIndex((t) => t.id === task.id);
  let updated;
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...task };
    updated = list[idx];
  } else {
    updated = {
      id: task.id || `tsk_${Date.now()}`,
      ...task,
      created_at: new Date().toISOString()
    };
    list.unshift(updated);
  }
  save(KEYS.TASKS, list);
  addToSyncQueue("refurb_tasks", "upsert", updated);
  const supabase = getSupabase();
  if (supabase) {
    supabase.from("refurb_tasks").upsert(updated).catch(console.error);
  }
  return updated;
};

export const deleteTask = (id) => {
  const list = getTasks().filter((t) => t.id !== id);
  save(KEYS.TASKS, list);
  addToSyncQueue("refurb_tasks", "delete", { id });
  const supabase = getSupabase();
  if (supabase) {
    supabase.from("refurb_tasks").delete().eq("id", id).catch(console.error);
  }
};

// ================= BACKUP & RESTORE =================
export const exportFullBackup = () => {
  return {
    version: "1.0",
    exportDate: new Date().toISOString(),
    organization: "MiNZTECH - Microsoft Authorized Refurbisher",
    users: getUsers(),
    customers: getCustomers(),
    stockOffers: getStockOffers(),
    socialPosts: getSocialPosts(),
    mediaAssets: getMediaAssets(),
    tasks: getTasks()
  };
};

export const importFullBackup = (backupJson) => {
  if (backupJson.users) save(KEYS.USERS, backupJson.users);
  if (backupJson.customers) save(KEYS.CUSTOMERS, backupJson.customers);
  if (backupJson.stockOffers) save(KEYS.STOCK_OFFERS, backupJson.stockOffers);
  if (backupJson.socialPosts) save(KEYS.SOCIAL_POSTS, backupJson.socialPosts);
  if (backupJson.mediaAssets) save(KEYS.MEDIA_ASSETS, backupJson.mediaAssets);
  if (backupJson.tasks) save(KEYS.TASKS, backupJson.tasks);
  return true;
};
