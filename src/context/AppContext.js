'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const AppContext = createContext();

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
}

// Obfuscation wrappers matching kvskhelsathi pattern
const encodeData = (data) => btoa(encodeURIComponent(JSON.stringify(data)));
const decodeData = (encodedData) => {
  try {
    return JSON.parse(decodeURIComponent(atob(encodedData)));
  } catch (e) {
    try {
      return JSON.parse(encodedData);
    } catch (err) {
      return null;
    }
  }
};

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0);

  const router = useRouter();
  const pathname = usePathname();

  // Load Auth state from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(decodeData(storedUser));
      }
      setIsInitializing(false);
    }
  }, []);

  const refreshPendingCount = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (res.ok && json.success) {
        const pending = (json.data || []).filter(u => u.status === 'PENDING');
        setPendingApprovalsCount(pending.length);
      }
    } catch (error) {
      console.error("Failed to fetch pending count", error);
    }
  };

  useEffect(() => {
    if (token && user?.roleName === 'ADMIN') {
      refreshPendingCount();
    }
  }, [token, user, pathname]);

  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('token', authToken);
    localStorage.setItem('user', encodeData(userData));
    router.push('/');
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const value = {
    user,
    token,
    isInitializing,
    login,
    logout,
    pendingApprovalsCount,
    refreshPendingCount,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
