import React, { createContext, useContext, useState, useEffect } from "react";
import { getUsers } from "../services/storage";
import { authenticateUserOnline } from "../services/supabaseClient";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check saved session
    const savedUser = localStorage.getItem("minztech_active_user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem("minztech_active_user");
      }
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    const localUsers = getUsers();
    const result = await authenticateUserOnline(username, password, localUsers);
    
    if (result.success) {
      setUser(result.user);
      localStorage.setItem("minztech_active_user", JSON.stringify(result.user));
      return { success: true, user: result.user, source: result.source };
    }
    
    return { success: false, error: result.error || "Authentication failed" };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("minztech_active_user");
  };

  const value = {
    user,
    isAdmin: user?.role === "Admin",
    isSuperAdmin: user?.username === "mt206.ruhit",
    login,
    logout,
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
