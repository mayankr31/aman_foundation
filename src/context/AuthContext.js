"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

const AuthContext = createContext(null);

const encodeData = (data) => btoa(encodeURIComponent(JSON.stringify(data)));
const decodeData = (encodedData) => {
  try {
    return JSON.parse(decodeURIComponent(atob(encodedData)));
  } catch {
    try {
      return JSON.parse(encodedData);
    } catch {
      return null;
    }
  }
};

function samePermissions(a, b) {
  try {
    return JSON.stringify(a || {}) === JSON.stringify(b || {});
  } catch {
    return false;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const pathname = usePathname();
  const versionRef = useRef(null);
  const inFlightRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const persistUser = useCallback((nextUser) => {
    setUser(nextUser);
    if (typeof window !== "undefined") {
      localStorage.setItem("user", encodeData(nextUser));
    }
  }, []);

  const refreshPermissions = useCallback(async () => {
    if (!token) return null;
    if (inFlightRef.current) return inFlightRef.current;

    const request = fetch("/api/permissions/effective", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (res.status === 401 || res.status === 403) throw new Error("Unauthorized");
        if (!res.ok) return null;
        const json = await res.json();
        if (!json.success || !mountedRef.current) return null;

        const next = {
          ...(decodeData(localStorage.getItem("user") || "") || {}),
          roleId: json.data.roleId,
          roleName: json.data.roleName,
          permissions: json.data.permissions || {},
        };
        versionRef.current = json.data.version || null;
        setUser((prev) => {
          const merged = { ...(prev || {}), ...next };
          localStorage.setItem("user", encodeData(merged));
          return merged;
        });
        return json.data;
      })
      .catch((err) => {
        if (String(err?.message || "").includes("Unauthorized")) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setUser(null);
          setToken(null);
          window.location.href = "/login";
        }
        return null;
      })
      .finally(() => {
        inFlightRef.current = null;
      });

    inFlightRef.current = request;
    return request;
  }, [token]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(decodeData(storedUser));
    }
    setIsInitializing(false);

    if (!storedToken) return;

    fetch("/api/users/profile", {
      headers: { Authorization: `Bearer ${storedToken}` },
    })
      .then((res) => {
        if (res.status === 401 || res.status === 403) throw new Error("Unauthorized");
        return res.json();
      })
      .then((json) => {
        if (json.success && mountedRef.current) {
          const freshUser = {
            id: json.data.id,
            username: json.data.username,
            email: json.data.email,
            roleId: json.data.roleId,
            roleName: json.data.role.name,
            name: json.data.name,
            avatar: json.data.avatar || json.data.fellow?.avatar || null,
            fellowId: json.data.fellow?.id || null,
            fellowName: json.data.fellow?.name || null,
            managerId: json.data.managerId || null,
            permissions: json.data.permissions || {},
          };
          persistUser(freshUser);
        } else if (mountedRef.current) {
          throw new Error("Token invalid");
        }
      })
      .catch(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
        setToken(null);
        window.location.href = "/login";
      });
  }, [persistUser]);

  // Keep the effective permission map in sync with role/user overrides.
  useEffect(() => {
    if (!token) return;
    refreshPermissions();

    const onFocus = () => refreshPermissions();
    const onStorage = (event) => {
      if (event.key === "user" && event.newValue) {
        setUser(decodeData(event.newValue));
      }
      if (event.key === "token" && !event.newValue) {
        setUser(null);
        setToken(null);
      }
    };
    const interval = setInterval(refreshPermissions, 30000);
    window.addEventListener("focus", onFocus);
    window.addEventListener("storage", onStorage);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("storage", onStorage);
    };
  }, [token, refreshPermissions]);

  useEffect(() => {
    if (token) refreshPermissions();
  }, [pathname, token, refreshPermissions]);

  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem("token", authToken);
    localStorage.setItem("user", encodeData(userData));
    window.location.href = "/";
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  const can = (page, action = "READ") => {
    if (!page) return true;
    // ADMIN is a true superadmin and bypasses all overrides.
    if (user?.roleName === "ADMIN") return true;
    const perms = user?.permissions;
    if (!perms || typeof perms !== "object") return true;
    const pagePerms = perms[page];
    if (!pagePerms) return false;
    return action === "WRITE" ? !!pagePerms.write : !!pagePerms.read;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isInitializing,
        login,
        logout,
        can,
        refreshPermissions,
        setUser: persistUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}

export { samePermissions };
