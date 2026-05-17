import { useMemo } from "react";
import { usePermissionsCatalog } from "@/hooks/usePermissionsCatalog";
import { useAuth } from "@/app/providers/auth-provider";
import { hasPermission } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * The access table presents three "effective" columns to the user:
 *   ALL   → module:*           (covers create, read, update, delete)
 *   WRITE → module:create + module:update
 *   READ  → module:read
 *   DELETE→ module:delete
 *
 * Backend stores the four granular actions; the UI groups create+update under WRITE.
 */

const COLUMNS = ["ALL", "WRITE", "READ", "DELETE"] as const;
type Column = (typeof COLUMNS)[number];

const writeActions = ["create", "update"];

interface AccessTableFieldProps {
  /** Currently selected permissions, e.g. ["waitlist:read", "admins:*"] */
  value: string[];
  onChange: (next: string[]) => void;
  /** Defaults button — sets value to the role's default access. */
  onApplyDefaults?: () => void;
  defaultsLabel?: string;
}

const columnActions = (col: Column): string[] => {
  if (col === "ALL") return ["*"];
  if (col === "WRITE") return writeActions;
  if (col === "READ") return ["read"];
  return ["delete"];
};

const isColumnChecked = (
  module: string,
  col: Column,
  value: string[]
): boolean => {
  if (value.includes("*")) return true;
  if (value.includes(`${module}:*`)) return true;
  const required = columnActions(col);
  return required.every((a) => value.includes(`${module}:${a}`));
};

const isColumnAvailable = (
  module: string,
  col: Column,
  catalogActions: string[],
  creatorAccess: string[]
): boolean => {
  if (col === "ALL") {
    // ALL available if creator can grant any combination → require they can grant module:*
    return hasPermission(creatorAccess, `${module}:*`);
  }
  for (const a of columnActions(col)) {
    if (!catalogActions.includes(a)) return false;
  }
  return columnActions(col).every((a) =>
    hasPermission(creatorAccess, `${module}:${a}`)
  );
};

const toggleColumn = (
  module: string,
  col: Column,
  checked: boolean,
  value: string[]
): string[] => {
  let next = value.filter(
    (p) => p !== "*" && p !== `${module}:*` && !p.startsWith(`${module}:`)
  );
  // Re-add the other modules' wildcards / entries unaffected by our filter (the filter only removed this module's entries).
  if (!checked) {
    return value
      .filter((p) => {
        if (p === "*") return true; // global wildcard preserved
        if (p === `${module}:*`) return col !== "ALL"; // remove ALL marker only if unchecked
        if (p.startsWith(`${module}:`)) {
          const action = p.split(":")[1]!;
          if (col === "READ") return action !== "read";
          if (col === "DELETE") return action !== "delete";
          if (col === "WRITE") return !writeActions.includes(action);
        }
        return true;
      })
      // dedupe
      .filter((p, i, arr) => arr.indexOf(p) === i);
  }
  // checked
  if (col === "ALL") {
    next = next.filter((p) => p !== `${module}:*`);
    next.push(`${module}:*`);
  } else {
    for (const a of columnActions(col)) {
      const perm = `${module}:${a}`;
      if (!next.includes(perm)) next.push(perm);
    }
  }
  return next;
};

export function AccessTableField({
  value,
  onChange,
  onApplyDefaults,
  defaultsLabel,
}: AccessTableFieldProps) {
  const { data: catalog, isLoading } = usePermissionsCatalog();
  const { user } = useAuth();
  const creatorAccess = user?.access ?? [];

  const visibleModules = useMemo(() => {
    if (!catalog) return [];
    return catalog.modules.filter((m) =>
      COLUMNS.some((c) => isColumnAvailable(m.key, c, m.actions, creatorAccess))
    );
  }, [catalog, creatorAccess]);

  if (isLoading || !catalog) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Select what this user can do in each module.
        </div>
        {onApplyDefaults ? (
          <Button type="button" variant="outline" size="sm" onClick={onApplyDefaults}>
            {defaultsLabel ?? "Use role defaults"}
          </Button>
        ) : null}
      </div>

      <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-left">
              <th className="p-3 font-medium">Module</th>
              {COLUMNS.map((c) => (
                <th key={c} className="w-24 p-3 text-center font-medium">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleModules.map((m) => (
              <tr key={m.key} className="border-b last:border-0">
                <td className="p-3 font-medium">{m.label}</td>
                {COLUMNS.map((c) => {
                  const available = isColumnAvailable(
                    m.key,
                    c,
                    m.actions,
                    creatorAccess
                  );
                  const checked = isColumnChecked(m.key, c, value);
                  return (
                    <td key={c} className="p-3 text-center">
                      {available ? (
                        <input
                          type="checkbox"
                          className="h-4 w-4 cursor-pointer"
                          checked={checked}
                          onChange={(e) =>
                            onChange(toggleColumn(m.key, c, e.target.checked, value))
                          }
                        />
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
            {visibleModules.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS.length + 1} className="p-6 text-center text-muted-foreground">
                  You don&apos;t have permission to grant access to any module.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
