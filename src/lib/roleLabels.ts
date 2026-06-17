// Pure role constants, safe to import from client components (no DB imports).

export type Role = "admin" | "editor" | "viewer" | "analyst";

export const ROLES: Role[] = ["admin", "editor", "viewer", "analyst"];

export const ROLE_LABEL: Record<Role, string> = {
  admin: "Admin",
  editor: "View and edit",
  viewer: "View only",
  analyst: "Analytics only",
};

export const ROLE_HINT: Record<Role, string> = {
  admin: "Full access, plus invite and manage members",
  editor: "Create, edit, schedule, and send campaigns",
  viewer: "Read-only access to campaigns and analytics",
  analyst: "Analytics page only",
};
