import React, { useState } from "react";
import { 
  ShieldAlert, 
  UserPlus, 
  KeyRound, 
  ShieldCheck, 
  User, 
  Trash2, 
  Copy, 
  CheckCircle2, 
  Eye, 
  EyeOff, 
  Lock, 
  Sparkles,
  Database,
  Laptop
} from "lucide-react";
import { getUsers, saveUser, deleteUser } from "../services/storage";
import { useAuth } from "../context/AuthContext";

export default function UserManagement() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState(getUsers());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showPasswords, setShowPasswords] = useState({});
  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    name: "",
    role: "Member",
    title: "",
    email: ""
  });
  const [toastMessage, setToastMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  const refreshList = () => {
    setUsers(getUsers());
  };

  const togglePasswordVisibility = (id) => {
    setShowPasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleOpenAdd = () => {
    setNewUser({
      username: "",
      password: "",
      name: "",
      role: "Member",
      title: "",
      email: ""
    });
    setFormError("");
    setIsSubmitting(false);
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!newUser.username.trim() || !newUser.password) {
      setFormError("Username and password are required.");
      return;
    }

    const cleanUsername = newUser.username.trim().toLowerCase();
    const exists = users.find(u => (u.username || "").toLowerCase() === cleanUsername);
    if (exists) {
      setFormError(`The username "${newUser.username}" already exists. Please pick a unique username.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const userToSave = {
        ...newUser,
        username: cleanUsername,
        created_at: new Date().toISOString()
      };

      await saveUser(userToSave);
      refreshList();
      setIsModalOpen(false);
      showToast(`Account created for ${newUser.name || newUser.username} and synced!`);
    } catch (err) {
      console.error("Error creating user:", err);
      setFormError(err.message || "Failed to create account. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (u) => {
    if (u.username === "mt206.ruhit") {
      alert("Super Admin / Owner account 'mt206.ruhit' is protected and cannot be deleted.");
      return;
    }
    if (u.username === currentUser?.username) {
      alert("You cannot delete your own active logged-in account.");
      return;
    }
    if (window.confirm(`Delete user account "${u.username}"? They will no longer be able to log in.`)) {
      deleteUser(u.id);
      refreshList();
      showToast(`User ${u.username} removed.`);
    }
  };

  const copyCredentials = (u) => {
    const text = `MiNZTECH Portal Login Credentials:
Portal URL: ${window.location.origin}
Username: ${u.username}
Password: ${u.password}
Role: ${u.role}`;
    navigator.clipboard.writeText(text);
    showToast(`Credentials for ${u.username} copied to clipboard!`);
  };

  return (
    <div className="space-y-6 pb-12">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-brand-neon text-brand-black px-4 py-2.5 rounded-xl font-bold shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">User Accounts & Access Control</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-brand-neon/20 text-brand-neon border border-brand-neon/30 text-xs font-mono">
              Admin Console
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Create Admin & Member accounts. All credentials sync automatically to Supabase for multi-computer login.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-brand-neon hover:bg-brand-lime text-brand-black text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Create New User</span>
        </button>
      </div>

      {/* Info Banner */}
      <div className="p-4 bg-brand-surface border border-brand-border rounded-2xl flex items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-brand-neon/10 text-brand-neon">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-white">Online Supabase Authentication Active</h4>
            <p className="text-gray-400">
              When you create an Admin or Member account here, credentials are stored online so your staff can log in from any PC or laptop globally.
            </p>
          </div>
        </div>
      </div>

      {/* User Accounts Table */}
      <div className="bg-brand-surface border border-brand-border rounded-2xl overflow-hidden shadow-sm w-full">
        <div className="overflow-x-auto w-full">
          <table className="w-full min-w-[760px] text-left text-xs text-gray-300">
            <thead className="bg-brand-dark/90 text-gray-400 uppercase font-mono text-[11px] border-b border-brand-border">
              <tr>
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Username</th>
                <th className="py-3.5 px-4">Password</th>
                <th className="py-3.5 px-4">Title & Contact</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border/40">
              {users.map((u) => {
                const isOwner = u.username === "mt206.ruhit";
                const isRevealed = showPasswords[u.id];

                return (
                  <tr key={u.id} className="hover:bg-brand-hover/40 transition-colors">
                    {/* User name & icon */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-brand-dark border border-brand-border flex items-center justify-center font-bold text-brand-neon">
                          {u.name?.charAt(0) || u.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <span>{u.name || u.username}</span>
                            {isOwner && (
                              <span className="px-1.5 py-0.2 bg-brand-neon/20 text-brand-neon rounded text-[9px] font-bold uppercase">
                                Owner
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-gray-400 font-mono">ID: {u.id}</div>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="py-4 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                        u.role === "Admin" 
                          ? "bg-brand-neon/20 text-brand-neon border border-brand-neon/40" 
                          : "bg-blue-500/20 text-blue-300 border border-blue-500/40"
                      }`}>
                        {u.role}
                      </span>
                    </td>

                    {/* Username */}
                    <td className="py-4 px-4 font-mono text-white font-semibold">
                      {u.username}
                    </td>

                    {/* Password */}
                    <td className="py-4 px-4 font-mono">
                      <div className="flex items-center gap-2">
                        <span className="bg-brand-dark px-2 py-1 rounded border border-brand-border/60 text-gray-200">
                          {isRevealed ? u.password : "••••••••••••"}
                        </span>
                        <button
                          onClick={() => togglePasswordVisibility(u.id)}
                          className="p-1 text-gray-400 hover:text-white"
                          title={isRevealed ? "Hide password" : "Show password"}
                        >
                          {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>

                    {/* Title & Contact */}
                    <td className="py-4 px-4">
                      <div className="text-gray-200">{u.title || "Operations Staff"}</div>
                      <div className="text-[11px] text-gray-400">{u.email || "No email"}</div>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => copyCredentials(u)}
                          className="px-2.5 py-1.5 rounded-lg bg-brand-dark hover:bg-brand-hover text-brand-neon border border-brand-border flex items-center gap-1 font-semibold text-[11px] transition-colors"
                          title="Copy login credentials to send to team member"
                        >
                          <Copy className="w-3 h-3" />
                          <span>Share</span>
                        </button>

                        {!isOwner && (
                          <button
                            onClick={() => handleDelete(u)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-brand-dark transition-colors"
                            title="Delete user"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-brand-surface border border-brand-border rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Create Portal User Account</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              {formError && (
                <div className="p-3 bg-red-950/60 border border-red-500/50 rounded-xl text-red-200 text-xs flex items-center gap-2 animate-shake">
                  <ShieldAlert className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    placeholder="e.g. Maria Sanchez"
                    className="w-full px-3 py-2 bg-brand-dark border border-brand-border rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-brand-neon"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Role</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    className="w-full px-3 py-2 bg-brand-dark border border-brand-border rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-brand-neon"
                  >
                    <option value="Member">Member (Operations & Tasks)</option>
                    <option value="Admin">Admin (Full Management Privileges)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Username *</label>
                  <input
                    type="text"
                    required
                    value={newUser.username}
                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    placeholder="e.g. maria.latam"
                    className="w-full px-3 py-2 bg-brand-dark border border-brand-border rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-brand-neon font-mono"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Password *</label>
                  <input
                    type="text"
                    required
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    placeholder="e.g. Maria@mex2026"
                    className="w-full px-3 py-2 bg-brand-dark border border-brand-border rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-brand-neon font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Job Title</label>
                  <input
                    type="text"
                    value={newUser.title}
                    onChange={(e) => setNewUser({ ...newUser, title: e.target.value })}
                    placeholder="e.g. Mexico Warehouse Social Lead"
                    className="w-full px-3 py-2 bg-brand-dark border border-brand-border rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-brand-neon"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Email</label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    placeholder="e.g. maria@minztech.com"
                    className="w-full px-3 py-2 bg-brand-dark border border-brand-border rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-brand-neon"
                  />
                </div>
              </div>

              <div className="p-3 bg-brand-dark rounded-xl border border-brand-border text-[11px] text-gray-400">
                <span className="text-brand-neon font-bold">Automatic Cloud Sync:</span> Once saved, this username and password will immediately sync to Supabase so this member can log in from their own device or laptop.
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-brand-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-brand-dark hover:bg-brand-hover text-gray-300 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-brand-neon text-brand-black font-bold hover:bg-brand-lime disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md transition-all"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-brand-black border-t-transparent rounded-full animate-spin"></div>
                      <span>Creating & Syncing...</span>
                    </>
                  ) : (
                    <span>Create & Sync Account</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
