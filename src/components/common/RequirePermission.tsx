import { useAuth } from "@/app/providers/auth-provider";
import { hasPermission } from "@/lib/permissions";
import { Forbidden } from "./Forbidden";

interface RequirePermissionProps {
  permission: string | null;
  children: React.ReactNode;
}

export const RequirePermission = ({ permission, children }: RequirePermissionProps) => {
  const { user } = useAuth();
  if (permission === null) return <>{children}</>;
  if (!user) return <Forbidden permission={permission} />;
  if (!hasPermission(user.access, permission)) {
    return <Forbidden permission={permission} />;
  }
  return <>{children}</>;
};
