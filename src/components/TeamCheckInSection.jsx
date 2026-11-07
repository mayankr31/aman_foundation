"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/useAuth";
import { formatDate, toISODateOnly } from "@/lib/date";
import { checkInTypeLabel, canRoleHaveTeamCheckIn } from "@/lib/teamCheckIn";
import TeamCheckInFormModal from "@/components/TeamCheckInFormModal";
import TeamCheckInViewModal from "@/components/TeamCheckInViewModal";

function CheckInCard({ checkIn, onView, onEdit, canEdit }) {
  const dateLabel = formatDate(toISODateOnly(checkIn.date));
  const promiseCount = checkIn.promises?.length || 0;

  return (
    <article className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-11 h-11 shrink-0 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">event_note</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-on-surface">{dateLabel}</p>
            <p className="text-[11px] text-on-surface-variant mt-0.5">
              {checkInTypeLabel(checkIn.checkInType)}
              {checkIn.areaOfWork ? ` · ${checkIn.areaOfWork}` : ""}
            </p>
          </div>
        </div>
        <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
          Submitted
        </span>
      </div>

      {checkIn.topPriorities && (
        <p className="text-xs text-on-surface-variant line-clamp-3 whitespace-pre-wrap">
          {checkIn.topPriorities}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <span className="text-[11px] font-medium text-on-surface-variant">
          {promiseCount} action item{promiseCount === 1 ? "" : "s"}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onView(checkIn)}
            className="px-3 py-1.5 rounded-full border border-outline-variant text-xs font-semibold text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
          >
            View
          </button>
          {canEdit && (
            <button
              type="button"
              onClick={() => onEdit(checkIn)}
              className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors cursor-pointer inline-flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[14px]">edit</span>
              Edit
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

export default function TeamCheckInSection({
  userId,
  memberName = "",
  memberRole = "",
  memberManagerId = null,
}) {
  const { token, user: currentUser } = useAuth();
  const [checkIns, setCheckIns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewing, setViewing] = useState(null);
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);

  const isOwner = Boolean(currentUser?.id && userId && currentUser.id === userId);
  const isAdmin = currentUser?.roleName === "ADMIN";
  const isManager = Boolean(memberManagerId && currentUser?.id === memberManagerId);
  const canManageFields = isAdmin || isManager;
  const canEditAny = isOwner || canManageFields;
  const canCreate = isOwner && canRoleHaveTeamCheckIn(memberRole?.name || memberRole);

  const load = useCallback(async () => {
    if (!token || !userId) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/team-check-ins?userId=${encodeURIComponent(userId)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error || "Could not load Team Check-Ins.");
      }
      setCheckIns(json.data || []);
    } catch (err) {
      setError(err.message || "Could not load Team Check-Ins.");
    } finally {
      setLoading(false);
    }
  }, [token, userId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSaved = () => {
    setCreating(false);
    setEditing(null);
    load();
  };

  return (
    <div className="space-y-4 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-on-surface">Team CheckIn</h2>
          <p className="text-xs text-on-surface-variant mt-0.5">
            {isOwner
              ? "Share your update, reflections, support needs and promises."
              : "Review the update, add your notes and track agreed action items."}
          </p>
        </div>
        {canCreate && (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="w-full sm:w-auto justify-center inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-white text-sm font-semibold hover:bg-primary-container transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            New Check-In
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-error/30 bg-error/5 px-4 py-6 text-center">
          <span className="material-symbols-outlined text-error text-3xl">error</span>
          <p className="text-sm font-semibold text-on-surface mt-2">{error}</p>
        </div>
      ) : checkIns.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-outline-variant bg-surface-container-lowest px-4 py-12 text-center">
          <span className="material-symbols-outlined text-on-surface-variant/60 text-4xl">
            fact_check
          </span>
          <p className="text-sm font-semibold text-on-surface mt-2">No check-ins yet</p>
          <p className="text-xs text-on-surface-variant mt-1">
            {isOwner
              ? "Start a new check-in to share your update."
              : "This team member has not submitted a Team Check-In yet."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
          {checkIns.map((checkIn) => (
            <CheckInCard
              key={checkIn.id}
              checkIn={checkIn}
              canEdit={canEditAny}
              onView={setViewing}
              onEdit={setEditing}
            />
          ))}
        </div>
      )}

      {viewing && (
        <TeamCheckInViewModal
          checkIn={viewing}
          memberName={memberName}
          memberRole={memberRole}
          canEdit={canEditAny}
          onClose={() => setViewing(null)}
          onEdit={() => {
            setEditing(viewing);
            setViewing(null);
          }}
        />
      )}

      {(creating || editing) && (
        <TeamCheckInFormModal
          checkIn={editing}
          memberName={memberName}
          memberRole={memberRole}
          isOwner={isOwner}
          canEditManagerFields={canManageFields}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
