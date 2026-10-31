// Pure task permission helpers shared by client and server code.
// A task may be deleted by the Executive Director, by the person who created /
// assigned it, or by its assignee when it was self-created. A task assigned to
// someone by another person must not be deletable by the assignee.

export function canDeleteTaskRecord(user, task) {
  if (!user || !task) return false;
  if (user.roleName === "ADMIN" || user.role?.name === "ADMIN") return true;

  const userId = user.id;
  if (!userId) return false;

  if (task.assignedById) return task.assignedById === userId;
  return task.assigneeId === userId;
}
