export const reimbursementInclude = {
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      department: true,
      mobile: true,
      role: { select: { name: true } }
    }
  },
  approver: { select: { id: true, name: true } },
  reimburser: { select: { id: true, name: true } },
  items: { orderBy: { expenseDate: "asc" } }
};

export function parseDateOnly(value) {
  if (!value) return null;
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12));
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function isFutureDate(date) {
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);
  return date.getTime() > endOfToday.getTime();
}

export function parseItems(raw) {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function collectReceiptFiles(formData, itemCount) {
  const filesByItem = Array.from({ length: itemCount }, () => []);

  for (const key of formData.keys()) {
    const match = /^receipt_(\d+)_(\d+)$/.exec(key);
    if (!match) continue;
    const index = Number(match[1]);
    if (index < 0 || index >= itemCount) continue;
    const file = formData.get(key);
    if (file && typeof file !== "string" && file.size > 0) {
      filesByItem[index].push(file);
    }
  }

  return filesByItem;
}

export function validateItem(item, index) {
  const expenseDate = parseDateOnly(item?.expenseDate);
  if (!expenseDate) {
    return { error: `Expense line ${index + 1} needs a valid date.` };
  }
  if (isFutureDate(expenseDate)) {
    return { error: `Expense line ${index + 1} cannot have a future date.` };
  }

  const category = String(item?.category || "").trim();
  if (!category) {
    return { error: `Expense line ${index + 1} needs a category.` };
  }

  const description = String(item?.description || "").trim();
  if (!description) {
    return { error: `Expense line ${index + 1} needs a description.` };
  }

  const amount = Number.parseFloat(item?.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: `Expense line ${index + 1} needs an amount greater than zero.` };
  }

  return { expenseDate, category, description, amount };
}
