import { prisma } from "@/lib/prisma";
import { dateKeyToUTCDate, getISTDateKey } from "@/lib/time";
import { getReportingScopeUserIds } from "@/lib/hierarchy";
import {
  getAdminUserIds,
  notifyUsers,
  NOTIFICATION_TYPES,
} from "@/lib/notifications";
import { parseDateOnly, parseLegacyLeaveRange } from "@/lib/leaves";
import { formatRoleLabel } from "@/lib/roles";

const SWEEP_DATE_KEY = "__amanBirthdaySweepDate";
const SWEEP_AT_KEY = "__amanBirthdaySweepAt";
const SWEEP_THROTTLE_MS = 15 * 60 * 1000;

function birthdayKey(value) {
  if (!value) return null;
  return getISTDateKey(value).slice(5);
}

function userScopeWhere(scope) {
  return Array.isArray(scope) ? { id: { in: scope.length ? scope : ["__none__"] } } : {};
}

async function findTodayBirthdays(scope) {
  const todayMonthDay = getISTDateKey().slice(5);
  const users = await prisma.user.findMany({
    where: {
      ...userScopeWhere(scope),
      status: "ACTIVE",
      dob: { not: null },
    },
    select: {
      id: true,
      name: true,
      dob: true,
      avatar: true,
      department: true,
      role: { select: { name: true } },
    },
    orderBy: { name: "asc" },
  });

  return users.filter((user) => birthdayKey(user.dob) === todayMonthDay);
}

/**
 * Creates one in-app notification per birthday employee for their direct
 * manager and every active admin. Runs lazily (there is no background job
 * runner in this app) and is deduplicated by Notification.dedupeKey.
 */
export async function ensureBirthdayNotifications(now = new Date()) {
  const todayKey = getISTDateKey(now);
  const lastDate = globalThis[SWEEP_DATE_KEY];
  const lastAt = Number(globalThis[SWEEP_AT_KEY] || 0);
  if (lastDate === todayKey && Date.now() - lastAt < SWEEP_THROTTLE_MS) return;

  try {
    const todayMonthDay = todayKey.slice(5);
    const [users, adminIds] = await Promise.all([
      prisma.user.findMany({
        where: { status: "ACTIVE", dob: { not: null } },
        select: {
          id: true,
          name: true,
          dob: true,
          managerId: true,
          role: { select: { name: true } },
        },
      }),
      getAdminUserIds(),
    ]);

    const birthdayUsers = users.filter((user) => birthdayKey(user.dob) === todayMonthDay);

    for (const birthdayUser of birthdayUsers) {
      const recipients = [...new Set([birthdayUser.managerId, ...adminIds])].filter(
        (id) => id && id !== birthdayUser.id
      );
      if (!recipients.length) continue;

      const roleLabel = birthdayUser.role?.name
        ? ` (${formatRoleLabel(birthdayUser.role.name)})`
        : "";

      await notifyUsers(recipients, {
        type: NOTIFICATION_TYPES.EMPLOYEE_BIRTHDAY,
        title: `Birthday today: ${birthdayUser.name}`,
        message: `${birthdayUser.name}${roleLabel} has a birthday today.`,
        link: `/hr/${birthdayUser.id}`,
        metadata: { employeeId: birthdayUser.id, dateKey: todayKey },
        dedupeKey: `employee-birthday:${birthdayUser.id}:${todayKey}`,
      });
    }

    globalThis[SWEEP_DATE_KEY] = todayKey;
    globalThis[SWEEP_AT_KEY] = Date.now();
  } catch (error) {
    console.error("Birthday notification sweep error:", error);
  }
}

export async function getTodayBirthdays(user) {
  const scope = await getReportingScopeUserIds(user, { includeSelf: false });
  if (Array.isArray(scope) && scope.length === 0) {
    return { items: [], hasTeam: false };
  }

  const matches = await findTodayBirthdays(scope);
  const items = matches.map((person) => {
    const copy = { ...person };
    delete copy.dob;
    return copy;
  });
  return { items, hasTeam: scope === null || scope.length > 0 };
}

export async function getTodayLeaves(user) {
  const scope = await getReportingScopeUserIds(user, {
    includeSelf: false,
    activeOnly: true,
  });
  if (Array.isArray(scope) && scope.length === 0) {
    return { items: [], hasTeam: false };
  }

  const todayKey = getISTDateKey();
  const todayDate = dateKeyToUTCDate(todayKey);
  if (!todayDate) return { items: [], hasTeam: false };

  const leaves = await prisma.leave.findMany({
    where: {
      status: "APPROVED",
      ...(Array.isArray(scope) ? { userId: { in: scope } } : {}),
      user: { status: "ACTIVE" },
      OR: [
        { startDate: { lte: todayDate }, endDate: { gte: todayDate } },
        { startDate: null },
        { endDate: null },
      ],
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatar: true,
          department: true,
          role: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const byUser = new Map();
  for (const leave of leaves) {
    if (leave.userId === user.id) continue;

    const legacy = parseLegacyLeaveRange(leave.dates);
    const startDate = leave.startDate ? parseDateOnly(leave.startDate) : legacy.startDate;
    const endDate = leave.endDate ? parseDateOnly(leave.endDate) : legacy.endDate || startDate;
    if (!startDate || !endDate) continue;
    if (startDate > todayDate || endDate < todayDate) continue;

    const existing = byUser.get(leave.userId);
    if (existing) {
      if (leave.type && !existing.leaveTypes.includes(leave.type)) {
        existing.leaveTypes.push(leave.type);
      }
      continue;
    }

    byUser.set(leave.userId, {
      id: leave.id,
      user: leave.user,
      leaveTypes: leave.type ? [leave.type] : [],
      dates: leave.dates,
      startDate,
      endDate,
    });
  }

  const items = [...byUser.values()].sort((a, b) =>
    String(a.user?.name || "").localeCompare(String(b.user?.name || ""))
  );

  return { items, hasTeam: scope === null || scope.length > 0 };
}

export async function getTeamToday(user) {
  const [birthdays, leaves] = await Promise.all([
    getTodayBirthdays(user),
    getTodayLeaves(user),
  ]);

  return {
    date: getISTDateKey(),
    hasTeam: birthdays.hasTeam || leaves.hasTeam,
    birthdays: birthdays.items,
    onLeave: leaves.items,
  };
}
