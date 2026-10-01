import type { AppRole } from "@/types/auth";

const rank: Record<AppRole, number> = {
  client: 0,
  staff: 10,
  admin: 20,
  super_admin: 30,
};

export function isStaffRole(role: AppRole) {
  return rank[role] >= rank.staff;
}

export function canManageUsers(role: AppRole) {
  return rank[role] >= rank.admin;
}

export function canAssignRole(actor: AppRole, target: Exclude<AppRole, "super_admin">) {
  if (actor === "super_admin") {
    return target === "admin" || target === "staff" || target === "client";
  }

  if (actor === "admin") {
    return target === "staff" || target === "client";
  }

  return false;
}


export function canManageSiteSettings(role: AppRole) {
  return rank[role] >= rank.admin;
}

export function canViewAuditLog(role: AppRole) {
  return rank[role] >= rank.admin;
}
