import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminGroupList } from "@/hooks/useAdminGroups";
import { usePermissionsCatalog } from "@/hooks/usePermissionsCatalog";
import type { AdminGroupRole } from "@/api/admin-groups";

interface Props {
  role: AdminGroupRole;
  value: string | null;
  onChange: (groupId: string) => void;
}

const formatPermissions = (
  access: string[],
  modules: { key: string; label: string }[]
): string[] => {
  if (access.includes("*")) return ["Full access (all modules)"];
  const labelByKey = new Map(modules.map((m) => [m.key, m.label]));
  const grouped = new Map<string, string[]>();
  for (const p of access) {
    const [mod, action] = p.split(":");
    if (!mod) continue;
    const label = labelByKey.get(mod) ?? mod;
    const list = grouped.get(label) ?? [];
    list.push(action ?? "");
    grouped.set(label, list);
  }
  return Array.from(grouped.entries()).map(([label, actions]) => {
    if (actions.includes("*")) return `${label}: all`;
    return `${label}: ${actions.join(", ")}`;
  });
};

export function AdminGroupPicker({ role, value, onChange }: Props) {
  const { data, isLoading, isError, error } = useAdminGroupList({
    role,
    limit: 100,
  });
  const { data: catalog } = usePermissionsCatalog();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const groups = data?.data ?? [];

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-sm text-destructive">
        {(error as Error)?.message ?? "Failed to load admin groups."}
      </p>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
        No admin groups exist for this role yet. Create one in <strong>Admin Groups</strong> first.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">
        Pick the group whose permissions this user should inherit. Edit the
        group later to update all members at once.
      </p>
      <div className="space-y-2">
        {groups.map((g) => {
          const selected = g.id === value;
          const expanded = expandedId === g.id;
          const lines = catalog
            ? formatPermissions(g.access, catalog.modules)
            : [];
          return (
            <div
              key={g.id}
              className={`rounded-md border p-3 ${
                selected ? "border-primary bg-primary/5" : ""
              }`}
            >
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="adminGroup"
                  className="mt-1 size-4"
                  checked={selected}
                  onChange={() => onChange(g.id)}
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{g.name}</div>
                    <div className="text-xs text-muted-foreground">
                      Used by {g.memberCount ?? 0}{" "}
                      {(g.memberCount ?? 0) === 1 ? "member" : "members"}
                    </div>
                  </div>
                  {g.tags.length > 0 ? (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {g.tags.map((t) => (
                        <span
                          key={t}
                          className="rounded bg-muted px-1.5 py-0.5 text-xs"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="mt-1 -ml-2 h-7 px-2 text-xs"
                    onClick={(e) => {
                      e.preventDefault();
                      setExpandedId(expanded ? null : g.id);
                    }}
                  >
                    {expanded ? (
                      <ChevronDown className="size-3" />
                    ) : (
                      <ChevronRight className="size-3" />
                    )}
                    What this group grants
                  </Button>
                  {expanded ? (
                    <ul className="mt-1 list-disc pl-5 text-xs text-muted-foreground">
                      {lines.length === 0 ? (
                        <li>No permissions configured.</li>
                      ) : (
                        lines.map((l) => <li key={l}>{l}</li>)
                      )}
                    </ul>
                  ) : null}
                </div>
              </label>
            </div>
          );
        })}
      </div>
    </div>
  );
}
