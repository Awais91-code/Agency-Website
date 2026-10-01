export const appRoles = ["super_admin", "admin", "staff", "client"] as const;
export type AppRole = (typeof appRoles)[number];

export type AuthContext = {
  userId: string;
  email: string | null;
  role: AppRole;
  displayName: string | null;
};
