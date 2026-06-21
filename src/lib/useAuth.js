"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

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

export function useAuth() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedToken = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(decodeData(storedUser));
      }
      setIsInitializing(false);

      if (storedToken) {
        fetch("/api/users/profile", {
          headers: { Authorization: `Bearer ${storedToken}` }
        })
          .then((res) => {
            if (res.status === 401 || res.status === 403) {
              throw new Error("Unauthorized");
            }
            return res.json();
          })
          .then((json) => {
            if (json.success) {
              const freshUser = {
                id: json.data.id,
                username: json.data.username,
                email: json.data.email,
                roleId: json.data.roleId,
                roleName: json.data.role.name,
                name: json.data.name,
                fellowId: json.data.fellow?.id || null,
                fellowName: json.data.fellow?.name || null,
              };
              localStorage.setItem("user", encodeData(freshUser));
              setUser(freshUser);
            } else {
              throw new Error("Token invalid");
            }
          })
          .catch((err) => {
            console.error("Background profile sync failed:", err);
            // If the token is invalid or expired, log the user out
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            setUser(null);
            setToken(null);
            window.location.href = "/login";
          });
      }
    }
  }, []);

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

  return {
    user,
    token,
    isInitializing,
    login,
    logout,
  };
}
