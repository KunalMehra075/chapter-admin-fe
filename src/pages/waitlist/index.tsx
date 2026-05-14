import { useState } from "react";
import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";

import { CommonHeader } from "@/components/common/CommonHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useWaitlistUsers } from "@/hooks/useWaitlist";
import type { WaitlistUser } from "@/api/waitlist";

import { WaitlistFormSheet } from "./components/waitlist-form-sheet";
import { WaitlistDeleteSheet } from "./components/waitlist-delete-sheet";

const PAGE_SIZE = 10;

const formatDate = (iso: string) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
};

export default function WaitlistPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<WaitlistUser | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<WaitlistUser | null>(null);

  const { data, isLoading, isError, error, isFetching } = useWaitlistUsers({
    page,
    limit: PAGE_SIZE,
    search: search || undefined,
  });

  const users = data?.data ?? [];
  const pagination = data?.pagination;

  const openCreate = () => {
    setEditingUser(null);
    setFormOpen(true);
  };

  const openEdit = (user: WaitlistUser) => {
    setEditingUser(user);
    setFormOpen(true);
  };

  const openDelete = (user: WaitlistUser) => {
    setDeletingUser(user);
    setDeleteOpen(true);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  };

  return (
    <div>
      <CommonHeader
        title="Waitlist"
        description="Manage users who have joined the waitlist."
        actions={
          <Button onClick={openCreate}>
            <PlusIcon className="size-4" />
            Add user
          </Button>
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
              <th className="px-4 py-3 font-medium">Joined</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-t">
                  <td className="px-4 py-3"><Skeleton className="h-4 w-32" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-4 w-48" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-4 w-36" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-4 w-20 ml-auto" /></td>
                </tr>
              ))
            ) : isError ? (
              <tr className="border-t">
                <td colSpan={4} className="px-4 py-8 text-center text-destructive">
                  {(error as Error)?.message ?? "Failed to load waitlist users."}
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr className="border-t">
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                  No waitlist users found.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user._id} className="border-t">
                  <td className="px-4 py-3">{user.name}</td>
                  <td className="px-4 py-3">{user.email}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEdit(user)}
                      >
                        <PencilIcon className="size-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openDelete(user)}
                      >
                        <Trash2Icon className="size-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
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
            {isFetching ? " · refreshing..." : ""}
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

      <WaitlistFormSheet
        open={formOpen}
        onOpenChange={setFormOpen}
        user={editingUser}
      />

      <WaitlistDeleteSheet
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        user={deletingUser}
      />
    </div>
  );
}
