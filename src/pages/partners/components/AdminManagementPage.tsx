import { useState, type FormEvent } from "react";
import { PencilIcon, PlusIcon, Trash2Icon, MailIcon } from "lucide-react";

import { CommonHeader } from "@/components/common/CommonHeader";
import { Can } from "@/components/common/Can";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminList, useResendInvite } from "@/hooks/useAdmins";
import type { AdminUser } from "@/api/admins";
import type { Role } from "@/lib/permissions";

import { CreateAdminWizard } from "./CreateAdminWizard";
import { EditAdminSheet } from "./EditAdminSheet";
import { DeleteAdminDialog } from "./DeleteAdminDialog";

const PAGE_SIZE = 10;

const formatDate = (iso: string | null) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
};

const PAGE_META: Record<Role, { title: string; description: string; cta: string }> = {
  tenet: {
    title: "Tenets",
    description: "Manage tenets — these have full system access.",
    cta: "Invite tenet",
  },
  operator: {
    title: "Operators",
    description: "Manage Operators — they can administer users and modules.",
    cta: "Invite Operator",
  },
  partner: {
    title: "Partners",
    description: "Manage partners with module-scoped permissions.",
    cta: "Invite partner",
  },
};

interface InviteStatus {
  kind: "active" | "pending" | "expired";
  label: string;
  tone: string;
}

const inviteStatus = (user: AdminUser): InviteStatus => {
  if (!user.mustChangePassword) {
    return { kind: "active", label: "Active", tone: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300" };
  }
  if (user.inviteExpiresAt && new Date(user.inviteExpiresAt).getTime() < Date.now()) {
    return { kind: "expired", label: "Invite expired", tone: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300" };
  }
  return { kind: "pending", label: "Invite pending", tone: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300" };
};

export function AdminManagementPage({ role }: { role: Role }) {
  const meta = PAGE_META[role];
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const [createOpen, setCreateOpen] = useState(false);

  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const [deleting, setDeleting] = useState<AdminUser | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data, isLoading, isError, error, isFetching } = useAdminList(role, {
    page,
    limit: PAGE_SIZE,
    search: search || undefined,
  });

  const resendMutation = useResendInvite(role);

  const users = data?.data ?? [];
  const pagination = data?.pagination;

  const openEdit = (user: AdminUser) => {
    setEditing(user);
    setEditOpen(true);
  };
  const openDelete = (user: AdminUser) => {
    setDeleting(user);
    setDeleteOpen(true);
  };
  const onResend = (user: AdminUser) => {
    resendMutation.mutate(user.id);
  };

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  };

  return (
    <div>
      <CommonHeader
        title={meta.title}
        description={meta.description}
        actions={
          <Can permission={`${role}s:create`}>
            <Button onClick={() => setCreateOpen(true)}>
              <PlusIcon className="size-4" />
              {meta.cta}
            </Button>
          </Can>
        }
      />

      <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 mb-4">
        <Input
          placeholder="Search by name or email"
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
      </form>

      <div className="rounded-md border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="text-left">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Created</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-t">
                  <td className="px-4 py-3"><Skeleton className="h-4 w-32" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-4 w-48" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-4 w-36" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-4 w-20 ml-auto" /></td>
                </tr>
              ))
            ) : isError ? (
              <tr className="border-t">
                <td colSpan={5} className="px-4 py-8 text-center text-destructive">
                  {(error as Error)?.message ?? "Failed to load users."}
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr className="border-t">
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((user) => {
                const status = inviteStatus(user);
                return (
                  <tr key={user.id} className="border-t">
                    <td className="px-4 py-3">{user.name}</td>
                    <td className="px-4 py-3">{user.email}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs ${status.tone}`}
                        title={
                          user.inviteExpiresAt
                            ? `Invite expires ${formatDate(user.inviteExpiresAt)}`
                            : undefined
                        }
                      >
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        {status.kind !== "active" ? (
                          <Can permission={`${role}s:update`}>
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={resendMutation.isPending}
                              onClick={() => onResend(user)}
                              title="Resend invite"
                            >
                              <MailIcon className="size-4" />
                              <span className="sr-only">Resend invite</span>
                            </Button>
                          </Can>
                        ) : null}
                        <Can permission={`${role}s:update`}>
                          <Button size="sm" variant="ghost" onClick={() => openEdit(user)} title="Edit">
                            <PencilIcon className="size-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                        </Can>
                        <Can permission={`${role}s:delete`}>
                          <Button size="sm" variant="ghost" onClick={() => openDelete(user)} title="Delete">
                            <Trash2Icon className="size-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </Can>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {pagination ? (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages} · {pagination.total} total
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

      <CreateAdminWizard open={createOpen} onOpenChange={setCreateOpen} role={role} />
      <EditAdminSheet open={editOpen} onOpenChange={setEditOpen} role={role} user={editing} />
      <DeleteAdminDialog open={deleteOpen} onOpenChange={setDeleteOpen} role={role} user={deleting} />
    </div>
  );
}
