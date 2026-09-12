import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { Lock, User, ShieldCheck, AlertCircle, CheckCircle2 } from "lucide-react";
import { getSupabaseConfig } from "../services/supabaseClient";

export default function Login() {
  const { login } = useAuth();
  
  // Strict anti-autofill state: inputs start blank, with randomized keys & readonly until user interacts
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [readOnlyState, setReadOnlyState] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [authSource, setAuthSource] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const usernameRef = useRef(null);
  const passwordRef = useRef(null);
  const supabaseConfig = getSupabaseConfig();

  // Disable readonly on user click/touch
  const unlockInputs = () => {
    setReadOnlyState(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!username.trim() || !password) {
      setError("Please enter both username and password.");
      setLoading(false);
      return;
    }

    try {
      const res = await login(username.trim(), password);
      if (!res.success) {
        setError(res.error || "Invalid username or password. Check credentials.");
      } else {
        setAuthSource(res.source);
      }
    } catch (err) {
      setError("An unexpected error occurred during login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-brand-black relative overflow-hidden px-4 sm:px-6 lg:px-8">
      {/* Background Decorative Tech Elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-neon/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-brand-lime/10 rounded-full blur-3xl pointer-events-none translate-y-1/2"></div>
      
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(#333333_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none"></div>

      <div className="max-w-md w-full relative z-10">
        {/* Top Authorized Refurbisher Badge */}
        <div className="flex items-center justify-center gap-2 mb-6 text-xs font-semibold uppercase tracking-wider text-brand-neon bg-brand-surface/80 border border-brand-neon/30 py-1.5 px-4 rounded-full w-fit mx-auto shadow-sm backdrop-blur-md">
          <ShieldCheck className="w-4 h-4 text-brand-neon" />
          <span>Microsoft Authorized Refurbisher (USA & LATAM)</span>
        </div>

        {/* Card Box */}
        <div className="bg-brand-surface/90 border border-brand-border rounded-2xl p-8 shadow-2xl backdrop-blur-xl transition-all duration-300">
          {/* Brand Logo & Header */}
          <div className="text-center mb-7">
            <div className="flex justify-center mb-3">
              <img 
                src="/brand/logo-white.png" 
                alt="MiNZTECH Logo" 
                className="h-28 sm:h-32 w-auto max-w-[280px] object-contain drop-shadow-2xl transition-transform hover:scale-105"
              />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Operations Portal</h1>
            <p className="text-sm text-gray-400 mt-1">Enterprise Laptop Refurbishing & Distribution</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-red-950/50 border border-red-500/40 text-red-200 text-sm flex items-center gap-2.5 animate-shake">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Form with STRICT ANTI-AUTOFILL: Decoys, readonly trick, and autocomplete disabled */}
          <form 
            onSubmit={handleSubmit} 
            autoComplete="off" 
            autoCorrect="off" 
            autoCapitalize="off" 
            spellCheck="false"
            data-form-type="other"
            className="space-y-5"
          >
            {/* Hidden decoy inputs to foil browser autofill interceptors */}
            <input 
              type="text" 
              name="fake_username_decoy" 
              tabIndex={-1} 
              autoComplete="off" 
              style={{ display: "none" }} 
              aria-hidden="true" 
            />
            <input 
              type="password" 
              name="fake_password_decoy" 
              tabIndex={-1} 
              autoComplete="off" 
              style={{ display: "none" }} 
              aria-hidden="true" 
            />

            {/* Username Input */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-2">
                Username
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <User className="w-5 h-5" />
                </div>
                <input
                  ref={usernameRef}
                  type="text"
                  name="minztech_account_user_id"
                  id="minztech_account_user_id"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onFocus={unlockInputs}
                  onClick={unlockInputs}
                  readOnly={readOnlyState}
                  autoComplete="off"
                  role="presentation"
                  placeholder="Enter your assigned username"
                  className="w-full pl-11 pr-4 py-3 bg-brand-dark/90 border border-brand-border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-neon focus:border-brand-neon text-sm transition-all duration-200"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-xs text-brand-lime hover:text-brand-neon transition-colors"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  ref={passwordRef}
                  type={showPassword ? "text" : "password"}
                  name="minztech_account_user_token"
                  id="minztech_account_user_token"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={unlockInputs}
                  onClick={unlockInputs}
                  readOnly={readOnlyState}
                  autoComplete="new-password"
                  role="presentation"
                  placeholder="Enter your secure password"
                  className="w-full pl-11 pr-4 py-3 bg-brand-dark/90 border border-brand-border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-neon focus:border-brand-neon text-sm transition-all duration-200 font-mono"
                />
              </div>
            </div>

            {/* Login Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-brand-neon hover:bg-brand-lime text-brand-black font-bold text-sm rounded-xl shadow-lg transition-all duration-200 transform active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed group mt-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-brand-black border-t-transparent rounded-full animate-spin"></div>
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Portal</span>
                  <CheckCircle2 className="w-4 h-4 text-brand-black group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
