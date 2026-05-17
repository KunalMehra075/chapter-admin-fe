export const WILDCARD = "*";

export type Role = "operator" | "superuser" | "admin";

export const hasPermission = (
  userAccess: string[] | undefined | null,
  required: string
): boolean => {
  if (!userAccess || userAccess.length === 0) return false;
  if (userAccess.includes(WILDCARD)) return true;
  if (userAccess.includes(required)) return true;
  const [module] = required.split(":");
  if (!module) return false;
  return userAccess.includes(`${module}:${WILDCARD}`);
};

export const hasAnyPermission = (
  userAccess: string[] | undefined | null,
  required: string[]
): boolean => required.some((p) => hasPermission(userAccess, p));

export const hasAllPermissions = (
  userAccess: string[] | undefined | null,
  required: string[]
): boolean => required.every((p) => hasPermission(userAccess, p));
