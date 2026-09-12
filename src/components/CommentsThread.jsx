import React, { useState } from "react";
import { MessageSquare, Send, AtSign, User, Clock, CheckCircle2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getUsers } from "../services/storage";
import { processCommentMentions } from "../services/notifications";

export default function CommentsThread({ 
  comments = [], 
  onSaveComments, 
  targetType, // 'social_post' | 'media_asset'
  targetId, 
  targetTitle,
  targetTab = "calendar"
}) {
  const { user: currentUser } = useAuth();
  const [commentText, setCommentText] = useState("");
  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const [mentionNotice, setMentionNotice] = useState("");
  const users = getUsers();

  const handleAddComment = (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    const newComment = {
      id: `comm_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      authorName: currentUser?.name || currentUser?.username || "Admin",
      authorUsername: currentUser?.username || "mt206.ruhit",
      role: currentUser?.role || "Admin",
      text: commentText.trim(),
      createdAt: new Date().toISOString()
    };

    // Process @mentions and notify mentioned team members
    const mentioned = processCommentMentions({
      commentText: commentText.trim(),
      currentUser,
      targetType,
      targetId,
      targetTitle,
      targetTab
    });

    if (mentioned && mentioned.length > 0) {
      setMentionNotice(`✓ Mention sent to @${mentioned.join(", @")}`);
      setTimeout(() => setMentionNotice(""), 4000);
    }

    const updatedComments = [...(comments || []), newComment];
    onSaveComments(updatedComments);
    setCommentText("");
    setShowMentionMenu(false);
  };

  const insertMention = (username) => {
    setCommentText(prev => `${prev} @${username} `);
    setShowMentionMenu(false);
  };

  // Render text highlighting @mentions
  const renderFormattedText = (text) => {
    const parts = text.split(/(@[a-zA-Z0-9_.-]+)/g);
    return parts.map((part, idx) => {
      if (part.startsWith("@")) {
        return (
          <span key={idx} className="font-bold text-brand-neon bg-brand-neon/10 px-1 py-0.5 rounded font-mono">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div className="mt-3 pt-3 border-t border-brand-border/60 space-y-3">
      {/* Existing comments list */}
      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
        {(!comments || comments.length === 0) ? (
          <div className="text-[11px] text-gray-500 italic py-1">
            No modification comments yet. Type <span className="text-brand-lime font-mono">@</span> to mention a team member.
          </div>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="p-2.5 rounded-xl bg-brand-dark/90 border border-brand-border/60 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-md bg-brand-surface border border-brand-border flex items-center justify-center font-bold text-[10px] text-brand-neon">
                    {c.authorName?.charAt(0) || "U"}
                  </div>
                  <span className="font-bold text-white text-[11px]">{c.authorName}</span>
                  <span className="text-[9px] uppercase px-1 rounded bg-brand-surface text-gray-400 font-mono">
                    {c.role || "Member"}
                  </span>
                </div>
                <span className="text-[10px] text-gray-500 font-mono">
                  {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              <p className="text-gray-200 text-xs leading-relaxed whitespace-pre-line pl-6">
                {renderFormattedText(c.text)}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Input box */}
      <form onSubmit={handleAddComment} className="relative">
        {/* Quick mention pills */}
        <div className="flex items-center justify-between pb-1.5 text-[11px] flex-wrap gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-gray-400 flex items-center gap-0.5">
              <AtSign className="w-3 h-3 text-brand-neon" />
              <span>Mention:</span>
            </span>
            {users.map(u => (
              <button
                type="button"
                key={u.username}
                onClick={() => insertMention(u.username)}
                className="px-1.5 py-0.5 rounded bg-brand-dark hover:bg-brand-hover text-[10px] font-mono text-gray-300 hover:text-brand-neon border border-brand-border/60 transition-colors"
              >
                @{u.username}
              </button>
            ))}
          </div>

          {mentionNotice && (
            <div className="text-[11px] font-semibold text-brand-lime flex items-center gap-1 animate-fadeIn">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{mentionNotice}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Write a modification note or comment (use @ to mention)..."
            className="flex-1 px-3 py-2 bg-brand-dark border border-brand-border rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-brand-neon"
          />

          <button
            type="submit"
            disabled={!commentText.trim()}
            className="px-3 py-2 bg-brand-neon hover:bg-brand-lime text-brand-black rounded-xl font-bold text-xs disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1 flex-shrink-0"
            title="Post comment & notify mentioned members"
          >
            <Send className="w-3 h-3" />
            <span className="hidden sm:inline">Post</span>
          </button>
        </div>
      </form>
    </div>
  );
}
