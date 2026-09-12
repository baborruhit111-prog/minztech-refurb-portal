import React, { useState, useEffect } from "react";
import { 
  FolderGit2, 
  Plus, 
  Search, 
  Image as ImageIcon, 
  Video, 
  Download, 
  ExternalLink, 
  Copy, 
  CheckCircle2, 
  Trash2, 
  Play, 
  FolderPlus, 
  Folder, 
  Eye, 
  Sparkles, 
  MessageSquare, 
  X, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight, 
  ShieldAlert, 
  Lock, 
  Key, 
  AlertTriangle, 
  RefreshCw,
  Calendar
} from "lucide-react";
import { 
  getMediaAssets, 
  saveMediaAsset, 
  deleteMediaAsset, 
  clearMediaAssets,
  parseGoogleDriveUrl, 
  extractDriveLinksFromText,
  checkDriveFileAccess,
  fetchGoogleDriveFolderFiles,
  getGoogleDriveApiKey,
  saveGoogleDriveApiKey
} from "../services/storage";
import CommentsThread from "./CommentsThread";

export default function MediaGallery() {
  const [assets, setAssets] = useState(getMediaAssets());
  const [typeFilter, setTypeFilter] = useState("all"); // 'all' | 'image' | 'video'
  const [brandFilter, setBrandFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modals & comments
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState(null);
  const [lightboxZoom, setLightboxZoom] = useState(1);
  const [expandedComments, setExpandedComments] = useState({}); // { [assetId]: boolean }
  const [restrictedAssets, setRestrictedAssets] = useState({}); // { [assetId]: boolean }

  // Restriction Warning Popup Modal
  const [restrictedWarning, setRestrictedWarning] = useState(null); // null | { title, url, reason, count }

  // API Key state
  const [apiKey, setApiKey] = useState(getGoogleDriveApiKey());
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);

  // New Asset State
  const [newAsset, setNewAsset] = useState({
    id: "",
    title: "",
    brand: "HP",
    type: "image",
    driveUrl: "",
    aspectRatio: "16:9 Landscape",
    market: "USA & LATAM",
    description: "",
    comments: []
  });

  // Folder / Multi-Link State
  const [newFolder, setNewFolder] = useState({
    title: "",
    folderUrl: "",
    brand: "HP",
    market: "USA & LATAM",
    batchLinksText: "",
    aspectRatio: "16:9 Landscape",
    isScanning: false
  });

  const [toastMessage, setToastMessage] = useState("");

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  const refreshList = () => {
    setAssets(getMediaAssets());
  };

  const toggleComments = (assetId) => {
    setExpandedComments(prev => ({ ...prev, [assetId]: !prev[assetId] }));
  };

  // Keyboard navigation for Lightbox
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!previewItem) return;
      if (e.key === "Escape") {
        setPreviewItem(null);
        setLightboxZoom(1);
      } else if (e.key === "ArrowLeft") {
        navigateLightbox(-1);
      } else if (e.key === "ArrowRight") {
        navigateLightbox(1);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [previewItem, assets, typeFilter, searchQuery]);

  const filteredAssets = assets.filter(asset => {
    if (asset.type === "folder") return false; // Direct media cards
    if (typeFilter !== "all" && asset.type !== typeFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = asset.title?.toLowerCase().includes(q);
      const matchDesc = asset.description?.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc) return false;
    }
    return true;
  });

  const navigateLightbox = (direction) => {
    if (!previewItem || filteredAssets.length === 0) return;
    const currentIndex = filteredAssets.findIndex(a => a.id === previewItem.id);
    if (currentIndex === -1) return;
    let nextIndex = currentIndex + direction;
    if (nextIndex < 0) nextIndex = filteredAssets.length - 1;
    if (nextIndex >= filteredAssets.length) nextIndex = 0;
    setPreviewItem(filteredAssets[nextIndex]);
    setLightboxZoom(1);
  };

  const handleOpenAddAsset = () => {
    setNewAsset({
      id: "",
      title: "",
      brand: "HP",
      type: "image",
      driveUrl: "",
      aspectRatio: "16:9 Landscape",
      market: "USA & LATAM",
      description: "",
      comments: []
    });
    setIsAssetModalOpen(true);
  };

  const handleOpenAddFolder = () => {
    setNewFolder({
      title: "",
      folderUrl: "",
      brand: "HP",
      market: "USA & LATAM",
      batchLinksText: "",
      aspectRatio: "16:9 Landscape",
      isScanning: false
    });
    setIsFolderModalOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm("Remove this media card? Changes will sync online.")) {
      deleteMediaAsset(id);
      refreshList();
      showToast("Media item removed.");
    }
  };

  const handleClearDemoAssets = () => {
    if (window.confirm("Do you want to clear all media items to start fresh with your real Google Drive files?")) {
      clearMediaAssets();
      refreshList();
      showToast("Media library reset. You can now add your Google Drive files!");
    }
  };

  const handleSaveAsset = async (e) => {
    e.preventDefault();
    if (!newAsset.title || !newAsset.driveUrl) {
      alert("Please provide both a title and Google Drive URL.");
      return;
    }
    
    const parsed = parseGoogleDriveUrl(newAsset.driveUrl);
    
    // Check if the link might be restricted if it has a driveId
    if (parsed.driveId) {
      const probe = await checkDriveFileAccess(parsed.driveId);
      if (!probe.accessible) {
        setRestrictedWarning({
          title: newAsset.title,
          url: newAsset.driveUrl,
          reason: "This individual file appears to have Google Drive access set to Restricted or Private.",
          count: 1
        });
      }
    }

    const assetToSave = {
      ...newAsset,
      driveId: parsed.driveId,
      thumbnail: parsed.thumbnailUrl || newAsset.driveUrl,
      previewUrl: parsed.previewUrl || newAsset.driveUrl,
      downloadUrl: parsed.downloadUrl || newAsset.driveUrl,
      fileSize: "Google Drive File",
      comments: []
    };

    saveMediaAsset(assetToSave);
    refreshList();
    setIsAssetModalOpen(false);
    showToast("Media card saved & synced!");
  };

  // Auto-collect all images and videos from Google Drive Folder or Multi-link input
  const handleConnectFolderAndAutoLoad = async (e) => {
    e.preventDefault();
    const rawInput = (newFolder.batchLinksText || newFolder.folderUrl || "").trim();
    if (!rawInput) {
      alert("Please enter a Google Drive folder link or paste file links.");
      return;
    }

    setNewFolder(prev => ({ ...prev, isScanning: true }));

    const brand = newFolder.brand || "HP";
    const baseTitle = newFolder.title || `${brand} Drive Stock Intake`;

    // 1. Check if user pasted multiple links or direct files
    const extractedFiles = extractDriveLinksFromText(rawInput);
    
    // 2. Check if user pasted a Folder URL
    const folderParsed = parseGoogleDriveUrl(newFolder.folderUrl || rawInput);

    if (folderParsed.isFolder && (!extractedFiles.length || extractedFiles.length === 1 && !extractedFiles[0].driveId)) {
      // User entered a Google Drive Folder link
      const folderId = folderParsed.driveId;

      // If Google Drive API Key is provided, fetch all files in the folder directly
      if (apiKey) {
        showToast("Scanning Google Drive folder via API...");
        const result = await fetchGoogleDriveFolderFiles(folderId, apiKey);
        
        if (result.success && result.files && result.files.length > 0) {
          result.files.forEach((file, idx) => {
            const isVid = file.mimeType.toLowerCase().startsWith("video");
            const assetToSave = {
              id: `gdrive_${file.id}`,
              title: file.name || `${baseTitle} #${idx + 1}`,
              brand: brand,
              type: isVid ? "video" : "image",
              driveUrl: `https://drive.google.com/file/d/${file.id}/view?usp=sharing`,
              driveId: file.id,
              thumbnail: `https://drive.google.com/thumbnail?id=${file.id}&sz=w1000`,
              previewUrl: `https://drive.google.com/file/d/${file.id}/preview`,
              downloadUrl: `https://drive.google.com/uc?export=download&id=${file.id}`,
              aspectRatio: isVid ? "9:16 Reels/TikTok" : (newFolder.aspectRatio || "16:9 Landscape"),
              market: newFolder.market,
              description: `Real asset auto-collected from Google Drive folder: ${folderParsed.openUrl}`,
              comments: [],
              folderSource: baseTitle,
              uploadedDate: new Date().toISOString().split("T")[0]
            };
            saveMediaAsset(assetToSave);
          });

          refreshList();
          setIsFolderModalOpen(false);
          setNewFolder(prev => ({ ...prev, isScanning: false }));
          showToast(`Successfully auto-collected ${result.files.length} real files from Google Drive!`);
          return;
        } else if (result.restricted) {
          // Folder is restricted or inaccessible!
          setNewFolder(prev => ({ ...prev, isScanning: false }));
          setRestrictedWarning({
            title: baseTitle,
            url: folderParsed.openUrl,
            reason: "Google Drive reports this folder is Restricted / Private. External apps cannot read folder contents without public access.",
            count: 0
          });
          return;
        }
      }

      // If no API Key or API wasn't configured, we check if the user provided batch links or we guide them
      setNewFolder(prev => ({ ...prev, isScanning: false }));
      setRestrictedWarning({
        title: baseTitle,
        url: folderParsed.openUrl,
        reason: "Google Drive requires folder permissions to be set to 'Anyone with the link' or direct file links to generate individual previews.",
        count: 0
      });
      return;
    }

    // If multi-links or file URLs were extracted
    if (extractedFiles.length > 0) {
      let addedCount = 0;
      let restrictedCount = 0;

      for (let i = 0; i < extractedFiles.length; i++) {
        const item = extractedFiles[i];
        const isVid = item.driveUrl.includes(".mp4") || item.driveUrl.includes(".mov") || item.driveUrl.includes(".webm");
        
        // Fast probe check for drive files
        if (item.driveId) {
          const probe = await checkDriveFileAccess(item.driveId);
          if (!probe.accessible) {
            restrictedCount++;
          }
        }

        const generatedAsset = {
          id: item.driveId ? `gdrive_${item.driveId}` : `med_${Date.now()}_${i}`,
          title: `${baseTitle} - File ${i + 1}`,
          brand: brand,
          type: isVid ? "video" : "image",
          driveUrl: item.driveUrl,
          driveId: item.driveId || "",
          thumbnail: item.thumbnailUrl,
          previewUrl: item.previewUrl,
          downloadUrl: item.downloadUrl,
          aspectRatio: isVid ? "9:16 Reels/TikTok" : (newFolder.aspectRatio || "16:9 Landscape"),
          market: newFolder.market,
          description: `Auto-collected Google Drive media item for ${brand} inventory batch.`,
          comments: [],
          folderSource: baseTitle,
          uploadedDate: new Date().toISOString().split("T")[0]
        };

        saveMediaAsset(generatedAsset);
        addedCount++;
      }

      refreshList();
      setIsFolderModalOpen(false);
      setNewFolder(prev => ({ ...prev, isScanning: false }));

      if (restrictedCount > 0) {
        setRestrictedWarning({
          title: baseTitle,
          url: newFolder.folderUrl || extractedFiles[0].driveUrl,
          reason: `${restrictedCount} of the ${addedCount} Google Drive links appear to have Restricted / Private permissions. Previews may not render until sharing is set to 'Anyone with the link'.`,
          count: restrictedCount
        });
      }

      showToast(`Auto-collected ${addedCount} Google Drive media cards!`);
      return;
    }

    // If single link was pasted in the box
    const singleParsed = parseGoogleDriveUrl(rawInput);
    const generatedAsset = {
      id: singleParsed.driveId ? `gdrive_${singleParsed.driveId}` : `med_${Date.now()}`,
      title: `${baseTitle} - Media File`,
      brand: brand,
      type: "image",
      driveUrl: rawInput,
      driveId: singleParsed.driveId || "",
      thumbnail: singleParsed.thumbnailUrl,
      previewUrl: singleParsed.previewUrl,
      downloadUrl: singleParsed.downloadUrl,
      aspectRatio: newFolder.aspectRatio || "16:9 Landscape",
      market: newFolder.market,
      description: `Google Drive media file for ${brand}.`,
      comments: [],
      folderSource: baseTitle,
      uploadedDate: new Date().toISOString().split("T")[0]
    };

    saveMediaAsset(generatedAsset);
    refreshList();
    setIsFolderModalOpen(false);
    setNewFolder(prev => ({ ...prev, isScanning: false }));
    showToast("Media file collected & added!");
  };

  const handleUpdateComments = (assetId, updatedComments) => {
    const asset = assets.find(a => a.id === assetId);
    if (!asset) return;
    const updated = { ...asset, comments: updatedComments };
    saveMediaAsset(updated);
    refreshList();
    if (previewItem && previewItem.id === assetId) {
      setPreviewItem(updated);
    }
  };

  const handleDownload = (asset) => {
    const parsed = parseGoogleDriveUrl(asset.driveUrl);
    const downloadUrl = parsed.downloadUrl || asset.driveUrl;
    window.open(downloadUrl, "_blank");
    showToast("Opening Google Drive for download!");
  };

  const copyLink = (url) => {
    navigator.clipboard.writeText(url);
    showToast("Link copied to clipboard!");
  };

  const handleImageLoadError = (asset) => {
    setRestrictedAssets(prev => ({ ...prev, [asset.id]: true }));
  };

  const handleSaveApiKey = (e) => {
    e.preventDefault();
    saveGoogleDriveApiKey(apiKey);
    setShowApiKeyInput(false);
    showToast("Google Drive API Key saved!");
  };

  return (
    <div className="space-y-6 pb-12">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-brand-neon text-brand-black px-4 py-2.5 rounded-xl font-bold shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Google Drive Media Gallery</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-brand-surface border border-brand-border text-xs text-brand-neon font-mono">
              Auto-Load Previews
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Connect Google Drive folders to automatically collect and preview laptop photos and videos with high-resolution lightbox and team @mention comments.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Clear Demo Assets button if user wants a clean slate */}
          <button
            onClick={handleClearDemoAssets}
            className="flex items-center gap-1.5 px-3 py-2.5 bg-brand-dark hover:bg-red-500/10 text-gray-400 hover:text-red-400 border border-brand-border text-xs font-semibold rounded-xl transition-all"
            title="Wipe demo assets to start fresh with your real Google Drive files"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Reset / Clear Gallery</span>
          </button>

          {/* Connect Drive Folder Button */}
          <button
            onClick={handleOpenAddFolder}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-brand-surface hover:bg-brand-hover text-brand-neon border border-brand-neon/40 text-xs font-bold rounded-xl shadow-sm transition-all active:scale-95"
          >
            <FolderPlus className="w-4 h-4 text-brand-neon" />
            <span>Connect Drive Folder (Auto-Collect)</span>
          </button>

          {/* Add Single Asset Button */}
          <button
            onClick={handleOpenAddAsset}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-brand-neon hover:bg-brand-lime text-brand-black text-xs font-bold rounded-xl shadow-md transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Single Link</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="bg-brand-surface border border-brand-border rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1 bg-brand-dark p-1 rounded-xl border border-brand-border text-xs">
          <button
            onClick={() => setTypeFilter("all")}
            className={`px-3.5 py-1.5 rounded-lg transition-all ${
              typeFilter === "all" ? "bg-brand-neon text-brand-black font-bold" : "text-gray-400 hover:text-white"
            }`}
          >
            All Media ({filteredAssets.length})
          </button>
          <button
            onClick={() => setTypeFilter("image")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all ${
              typeFilter === "image" ? "bg-brand-neon text-brand-black font-bold" : "text-gray-400 hover:text-white"
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Photos</span>
          </button>
          <button
            onClick={() => setTypeFilter("video")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all ${
              typeFilter === "video" ? "bg-brand-neon text-brand-black font-bold" : "text-gray-400 hover:text-white"
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>Videos</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search photos and videos..."
              className="w-full pl-9 pr-3 py-1.5 bg-brand-dark border border-brand-border rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-brand-neon"
            />
          </div>
        </div>
      </div>

      {/* Media Cards Grid - Styled EXACTLY like the attached screenshot */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5 sm:gap-6 w-full">
        {filteredAssets.length === 0 ? (
          <div className="col-span-full bg-brand-surface border border-brand-border rounded-2xl p-12 text-center text-gray-400">
            <FolderGit2 className="w-12 h-12 mx-auto text-gray-600 mb-3" />
            <h3 className="text-base font-semibold text-white">No media items in gallery</h3>
            <p className="text-xs mt-1">Connect your Google Drive folder or paste links above to automatically populate preview cards.</p>
            <div className="mt-4 flex justify-center gap-3">
              <button
                onClick={handleOpenAddFolder}
                className="px-4 py-2 bg-brand-neon text-brand-black text-xs font-bold rounded-xl hover:bg-brand-lime"
              >
                Connect Google Drive Folder
              </button>
            </div>
          </div>
        ) : (
          filteredAssets.map((asset) => {
            const isCommentsOpen = expandedComments[asset.id];
            const commentsCount = (asset.comments || []).length;
            const isRestricted = restrictedAssets[asset.id];

            return (
              <div 
                key={asset.id} 
                className="bg-[#1f1f1f] border border-brand-border/80 hover:border-brand-neon/50 rounded-2xl overflow-hidden shadow-xl flex flex-col justify-between group transition-all"
              >
                <div>
                  {/* Image / Video Thumbnail Section with Screenshot Badges */}
                  <div 
                    onClick={() => {
                      setPreviewItem(asset);
                      setLightboxZoom(1);
                    }}
                    className="relative h-52 bg-brand-black overflow-hidden flex items-center justify-center cursor-pointer group/img"
                  >
                    {isRestricted ? (
                      <div 
                        onClick={(e) => {
                          e.stopPropagation();
                          setRestrictedWarning({
                            title: asset.title,
                            url: asset.driveUrl,
                            reason: "This Google Drive file is set to Restricted. Change sharing to 'Anyone with the link can view' to display previews.",
                            count: 1
                          });
                        }}
                        className="w-full h-full p-4 flex flex-col items-center justify-center bg-red-950/20 text-center hover:bg-red-950/30 transition-colors"
                      >
                        <Lock className="w-8 h-8 text-amber-400 mb-2" />
                        <span className="text-xs font-bold text-amber-300">Access Restricted</span>
                        <span className="text-[10px] text-gray-400 mt-1 max-w-[200px]">
                          Set Drive sharing to "Anyone with link can view"
                        </span>
                        <span className="mt-2 text-[10px] px-2 py-0.5 rounded bg-brand-surface text-brand-neon font-semibold border border-brand-border">
                          Click for fix steps ↗
                        </span>
                      </div>
                    ) : asset.type === "video" ? (
                      <div className="w-full h-full relative">
                        <img 
                          src={asset.thumbnail || "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=600&auto=format&fit=crop&q=80"} 
                          alt={asset.title} 
                          onError={() => handleImageLoadError(asset)}
                          className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300 opacity-90"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover/img:bg-black/20 transition-colors">
                          <div className="w-12 h-12 rounded-full bg-brand-neon text-brand-black flex items-center justify-center shadow-lg group-hover/img:scale-110 transition-transform">
                            <Play className="w-6 h-6 ml-0.5 fill-current" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <img 
                        src={asset.thumbnail || asset.driveUrl} 
                        alt={asset.title} 
                        onError={() => handleImageLoadError(asset)}
                        className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300"
                      />
                    )}

                    {/* Date Added Badge (Removed HP brand and aspect ratio per user screenshot) */}
                    <div className="absolute top-3 left-3 flex items-center gap-2 pointer-events-none">
                      <span className="px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur-md text-[11px] text-gray-200 font-mono flex items-center gap-1.5 border border-white/10 shadow">
                        <Calendar className="w-3 h-3 text-brand-neon" />
                        <span>Added: {asset.uploadedDate || "Recent"}</span>
                      </span>
                    </div>

                    {/* Click to open big indicator on hover */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity pointer-events-none">
                      <span className="px-3 py-1.5 rounded-xl bg-black/80 backdrop-blur-md text-xs font-bold text-white flex items-center gap-1.5 border border-white/20">
                        <Eye className="w-3.5 h-3.5 text-brand-neon" />
                        <span>Click to Open Big</span>
                      </span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(asset.id);
                      }}
                      className="absolute top-3 right-3 p-2 rounded-xl bg-black/80 backdrop-blur-md hover:bg-red-500/80 text-gray-300 hover:text-white transition-colors z-10"
                      title="Remove asset"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Card Content (Exact matching screenshot typography) */}
                  <div className="p-4 space-y-2">
                    <h3 
                      onClick={() => {
                        setPreviewItem(asset);
                        setLightboxZoom(1);
                      }}
                      className="text-base font-extrabold text-white line-clamp-1 leading-tight tracking-tight cursor-pointer hover:text-brand-neon transition-colors"
                      title={asset.title}
                    >
                      {asset.title}
                    </h3>
                    <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed font-sans">
                      {asset.description || "Google Drive asset ready for marketing dispatch and content scheduling."}
                    </p>
                  </div>
                </div>

                {/* Bottom Actions (Exact matching screenshot: Neon Lime Download button + Copy link) */}
                <div className="p-4 pt-1 space-y-2.5">
                  <div className="flex items-center gap-2">
                    {/* Big Vibrant Neon Lime Pill Download Button */}
                    <button
                      onClick={() => handleDownload(asset)}
                      className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-[#ccff33] hover:bg-[#cee56c] text-black font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-95"
                      title="Download image/video file directly from Google Drive"
                    >
                      <Download className="w-4 h-4 stroke-[2.5]" />
                      <span>Download</span>
                    </button>

                    {/* Copy Link Button */}
                    <button
                      onClick={() => copyLink(asset.driveUrl)}
                      className="p-3 rounded-xl bg-brand-dark hover:bg-brand-hover text-gray-300 hover:text-white border border-brand-border transition-colors flex-shrink-0"
                      title="Copy Google Drive share link"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Comment & @Mention Section Trigger */}
                  <div>
                    <button
                      onClick={() => toggleComments(asset.id)}
                      className={`w-full py-1.5 px-3 rounded-xl text-[11px] font-semibold flex items-center justify-between transition-colors ${
                        isCommentsOpen 
                          ? "bg-brand-dark text-brand-neon border border-brand-neon/30" 
                          : "bg-brand-dark/60 hover:bg-brand-dark text-gray-400 hover:text-gray-200 border border-brand-border/40"
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-brand-lime" />
                        <span>Modification Comments</span>
                      </span>
                      <span className={`px-1.5 py-0.2 rounded-full font-mono text-[10px] ${
                        commentsCount > 0 ? "bg-brand-neon text-black font-bold" : "bg-brand-surface text-gray-500"
                      }`}>
                        {commentsCount}
                      </span>
                    </button>

                    {/* Expanded @Mention Comment Section */}
                    {isCommentsOpen && (
                      <CommentsThread
                        comments={asset.comments || []}
                        onSaveComments={(updated) => handleUpdateComments(asset.id, updated)}
                        targetType="media_asset"
                        targetId={asset.id}
                        targetTitle={asset.title}
                        targetTab="media"
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ========================================================================= */}
      {/* FULL-SCREEN HIGH-RES LIGHTBOX MODAL (OPENS BIG ON CLICK!) */}
      {/* ========================================================================= */}
      {previewItem && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex flex-col justify-between overflow-hidden animate-in fade-in duration-200"
          onClick={() => {
            setPreviewItem(null);
            setLightboxZoom(1);
          }}
        >
          {/* Lightbox Top Bar */}
          <div 
            className="w-full px-6 py-4 bg-gradient-to-b from-black/90 to-transparent flex items-center justify-between z-20"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-lg bg-brand-surface border border-brand-border text-brand-neon text-xs font-bold flex items-center gap-1.5 font-mono">
                <Calendar className="w-3.5 h-3.5" />
                <span>Added: {previewItem.uploadedDate || "Recent"}</span>
              </span>
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
                  {previewItem.title}
                </h2>
                <span className="text-xs text-gray-400 flex items-center gap-2">
                  <span>{previewItem.market || "USA & LATAM"}</span>
                  {previewItem.fileSize && (
                    <>
                      <span>•</span>
                      <span>{previewItem.fileSize}</span>
                    </>
                  )}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Zoom controls for images */}
              {previewItem.type !== "video" && (
                <div className="hidden sm:flex items-center gap-1 bg-brand-surface border border-brand-border rounded-xl p-1 text-xs">
                  <button
                    onClick={() => setLightboxZoom(prev => Math.max(0.5, prev - 0.25))}
                    className="p-1.5 rounded-lg hover:bg-brand-hover text-gray-300 hover:text-white"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="px-2 font-mono text-gray-300">{Math.round(lightboxZoom * 100)}%</span>
                  <button
                    onClick={() => setLightboxZoom(prev => Math.min(3, prev + 0.25))}
                    className="p-1.5 rounded-lg hover:bg-brand-hover text-gray-300 hover:text-white"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setLightboxZoom(1)}
                    className="p-1.5 rounded-lg hover:bg-brand-hover text-gray-300 hover:text-white"
                    title="Reset Zoom"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Close Button */}
              <button
                onClick={() => {
                  setPreviewItem(null);
                  setLightboxZoom(1);
                }}
                className="p-2.5 rounded-xl bg-brand-surface hover:bg-red-500/80 text-gray-300 hover:text-white border border-brand-border transition-colors ml-2"
                title="Close (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Lightbox Center Media Canvas */}
          <div 
            className="flex-1 relative flex items-center justify-center p-4 sm:p-8 overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Prev / Next Navigation Arrows */}
            {filteredAssets.length > 1 && (
              <>
                <button
                  onClick={() => navigateLightbox(-1)}
                  className="absolute left-4 z-30 p-3 rounded-full bg-black/70 hover:bg-brand-neon hover:text-brand-black text-white border border-white/20 transition-all shadow-2xl backdrop-blur-md"
                  title="Previous image (Left Arrow)"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={() => navigateLightbox(1)}
                  className="absolute right-4 z-30 p-3 rounded-full bg-black/70 hover:bg-brand-neon hover:text-brand-black text-white border border-white/20 transition-all shadow-2xl backdrop-blur-md"
                  title="Next image (Right Arrow)"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}

            {/* Media Content */}
            {previewItem.type === "video" ? (
              <div className="w-full max-w-5xl h-[70vh] flex items-center justify-center">
                <iframe
                  src={previewItem.previewUrl || `https://drive.google.com/file/d/${previewItem.driveId}/preview`}
                  className="w-full h-full rounded-2xl border border-brand-border shadow-2xl bg-black"
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                  title={previewItem.title}
                />
              </div>
            ) : (
              <div className="relative flex items-center justify-center max-w-full max-h-full">
                <img
                  src={previewItem.thumbnail || previewItem.driveUrl}
                  alt={previewItem.title}
                  style={{ transform: `scale(${lightboxZoom})`, transition: "transform 0.15s ease-out" }}
                  onError={() => handleImageLoadError(previewItem)}
                  className="max-h-[75vh] w-auto max-w-[90vw] object-contain rounded-2xl shadow-2xl border border-white/10"
                />
              </div>
            )}
          </div>

          {/* Lightbox Bottom Bar */}
          <div 
            className="w-full px-6 py-4 bg-black/90 border-t border-brand-border/80 flex flex-col sm:flex-row items-center justify-between gap-4 z-20"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-xs text-gray-300 max-w-xl">
              <p className="line-clamp-2">{previewItem.description || "Google Drive certified asset."}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => copyLink(previewItem.driveUrl)}
                className="flex items-center gap-1.5 px-3 py-2 bg-brand-surface hover:bg-brand-hover text-gray-300 hover:text-white border border-brand-border text-xs font-semibold rounded-xl"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Share Link</span>
              </button>

              <button
                onClick={() => window.open(previewItem.driveUrl, "_blank")}
                className="flex items-center gap-1.5 px-3 py-2 bg-brand-surface hover:bg-brand-hover text-gray-300 hover:text-white border border-brand-border text-xs font-semibold rounded-xl"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open in Google Drive</span>
              </button>

              <button
                onClick={() => handleDownload(previewItem)}
                className="flex items-center gap-2 px-5 py-2 bg-[#ccff33] hover:bg-[#cee56c] text-brand-black text-xs font-extrabold rounded-xl shadow-lg transition-transform active:scale-95"
              >
                <Download className="w-4 h-4 stroke-[2.5]" />
                <span>Download Full Resolution</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* RESTRICTION WARNING POPUP MODAL (REQUESTED BY USER!) */}
      {/* ========================================================================= */}
      {restrictedWarning && (
        <div className="fixed inset-0 z-[110] bg-black/85 flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-brand-surface border-2 border-amber-500/80 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white tracking-tight">
                    Google Drive Folder is Set to Restricted
                  </h2>
                  <span className="inline-block px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[11px] font-mono mt-0.5">
                    Access Permission Warning
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setRestrictedWarning(null)} 
                className="text-gray-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 bg-amber-950/20 border border-amber-500/30 rounded-xl text-xs text-amber-200/90 leading-relaxed">
              <p className="font-semibold text-amber-300 mb-1">Why is this happening?</p>
              <p>
                {restrictedWarning.reason || "Google Drive permissions on this folder are currently set to Restricted (Private). Google Drive blocks external apps from loading thumbnails and previewing images unless link sharing is enabled."}
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                How to fix this in 10 seconds:
              </h3>
              
              <div className="space-y-2.5 text-xs text-gray-300">
                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-brand-dark border border-brand-border">
                  <span className="w-5 h-5 rounded-full bg-brand-neon text-brand-black flex items-center justify-center font-bold text-[11px] flex-shrink-0">
                    1
                  </span>
                  <div>
                    <span className="font-bold text-white">Open the folder in Google Drive:</span>
                    <p className="text-gray-400 mt-0.5">Click the button below to open your folder directly in Google Drive.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-brand-dark border border-brand-border">
                  <span className="w-5 h-5 rounded-full bg-brand-neon text-brand-black flex items-center justify-center font-bold text-[11px] flex-shrink-0">
                    2
                  </span>
                  <div>
                    <span className="font-bold text-white">Click "Share" (top right of Google Drive)</span>
                    <p className="text-gray-400 mt-0.5">Under <strong className="text-gray-200">General access</strong>, switch from <span className="text-red-400 font-semibold">Restricted</span> to <span className="text-brand-neon font-semibold">"Anyone with the link"</span> (Viewer role).</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-brand-dark border border-brand-border">
                  <span className="w-5 h-5 rounded-full bg-brand-neon text-brand-black flex items-center justify-center font-bold text-[11px] flex-shrink-0">
                    3
                  </span>
                  <div>
                    <span className="font-bold text-white">Done! Previews will now load instantly</span>
                    <p className="text-gray-400 mt-0.5">Once updated, every image and video preview will display automatically in full high-definition.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-brand-border">
              {restrictedWarning.url ? (
                <button
                  onClick={() => window.open(restrictedWarning.url, "_blank")}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-neon text-brand-black font-extrabold text-xs rounded-xl shadow-md hover:bg-brand-lime transition-all"
                >
                  <ExternalLink className="w-4 h-4 stroke-[2.5]" />
                  <span>Open Folder in Google Drive ↗</span>
                </button>
              ) : <div />}

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setRestrictedWarning(null);
                    setIsFolderModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-brand-dark hover:bg-brand-hover text-xs text-gray-300 border border-brand-border"
                >
                  Paste Links Instead
                </button>
                <button
                  type="button"
                  onClick={() => setRestrictedWarning(null)}
                  className="px-4 py-2 rounded-xl bg-brand-surface hover:bg-brand-hover text-xs text-white font-bold border border-brand-border"
                >
                  Got It
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CONNECT GOOGLE DRIVE FOLDER (REAL AUTO-COLLECTION, NO DEMO IMAGES) */}
      {/* ========================================================================= */}
      {isFolderModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-brand-surface border border-brand-border rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-brand-neon" />
                <h2 className="text-lg font-bold text-white">Auto-Collect from Google Drive</h2>
              </div>
              <button onClick={() => setIsFolderModalOpen(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleConnectFolderAndAutoLoad} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-300 font-semibold mb-1">
                  Google Drive Folder Link OR Paste Multiple File Links *
                </label>
                <textarea
                  rows={4}
                  required
                  value={newFolder.batchLinksText}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNewFolder({ 
                      ...newFolder, 
                      batchLinksText: val,
                      folderUrl: val.includes("/folders/") ? val.trim() : newFolder.folderUrl 
                    });
                  }}
                  placeholder="Paste your Google Drive folder link OR paste multiple file links (one per line):&#10;https://drive.google.com/drive/folders/1ABC_XYZ123...&#10;or&#10;https://drive.google.com/file/d/FILE_ID_1/view&#10;https://drive.google.com/file/d/FILE_ID_2/view"
                  className="w-full px-3 py-2 bg-brand-dark border border-brand-border rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-brand-neon font-mono text-[11px]"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  💡 <strong>Tip:</strong> In Google Drive, you can select files, right click <strong>"Copy link"</strong> and paste them here to automatically generate all individual preview cards!
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Brand Associated</label>
                  <select
                    value={newFolder.brand}
                    onChange={(e) => setNewFolder({ ...newFolder, brand: e.target.value })}
                    className="w-full px-3 py-2 bg-brand-dark border border-brand-border rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-brand-neon"
                  >
                    <option value="HP">HP Laptops</option>
                    <option value="Dell">Dell Laptops</option>
                    <option value="Lenovo">Lenovo Laptops</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Target Market</label>
                  <select
                    value={newFolder.market}
                    onChange={(e) => setNewFolder({ ...newFolder, market: e.target.value })}
                    className="w-full px-3 py-2 bg-brand-dark border border-brand-border rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-brand-neon"
                  >
                    <option value="USA & LATAM">USA & LATAM</option>
                    <option value="USA">USA Warehouse</option>
                    <option value="LATAM">Mexico Warehouse</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Aspect Ratio Format</label>
                  <select
                    value={newFolder.aspectRatio}
                    onChange={(e) => setNewFolder({ ...newFolder, aspectRatio: e.target.value })}
                    className="w-full px-3 py-2 bg-brand-dark border border-brand-border rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-brand-neon"
                  >
                    <option value="16:9 Landscape">16:9 Landscape (Photos/Web)</option>
                    <option value="9:16 Reels/TikTok">9:16 Reels/TikTok (Vertical)</option>
                    <option value="1:1 Square">1:1 Square (Instagram/FB)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Lot / Batch Name</label>
                  <input
                    type="text"
                    value={newFolder.title}
                    onChange={(e) => setNewFolder({ ...newFolder, title: e.target.value })}
                    placeholder="e.g. HP EliteBook 840 G8 Wholesale Lot"
                    className="w-full px-3 py-2 bg-brand-dark border border-brand-border rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-brand-neon"
                  />
                </div>
              </div>

              {/* Optional Google Drive API Key Accordion */}
              <div className="p-3 bg-brand-dark/70 rounded-xl border border-brand-border/70 space-y-2">
                <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowApiKeyInput(!showApiKeyInput)}>
                  <div className="flex items-center gap-1.5 text-gray-300">
                    <Key className="w-3.5 h-3.5 text-brand-neon" />
                    <span className="font-semibold text-[11px]">Google Cloud API Key (Optional for 1-Click Folder Crawling)</span>
                  </div>
                  <span className="text-gray-400 text-[10px] underline">
                    {showApiKeyInput ? "Hide" : (apiKey ? "Configured ✓" : "Setup")}
                  </span>
                </div>

                {showApiKeyInput && (
                  <div className="pt-2 border-t border-brand-border/60 space-y-2">
                    <input
                      type="text"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="AIzaSy..."
                      className="w-full px-3 py-1.5 bg-brand-surface border border-brand-border rounded-lg text-white font-mono text-[11px]"
                    />
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-[10px] text-gray-400">
                      <div className="flex items-center gap-2">
                        <span>Enables automatic crawling of all files in a folder without pasting file links.</span>
                        <a 
                          href="https://console.cloud.google.com/apis/credentials" 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-brand-neon hover:underline font-bold inline-flex items-center gap-0.5"
                        >
                          <span>Get Free Key on Google Cloud ↗</span>
                        </a>
                      </div>
                      <button
                        type="button"
                        onClick={handleSaveApiKey}
                        className="px-3 py-1 bg-brand-neon text-brand-black font-bold rounded-lg hover:bg-brand-lime"
                      >
                        Save Key
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-3 bg-brand-dark rounded-xl border border-brand-border text-[11px] text-gray-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-neon flex-shrink-0" />
                <span>Zero mock data. Extracts real Google Drive file IDs, loads high-res preview thumbnails, and generates direct download links.</span>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-brand-border">
                <button
                  type="button"
                  onClick={() => setIsFolderModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-brand-dark hover:bg-brand-hover text-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={newFolder.isScanning}
                  className="px-5 py-2 rounded-xl bg-brand-neon text-brand-black font-bold hover:bg-brand-lime flex items-center gap-1.5 disabled:opacity-50"
                >
                  {newFolder.isScanning ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Scanning Links...</span>
                    </>
                  ) : (
                    <span>Auto-Collect & Generate Cards</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD SINGLE ASSET LINK */}
      {/* ========================================================================= */}
      {isAssetModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-brand-surface border border-brand-border rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Add Single Google Drive Link</h2>
              <button onClick={() => setIsAssetModalOpen(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveAsset} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-gray-300 font-semibold mb-1">Asset Title *</label>
                <input
                  type="text"
                  required
                  value={newAsset.title}
                  onChange={(e) => setNewAsset({ ...newAsset, title: e.target.value })}
                  placeholder="e.g. HP EliteBook 840 G8 - Studio White Shoot"
                  className="w-full px-3 py-2 bg-brand-dark border border-brand-border rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-brand-neon"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">Google Drive Link / Direct Media URL *</label>
                <input
                  type="text"
                  required
                  value={newAsset.driveUrl}
                  onChange={(e) => setNewAsset({ ...newAsset, driveUrl: e.target.value })}
                  placeholder="https://drive.google.com/file/d/FILE_ID/view"
                  className="w-full px-3 py-2 bg-brand-dark border border-brand-border rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-brand-neon font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Media Type</label>
                  <select
                    value={newAsset.type}
                    onChange={(e) => setNewAsset({ ...newAsset, type: e.target.value })}
                    className="w-full px-3 py-2 bg-brand-dark border border-brand-border rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-brand-neon"
                  >
                    <option value="image">Image / High-Res Photo</option>
                    <option value="video">Video / Reel / Unboxing</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Brand</label>
                  <select
                    value={newAsset.brand}
                    onChange={(e) => setNewAsset({ ...newAsset, brand: e.target.value })}
                    className="w-full px-3 py-2 bg-brand-dark border border-brand-border rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-brand-neon"
                  >
                    <option value="HP">HP</option>
                    <option value="Dell">Dell</option>
                    <option value="Lenovo">Lenovo</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">Aspect Ratio</label>
                <select
                  value={newAsset.aspectRatio}
                  onChange={(e) => setNewAsset({ ...newAsset, aspectRatio: e.target.value })}
                  className="w-full px-3 py-2 bg-brand-dark border border-brand-border rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-brand-neon"
                >
                  <option value="16:9 Landscape">16:9 Landscape</option>
                  <option value="9:16 Reels/TikTok">9:16 Reels/TikTok</option>
                  <option value="1:1 Square">1:1 Square</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">Description</label>
                <textarea
                  rows={2}
                  value={newAsset.description}
                  onChange={(e) => setNewAsset({ ...newAsset, description: e.target.value })}
                  placeholder="High-resolution product shoot of HP EliteBook 840 G8 showcasing slim aluminum chassis..."
                  className="w-full px-3 py-2 bg-brand-dark border border-brand-border rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-brand-neon"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-brand-border">
                <button
                  type="button"
                  onClick={() => setIsAssetModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-brand-dark hover:bg-brand-hover text-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-brand-neon text-brand-black font-bold hover:bg-brand-lime"
                >
                  Save Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
