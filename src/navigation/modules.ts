import { lazy, type LazyExoticComponent, type ComponentType } from "react";
import {
  Home,
  UsersIcon,
  MapIcon,
  BookMarkedIcon,
  BarChart3,
  ShieldUser,
  UserCog,
  Users,
  UserRoundCog,
  type LucideIcon,
} from "lucide-react";

export interface SidebarGroupConfig {
  key: string;
  label: string;
  icon: LucideIcon;
}

export const sidebarGroups: Record<string, SidebarGroupConfig> = {
  userManagement: {
    key: "userManagement",
    label: "User Management",
    icon: UserRoundCog,
  },
};

export interface ModuleConfig {
  key: string;
  path: string;
  label: string;
  icon: LucideIcon;
  requiredPermission: string | null;
  Component: LazyExoticComponent<ComponentType>;
  // showInSidebar defaults to true; some routes (detail/edit pages) may be hidden later
  showInSidebar?: boolean;
  // Optional group key — if set, this item nests under the corresponding sidebar group.
  group?: keyof typeof sidebarGroups;
}

export const modules: ModuleConfig[] = [
  {
    key: "dashboard",
    path: "/",
    label: "Dashboard",
    icon: Home,
    requiredPermission: null,
    Component: lazy(() => import("@/pages/dashboard")),
  },
  {
    key: "waitlist",
    path: "/waitlist",
    label: "Waitlist",
    icon: UsersIcon,
    requiredPermission: "waitlist:read",
    Component: lazy(() => import("@/pages/waitlist")),
  },
  {
    key: "stats",
    path: "/stats",
    label: "Stats",
    icon: BarChart3,
    requiredPermission: "stats:read",
    Component: lazy(() => import("@/pages/stats")),
  },
  {
    key: "places",
    path: "/places",
    label: "Places",
    icon: MapIcon,
    requiredPermission: null,
    Component: lazy(() => import("@/pages/places")),
  },
  {
    key: "storylines",
    path: "/storylines",
    label: "Storylines",
    icon: BookMarkedIcon,
    requiredPermission: null,
    Component: lazy(() => import("@/pages/storylines")),
  },
  {
    key: "superusers",
    path: "/superusers",
    label: "SuperUsers",
    icon: UserCog,
    requiredPermission: "superusers:read",
    Component: lazy(() => import("@/pages/superusers")),
    group: "userManagement",
  },
  {
    key: "operators",
    path: "/operators",
    label: "Operators",
    icon: ShieldUser,
    requiredPermission: "operators:read",
    Component: lazy(() => import("@/pages/operators")),
    group: "userManagement",
  },
  {
    key: "admins",
    path: "/admins",
    label: "Admins",
    icon: Users,
    requiredPermission: "admins:read",
    Component: lazy(() => import("@/pages/admins")),
    group: "userManagement",
  },
];
