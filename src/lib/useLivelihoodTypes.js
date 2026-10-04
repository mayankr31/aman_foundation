"use client";

import { useState, useEffect, useCallback } from "react";
import { LIVELIHOOD_TYPES } from "@/lib/livelihoodTypes";

let cache = null;
let inflight = null;

async function loadTypes(token) {
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch("/api/livelihood/types?includeInactive=1", { headers });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to load livelihood types");
      cache = json.data;
      return cache;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

export function resolveTypeConfig(typeKey, types) {
  const dbType = (types || []).find((t) => t.key === typeKey);
  if (dbType) {
    return {
      key: dbType.key,
      category: dbType.category,
      label: dbType.label,
      icon: dbType.icon,
      description: dbType.description,
      programTargetUnit: dbType.programTargetUnit,
      fields: dbType.fields || [],
      eventTypes: dbType.eventTypes || [],
      tableColumns: dbType.tableColumns || [],
      kpiCards: dbType.kpiCards || [],
    };
  }
  return LIVELIHOOD_TYPES[typeKey] || null;
}

export function useLivelihoodTypes(token) {
  const [types, setTypes] = useState(cache || []);
  const [loading, setLoading] = useState(!cache);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token || cache) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await loadTypes(token);
        if (cancelled) return;
        setTypes(data);
        setError(null);
      } catch (err) {
        console.error("Load livelihood types error:", err);
        if (!cancelled) setError(err.message || "Failed to load livelihood types");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const refresh = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await loadTypes(token);
      setTypes(data);
    } catch (err) {
      console.error("Load livelihood types error:", err);
      setError(err.message || "Failed to load livelihood types");
    } finally {
      setLoading(false);
    }
  }, [token]);

  const getTypeConfig = useCallback((typeKey) => resolveTypeConfig(typeKey, types), [types]);

  const getTypesByCategory = useCallback(
    (category, { includeInactive = false } = {}) =>
      (types || []).filter(
        (t) => t.category === category && (includeInactive || t.active)
      ),
    [types]
  );

  return { types, loading, error, refresh, getTypeConfig, getTypesByCategory };
}
