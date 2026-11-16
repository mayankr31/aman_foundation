"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/useAuth";

const cache = new Map();

export function clearSurveyTemplateCache(key) {
  if (key) cache.delete(key);
  else cache.clear();
}

/**
 * Loads an admin-editable survey template. Results are cached for the session
 * so the form, viewer and PDF export do not refetch on every render.
 */
export function useSurveyTemplate(key) {
  const { token } = useAuth();
  const [template, setTemplate] = useState(() => (key ? cache.get(key) || null : null));
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!key || !token) return;
    if (cache.has(key)) {
      setTemplate(cache.get(key));
      setError(null);
      return;
    }

    let cancelled = false;
    fetch(`/api/survey-templates/${key}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return;
        if (json.success && json.data) {
          cache.set(key, json.data);
          setTemplate(json.data);
          setError(null);
        } else {
          setError(json.error || "Failed to load survey template");
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Failed to load survey template");
      });

    return () => {
      cancelled = true;
    };
  }, [key, token]);

  return { template, loading: !template && !error, error };
}

export default useSurveyTemplate;
