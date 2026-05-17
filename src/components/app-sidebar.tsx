"use client";

import * as React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { ChevronRight } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
import { modules, sidebarGroups, type ModuleConfig } from "@/navigation/modules";
import { useAuth } from "@/app/providers/auth-provider";
import { hasPermission } from "@/lib/permissions";

const teams = [
  {
    name: "Chapter",
    logo: <img src="/logo.svg" alt="Chapter" className="size-6 object-contain" />,
    plan: "Admin Dashboard",
  },
];

type SidebarEntry =
  | { kind: "item"; item: ModuleConfig }
  | { kind: "group"; group: (typeof sidebarGroups)[keyof typeof sidebarGroups]; items: ModuleConfig[] };

const buildEntries = (visible: ModuleConfig[]): SidebarEntry[] => {
  const entries: SidebarEntry[] = [];
  const groupIndex = new Map<string, number>();

  for (const item of visible) {
    if (!item.group) {
      entries.push({ kind: "item", item });
      continue;
    }
    const groupCfg = sidebarGroups[item.group];
    if (!groupCfg) {
      entries.push({ kind: "item", item });
      continue;
    }
    const existing = groupIndex.get(groupCfg.key);
    if (existing !== undefined) {
      const entry = entries[existing];
      if (entry.kind === "group") entry.items.push(item);
    } else {
      groupIndex.set(groupCfg.key, entries.length);
      entries.push({ kind: "group", group: groupCfg, items: [item] });
    }
  }
  return entries;
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth();
  const location = useLocation();

  const visible = modules.filter((m) => {
    if (m.showInSidebar === false) return false;
    if (m.requiredPermission === null) return true;
    return hasPermission(user?.access, m.requiredPermission);
  });

  const entries = buildEntries(visible);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={teams} />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {entries.map((entry) => {
                if (entry.kind === "item") {
                  const item = entry.item;
                  return (
                    <SidebarMenuItem key={item.key}>
                      <SidebarMenuButton asChild tooltip={item.label}>
                        <NavLink
                          to={item.path}
                          end={item.path === "/"}
                          className={({ isActive }) => (isActive ? "font-medium" : "")}
                        >
                          <item.icon />
                          <span>{item.label}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                }

                const { group, items } = entry;
                const GroupIcon = group.icon;
                const isAnyActive = items.some((i) =>
                  location.pathname === i.path ||
                  location.pathname.startsWith(`${i.path}/`)
                );

                return (
                  <Collapsible
                    key={group.key}
                    asChild
                    defaultOpen={isAnyActive}
                    className="group/collapsible"
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton tooltip={group.label}>
                          <GroupIcon />
                          <span>{group.label}</span>
                          <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {items.map((sub) => (
                            <SidebarMenuSubItem key={sub.key}>
                              <SidebarMenuSubButton asChild>
                                <NavLink
                                  to={sub.path}
                                  end={sub.path === "/"}
                                  className={({ isActive }) =>
                                    isActive ? "font-medium" : ""
                                  }
                                >
                                  <sub.icon />
                                  <span>{sub.label}</span>
                                </NavLink>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
