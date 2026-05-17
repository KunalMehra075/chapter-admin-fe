import { useState, type FormEvent } from "react";
import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";

import { CommonHeader } from "@/components/common/CommonHeader";
import { Can } from "@/components/common/Can";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminGroupList } from "@/hooks/useAdminGroups";
import { useAuth } from "@/app/providers/auth-provider";
import type { AdminGroup, AdminGroupRole } from "@/api/admin-groups";

import { CreateAdminGroupWizard } from "./CreateAdminGroupWizard";
import { EditAdminGroupSheet } from "./EditAdminGroupSheet";
import { DeleteAdminGroupDialog } from "./DeleteAdminGroupDialog";

const PAGE_SIZE = 10;

const formatDate = (iso: string) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
};

const ROLE_TONE: Record<AdminGroupRole, string> = {
  operator: "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300",
  partner: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
};

export function AdminGroupsListPage() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [roleFilter, setRoleFilter] = useState<AdminGroupRole | "">("");

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<AdminGroup | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleting, setDeleting] = useState<AdminGroup | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data, isLoading, isError, error, isFetching } = useAdminGroupList({
    page,
    limit: PAGE_SIZE,
    search: search || undefined,
    role: roleFilter || undefined,
  });

  const groups = data?.data ?? [];
  const pagination = data?.pagination;

  const isTenet = user?.role === "tenet";

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  };

  const openEdit = (g: AdminGroup) => {
    setEditing(g);
    setEditOpen(true);
  };
  const openDelete = (g: AdminGroup) => {
    setDeleting(g);
    setDeleteOpen(true);
  };

  return (
    <div>
      <CommonHeader
        title="Admin Groups"
        description="Reusable permission bundles assigned to operators and partners."
        actions={
          <Can permission="adminGroups:create">
            <Button onClick={() => setCreateOpen(true)}>
              <PlusIcon className="size-4" />
              Create group
            </Button>
          </Can>
        }
      />

      <form
        onSubmit={handleSearchSubmit}
        className="flex flex-wrap items-center gap-2 mb-4"
      >
        <Input
          placeholder="Search by name or tag"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="max-w-sm"
        />
        <Button type="submit" variant="outline">
          Search
        </Button>
        {search ? (
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setSearch("");
              setSearchInput("");
              setPage(1);
            }}
          >
            Clear
          </Button>
        ) : null}

        {isTenet ? (
          <div className="ml-auto flex items-center gap-1 text-xs">
            <span className="text-muted-foreground">Role:</span>
            {(["", "operator", "partner"] as const).map((r) => (
              <Button
                key={r || "all"}
                size="sm"
                variant={roleFilter === r ? "default" : "outline"}
                onClick={() => {
                  setRoleFilter(r as AdminGroupRole | "");
                  setPage(1);
                }}
              >
                {r === "" ? "All" : r === "operator" ? "Operators" : "Partners"}
              </Button>
            ))}
          </div>
        ) : null}
      </form>

      <div className="rounded-md border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="text-left">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Tags</th>
              <th className="px-4 py-3 font-medium">Members</th>
              <th className="px-4 py-3 font-medium">Created</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-t">
                  <td className="px-4 py-3"><Skeleton className="h-4 w-32" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-4 w-40" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-4 w-12" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-4 w-36" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-4 w-20 ml-auto" /></td>
                </tr>
              ))
            ) : isError ? (
              <tr className="border-t">
                <td colSpan={6} className="px-4 py-8 text-center text-destructive">
                  {(error as Error)?.message ?? "Failed to load admin groups."}
                </td>
              </tr>
            ) : groups.length === 0 ? (
              <tr className="border-t">
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No admin groups yet. Create your first one above.
                </td>
              </tr>
            ) : (
              groups.map((g) => (
                <tr key={g.id} className="border-t">
                  <td className="px-4 py-3 font-medium">{g.name}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs capitalize ${ROLE_TONE[g.role]}`}
                    >
                      {g.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {g.tags.length === 0 ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {g.tags.map((t) => (
                          <span
                            key={t}
                            className="rounded bg-muted px-1.5 py-0.5 text-xs"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {g.memberCount ?? 0}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(g.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Can permission="adminGroups:update">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEdit(g)}
                          title="Edit"
                        >
                          <PencilIcon className="size-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                      </Can>
                      <Can permission="adminGroups:delete">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openDelete(g)}
                          title="Delete"
                        >
                          <Trash2Icon className="size-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </Can>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination ? (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages} ·{" "}
            {pagination.total} total
            {isFetching ? " · refreshing…" : ""}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasPrevPage}
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasNextPage}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}

      <CreateAdminGroupWizard
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
      <EditAdminGroupSheet
        open={editOpen}
        onOpenChange={setEditOpen}
        group={editing}
      />
      <DeleteAdminGroupDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        group={deleting}
      />
    </div>
  );
}
