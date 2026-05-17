import { Navigate } from "react-router-dom";
import { LoginForm } from "@/components/login-form";
import { useAuth } from "@/app/providers/auth-provider";

export default function LoginPage() {
  const { status } = useAuth();

  if (status === "loading") {
    return (
      <div className="flex min-h-svh items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }
  if (status === "authenticated") return <Navigate to="/" replace />;
  if (status === "must-change-password") return <Navigate to="/complete-invite" replace />;

  return (
    <div className="light theme-rose flex min-h-svh flex-col items-center justify-center gap-6 bg-muted text-foreground p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <LoginForm />
      </div>
    </div>
  );
}
