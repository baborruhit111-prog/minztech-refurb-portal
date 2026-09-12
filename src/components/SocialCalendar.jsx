import React, { useState } from "react";
import { 
  CalendarDays, 
  Share2, 
  Plus, 
  Filter, 
  Globe2, 
  Clock, 
  CheckCircle2, 
  Copy, 
  Edit3, 
  Trash2, 
  Sparkles,
  ExternalLink,
  Video,
  Image as ImageIcon,
  Check,
  MessageSquare
} from "lucide-react";
import { getSocialPosts, saveSocialPost, deleteSocialPost, getUsers } from "../services/storage";
import CommentsThread from "./CommentsThread";

export default function SocialCalendar() {
  const [posts, setPosts] = useState(getSocialPosts());
  const [users] = useState(getUsers());
  const [marketTab, setMarketTab] = useState("all"); // 'all' | 'USA' | 'LATAM'
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'Published' | 'Ready to Post' | 'Draft' | 'Idea'
  const [platformFilter, setPlatformFilter] = useState("all");
  const [expandedComments, setExpandedComments] = useState({});
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [toastMessage, setToastMessage] = useState("");

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  const refreshList = () => {
    setPosts(getSocialPosts());
  };

  const filteredPosts = posts.filter(post => {
    if (marketTab !== "all" && post.market !== marketTab && post.market !== "Both") return false;
    if (statusFilter !== "all" && post.status !== statusFilter) return false;
    if (platformFilter !== "all" && !post.platforms.includes(platformFilter)) return false;
    return true;
  });

  const publishedCount = posts.filter(p => p.status === "Published").length;
  const readyCount = posts.filter(p => p.status === "Ready to Post").length;

  const handleOpenAdd = () => {
    setSelectedPost({
      id: "",
      title: "",
      market: marketTab === "LATAM" ? "LATAM" : "USA",
      platforms: ["facebook", "instagram", "tiktok"],
      scheduledDate: new Date().toISOString().split("T")[0],
      scheduledTime: "11:00 AM EST",
      status: "Ready to Post",
      assignedMember: users[0]?.name || "Team Member",
      caption: "",
      mediaUrl: "",
      mediaType: "image",
      notes: ""
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (post) => {
    setSelectedPost({ ...post });
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm("Delete this scheduled post? Changes will sync online.")) {
      deleteSocialPost(id);
      refreshList();
      showToast("Post deleted and synced.");
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!selectedPost.title) {
      alert("Title is required.");
      return;
    }
    saveSocialPost(selectedPost);
    refreshList();
    setIsModalOpen(false);
    showToast("Social post saved & synced to Supabase.");
  };

  // 1-Click Toggle Published Status
  const handleTogglePublished = (post) => {
    const nextStatus = post.status === "Published" ? "Ready to Post" : "Published";
    const updated = { ...post, status: nextStatus };
    saveSocialPost(updated);
    refreshList();
    showToast(`Post marked as ${nextStatus}!`);
  };

  const copyCaption = (caption) => {
    navigator.clipboard.writeText(caption);
    showToast("Caption copied to clipboard ready to paste!");
  };

  const togglePlatform = (plat) => {
    if (!selectedPost) return;
    const exists = selectedPost.platforms.includes(plat);
    const updated = exists 
      ? selectedPost.platforms.filter(p => p !== plat)
      : [...selectedPost.platforms, plat];
    setSelectedPost({ ...selectedPost, platforms: updated });
  };

  const toggleComments = (postId) => {
    setExpandedComments(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  const handleUpdateComments = (postId, updatedComments) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    const updated = { ...post, comments: updatedComments };
    saveSocialPost(updated);
    refreshList();
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
            <h1 className="text-2xl font-bold text-white tracking-tight">Social Media Content Calendar</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-brand-surface border border-brand-border text-xs text-brand-neon font-mono">
              {publishedCount} Published • {readyCount} Ready to Post
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Manage daily scheduled & published posts across Facebook, Instagram, and TikTok for USA and Mexico accounts.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-brand-neon hover:bg-brand-lime text-brand-black text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule Post</span>
        </button>
      </div>

      {/* Market Selector & Filters */}
      <div className="bg-brand-surface border border-brand-border rounded-2xl p-4 space-y-4">
        {/* Market Tabs */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-1 bg-brand-dark p-1 rounded-xl border border-brand-border text-xs font-medium">
            <button
              onClick={() => setMarketTab("all")}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${
                marketTab === "all" ? "bg-brand-neon text-brand-black font-bold" : "text-gray-400 hover:text-white"
              }`}
            >
              All Socials ({posts.length})
            </button>
            <button
              onClick={() => setMarketTab("USA")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all ${
                marketTab === "USA" ? "bg-brand-neon text-brand-black font-bold" : "text-gray-400 hover:text-white"
              }`}
            >
              <span>🇺🇸 USA Account</span>
            </button>
            <button
              onClick={() => setMarketTab("LATAM")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all ${
                marketTab === "LATAM" ? "bg-brand-neon text-brand-black font-bold" : "text-gray-400 hover:text-white"
              }`}
            >
              <span>🇲🇽 Mexico / LATAM Account</span>
            </button>
          </div>

          {/* Platform Filters */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-400">Platform:</span>
            <div className="flex items-center gap-1 bg-brand-dark p-1 rounded-xl border border-brand-border">
              {["all", "facebook", "instagram", "tiktok"].map((p) => (
                <button
                  key={p}
                  onClick={() => setPlatformFilter(p)}
                  className={`px-2.5 py-1 rounded-lg capitalize ${
                    platformFilter === p ? "bg-brand-surface text-brand-neon font-bold" : "text-gray-400"
                  }`}
                >
                  {p === "all" ? "All" : p === "facebook" ? "FB" : p === "instagram" ? "Insta" : "TikTok"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Status Filters Bar (Published, Ready to Post, Draft, Idea) */}
        <div className="pt-3 border-t border-brand-border/60 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-gray-400 font-semibold">Post Status:</span>
            <div className="flex flex-wrap items-center gap-1 bg-brand-dark p-1 rounded-xl border border-brand-border">
              <button
                onClick={() => setStatusFilter("all")}
                className={`px-3 py-1 rounded-lg transition-all ${
                  statusFilter === "all" ? "bg-brand-neon text-brand-black font-bold" : "text-gray-400 hover:text-white"
                }`}
              >
                All Statuses
              </button>
              <button
                onClick={() => setStatusFilter("Published")}
                className={`flex items-center gap-1 px-3 py-1 rounded-lg transition-all ${
                  statusFilter === "Published" 
                    ? "bg-emerald-500 text-white font-bold" 
                    : "text-emerald-400 hover:text-emerald-300"
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>Published ({publishedCount})</span>
              </button>
              <button
                onClick={() => setStatusFilter("Ready to Post")}
                className={`px-3 py-1 rounded-lg transition-all ${
                  statusFilter === "Ready to Post" 
                    ? "bg-brand-neon text-brand-black font-bold" 
                    : "text-brand-lime hover:text-brand-neon"
                }`}
              >
                Ready to Post ({readyCount})
              </button>
              <button
                onClick={() => setStatusFilter("Draft")}
                className={`px-3 py-1 rounded-lg transition-all ${
                  statusFilter === "Draft" 
                    ? "bg-brand-surface text-white font-bold" 
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Draft
              </button>
              <button
                onClick={() => setStatusFilter("Idea")}
                className={`px-3 py-1 rounded-lg transition-all ${
                  statusFilter === "Idea" 
                    ? "bg-brand-surface text-white font-bold" 
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Idea
              </button>
            </div>
          </div>

          <div className="text-[11px] text-gray-400">
            Showing <strong>{filteredPosts.length}</strong> posts
          </div>
        </div>
      </div>

      {/* Scheduled Posts Timeline */}
      <div className="space-y-4">
        {filteredPosts.length === 0 ? (
          <div className="bg-brand-surface border border-brand-border rounded-2xl p-12 text-center text-gray-400">
            <CalendarDays className="w-12 h-12 mx-auto text-gray-600 mb-3" />
            <h3 className="text-base font-semibold text-white">No posts match this status or account filter</h3>
            <p className="text-xs mt-1">Change status filters or schedule a new post.</p>
          </div>
        ) : (
          filteredPosts.map((post) => {
            const isPublished = post.status === "Published";
            return (
              <div 
                key={post.id} 
                className={`bg-brand-surface border rounded-2xl p-5 shadow-sm space-y-3 transition-all ${
                  isPublished 
                    ? "border-emerald-500/40 bg-brand-surface/90" 
                    : "border-brand-border hover:border-brand-neon/40"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      post.market === "LATAM" 
                        ? "bg-brand-neon/20 text-brand-neon border border-brand-neon/30" 
                        : post.market === "USA"
                        ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                        : "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                    }`}>
                      {post.market === "LATAM" ? "🇲🇽 Mexico Account" : post.market === "USA" ? "🇺🇸 USA Account" : "🌐 Both Accounts"}
                    </span>

                    <span className="flex items-center gap-1 text-xs text-gray-400 font-mono">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{post.scheduledDate} • {post.scheduledTime}</span>
                    </span>

                    {/* Status Badge */}
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1 ${
                      isPublished 
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40" 
                        : post.status === "Ready to Post" 
                        ? "bg-brand-neon/20 text-brand-neon border border-brand-neon/30"
                        : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    }`}>
                      {isPublished && <Check className="w-3 h-3" />}
                      <span>{post.status}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 mr-1">Assigned: <strong className="text-gray-200">{post.assignedMember}</strong></span>
                    
                    {/* 1-Click Mark as Published / Revert Button */}
                    <button
                      onClick={() => handleTogglePublished(post)}
                      className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        isPublished 
                          ? "bg-brand-dark hover:bg-amber-500/20 text-gray-300 hover:text-amber-300 border border-brand-border" 
                          : "bg-emerald-500 hover:bg-emerald-400 text-white shadow-sm"
                      }`}
                      title={isPublished ? "Revert to Ready to Post" : "Mark as Published to social media"}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{isPublished ? "Unpublish" : "Mark Published"}</span>
                    </button>

                    <button
                      onClick={() => handleOpenEdit(post)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-brand-neon hover:bg-brand-dark"
                      title="Edit post"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-brand-dark"
                      title="Delete post"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Title & Platforms */}
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-base font-bold text-white">{post.title}</h3>
                  <div className="flex items-center gap-1">
                    {(post.platforms || []).map((p) => (
                      <span 
                        key={p} 
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                          p === "tiktok" 
                            ? "bg-pink-500/20 text-pink-300 border border-pink-500/30" 
                            : p === "instagram" 
                            ? "bg-purple-500/20 text-purple-300 border border-purple-500/30" 
                            : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                        }`}
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Caption Box */}
                {post.caption && (
                  <div className="relative p-3.5 bg-brand-dark/90 rounded-xl border border-brand-border text-xs text-gray-200 leading-relaxed font-sans">
                    <div className="flex items-center justify-between mb-1 pb-1 border-b border-brand-border/40 text-[11px] text-gray-400">
                      <span>Copyable Caption:</span>
                      <button
                        onClick={() => copyCaption(post.caption)}
                        className="text-brand-neon hover:text-brand-lime flex items-center gap-1 font-semibold"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Copy Caption</span>
                      </button>
                    </div>
                    <div className="whitespace-pre-line max-h-36 overflow-y-auto pr-2">
                      {post.caption}
                    </div>
                  </div>
                )}

                {/* Comment & @Mention Section Trigger */}
                <div className="pt-2 border-t border-brand-border/40">
                  <button
                    onClick={() => toggleComments(post.id)}
                    className={`w-full py-1.5 px-3 rounded-xl text-[11px] font-semibold flex items-center justify-between transition-colors ${
                      expandedComments[post.id] 
                        ? "bg-brand-dark text-brand-neon border border-brand-neon/30" 
                        : "bg-brand-dark/60 hover:bg-brand-dark text-gray-400 hover:text-gray-200 border border-brand-border/40"
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-brand-lime" />
                      <span>Modification Comments & Team Mentions</span>
                    </span>
                    <span className={`px-1.5 py-0.2 rounded-full font-mono text-[10px] ${
                      (post.comments || []).length > 0 ? "bg-brand-neon text-black font-bold" : "bg-brand-surface text-gray-500"
                    }`}>
                      {(post.comments || []).length}
                    </span>
                  </button>

                  {expandedComments[post.id] && (
                    <CommentsThread
                      comments={post.comments || []}
                      onSaveComments={(updated) => handleUpdateComments(post.id, updated)}
                      targetType="social_post"
                      targetId={post.id}
                      targetTitle={post.title}
                      targetTab="calendar"
                    />
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Schedule / Edit Modal with Published Status option */}
      {isModalOpen && selectedPost && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-brand-surface border border-brand-border rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">
                {selectedPost.id ? "Edit Scheduled Post" : "Schedule New Social Post"}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-gray-300 font-semibold mb-1">Post Title / Topic *</label>
                <input
                  type="text"
                  required
                  value={selectedPost.title}
                  onChange={(e) => setSelectedPost({ ...selectedPost, title: e.target.value })}
                  placeholder="e.g. 500x HP EliteBook 840 G8 Wholesale Drop"
                  className="w-full px-3 py-2 bg-brand-dark border border-brand-border rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-brand-neon"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Target Market</label>
                  <select
                    value={selectedPost.market}
                    onChange={(e) => setSelectedPost({ ...selectedPost, market: e.target.value })}
                    className="w-full px-3 py-2 bg-brand-dark border border-brand-border rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-brand-neon"
                  >
                    <option value="USA">🇺🇸 USA Account</option>
                    <option value="LATAM">🇲🇽 Mexico Account</option>
                    <option value="Both">🌐 Cross-Post Both</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Publish Status</label>
                  <select
                    value={selectedPost.status}
                    onChange={(e) => setSelectedPost({ ...selectedPost, status: e.target.value })}
                    className="w-full px-3 py-2 bg-brand-dark border border-brand-border rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-brand-neon"
                  >
                    <option value="Ready to Post">Ready to Post</option>
                    <option value="Published">✅ Published</option>
                    <option value="Draft">Draft</option>
                    <option value="Idea">Idea</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Assigned Member</label>
                  <input
                    type="text"
                    value={selectedPost.assignedMember}
                    onChange={(e) => setSelectedPost({ ...selectedPost, assignedMember: e.target.value })}
                    placeholder="e.g. Sarah or Carlos"
                    className="w-full px-3 py-2 bg-brand-dark border border-brand-border rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-brand-neon"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Scheduled Date</label>
                  <input
                    type="date"
                    value={selectedPost.scheduledDate}
                    onChange={(e) => setSelectedPost({ ...selectedPost, scheduledDate: e.target.value })}
                    className="w-full px-3 py-2 bg-brand-dark border border-brand-border rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-brand-neon"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Scheduled Time</label>
                  <input
                    type="text"
                    value={selectedPost.scheduledTime}
                    onChange={(e) => setSelectedPost({ ...selectedPost, scheduledTime: e.target.value })}
                    placeholder="10:00 AM EST or 02:00 PM CST"
                    className="w-full px-3 py-2 bg-brand-dark border border-brand-border rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-brand-neon"
                  />
                </div>
              </div>

              {/* Platforms */}
              <div>
                <label className="block text-gray-300 font-semibold mb-1.5">Publish To Platforms:</label>
                <div className="flex items-center gap-2">
                  {["facebook", "instagram", "tiktok"].map((p) => {
                    const isChecked = selectedPost.platforms?.includes(p);
                    return (
                      <button
                        type="button"
                        key={p}
                        onClick={() => togglePlatform(p)}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-bold capitalize transition-all ${
                          isChecked 
                            ? "bg-brand-neon text-brand-black border-brand-neon" 
                            : "bg-brand-dark text-gray-400 border-brand-border"
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Post Caption */}
              <div>
                <label className="block text-gray-300 font-semibold mb-1">
                  Post Caption ({selectedPost.market === "LATAM" ? "Español" : "English"}):
                </label>
                <textarea
                  rows={4}
                  value={selectedPost.caption}
                  onChange={(e) => setSelectedPost({ ...selectedPost, caption: e.target.value })}
                  placeholder="Write the full post copy with hashtags and call to action..."
                  className="w-full px-3 py-2 bg-brand-dark border border-brand-border rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-brand-neon font-sans"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-brand-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-brand-dark hover:bg-brand-hover text-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-brand-neon text-brand-black font-bold hover:bg-brand-lime"
                >
                  Save Post
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
