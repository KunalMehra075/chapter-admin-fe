import { useAuth } from "@/app/providers/auth-provider";
import {
  hasAllPermissions,
  hasAnyPermission,
  hasPermission,
} from "@/lib/permissions";

interface CanProps {
  permission?: string;
  anyOf?: string[];
  allOf?: string[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const Can = ({
  permission,
  anyOf,
  allOf,
  fallback = null,
  children,
}: CanProps) => {
  const { user } = useAuth();
  const access = user?.access;

  let allowed = true;
  if (permission) allowed = allowed && hasPermission(access, permission);
  if (anyOf?.length) allowed = allowed && hasAnyPermission(access, anyOf);
  if (allOf?.length) allowed = allowed && hasAllPermissions(access, allOf);

  return <>{allowed ? children : fallback}</>;
};

export const useCan = (permission: string): boolean => {
  const { user } = useAuth();
  return hasPermission(user?.access, permission);
};
