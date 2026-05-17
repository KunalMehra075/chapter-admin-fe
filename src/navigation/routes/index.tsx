import { Suspense } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";

import DashboardLayout from "@/layouts/dashboard-layout";
import LoginPage from "@/pages/auth/login";
import CompleteInvitePage from "@/pages/auth/complete-invite";
import ForgotPasswordPage from "@/pages/auth/forgot-password";
import ResetPasswordPage from "@/pages/auth/reset-password";

import { RequireAuth } from "@/components/common/RequireAuth";
import { RequirePermission } from "@/components/common/RequirePermission";
import { modules } from "@/navigation/modules";

const PageFallback = () => (
  <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
    Loading…
  </div>
);

const dashboardChildren = modules.map((m) => {
  const Component = m.Component;
  return {
    path: m.path === "/" ? undefined : m.path.replace(/^\//, ""),
    index: m.path === "/",
    element: (
      <RequirePermission permission={m.requiredPermission}>
        <Suspense fallback={<PageFallback />}>
          <Component />
        </Suspense>
      </RequirePermission>
    ),
  };
});

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  { path: "/complete-invite", element: <CompleteInvitePage /> },
  { path: "/forgot-password", element: <ForgotPasswordPage /> },
  { path: "/reset-password", element: <ResetPasswordPage /> },
  {
    path: "/",
    element: (
      <RequireAuth>
        <DashboardLayout />
      </RequireAuth>
    ),
    children: dashboardChildren,
  },
  { path: "*", element: <Navigate to="/" replace /> },
]);
