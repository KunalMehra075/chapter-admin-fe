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
  Layers,
  FileText,
  MessageSquare,
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
  content: {
    key: "content",
    label: "Content",
    icon: FileText,
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
    key: "tenets",
    path: "/tenets",
    label: "Tenets",
    icon: ShieldUser,
    requiredPermission: "tenets:read",
    Component: lazy(() => import("@/pages/tenets")),
    group: "userManagement",
  },
  {
    key: "operators",
    path: "/operators",
    label: "Operators",
    icon: UserCog,
    requiredPermission: "operators:read",
    Component: lazy(() => import("@/pages/operators")),
    group: "userManagement",
  },

  {
    key: "partners",
    path: "/partners",
    label: "Partners",
    icon: Users,
    requiredPermission: "partners:read",
    Component: lazy(() => import("@/pages/partners")),
    group: "userManagement",
  },
  {
    key: "adminGroups",
    path: "/admin-groups",
    label: "Admin Groups",
    icon: Layers,
    requiredPermission: "adminGroups:read",
    Component: lazy(() => import("@/pages/admin-groups")),
    group: "userManagement",
  },
  {
    key: "bottleMessages",
    path: "/bottle-messages",
    label: "Bottle Messages",
    icon: MessageSquare,
    requiredPermission: "bottleMessages:read",
    Component: lazy(() => import("@/pages/bottle-messages")),
    group: "content",
  },
];
