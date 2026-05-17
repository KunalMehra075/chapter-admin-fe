import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/app/providers/auth-provider";

export const RequireAuth = ({ children }: { children: React.ReactNode }) => {
  const { status } = useAuth();
  const location = useLocation();

  if (status === "loading") {
    return (
      <div className="flex min-h-svh items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (status === "must-change-password") {
    return <Navigate to="/complete-invite" replace />;
  }

  if (status !== "authenticated") {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
};
