import { useState } from "react";
import {
  EyeIcon,
  FileEditIcon,
  MessageSquareIcon,
  SendIcon,
  UsersIcon,
} from "lucide-react";

import { CommonHeader } from "@/components/common/CommonHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/pages/dashboard/components/stat-card";
import {
  useBottleStats,
  useBottleUsers,
} from "@/hooks/useBottleMessages";
import type { BottleMessageUser } from "@/api/bottle-messages";

import { UserMessagesModal } from "./components/user-messages-modal";

const PAGE_SIZE = 10;

const formatDate = (iso: string | null) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
};

export default function BottleMessagesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [viewingUser, setViewingUser] = useState<BottleMessageUser | null>(null);

  const stats = useBottleStats();
  const { data, isLoading, isError, error, isFetching } = useBottleUsers({
    page,
    limit: PAGE_SIZE,
    search: search || undefined,
  });

  const users = data?.data ?? [];
  const pagination = data?.pagination;

  const openMessages = (user: BottleMessageUser) => {
    setViewingUser(user);
    setModalOpen(true);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  };

  return (
    <div>
      <CommonHeader
        title="Bottle Messages"
        description="Monitor message-in-a-bottle activity and inspect any user's outbox."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
        <StatCard
          title="Total Messages"
          value={stats.data?.totalMessages ?? 0}
          icon={MessageSquareIcon}
          loading={stats.isLoading}
        />
        <StatCard
          title="Total Users"
          value={stats.data?.totalUsers ?? 0}
          icon={UsersIcon}
          loading={stats.isLoading}
        />
        <StatCard
          title="Emailed Messages"
          value={stats.data?.totalEmailed ?? 0}
          icon={SendIcon}
          loading={stats.isLoading}
          description="Addressed to a specific recipient"
        />
        <StatCard
          title="Drafts"
          value={stats.data?.totalDrafts ?? 0}
          icon={FileEditIcon}
          loading={stats.isLoading}
        />
      </div>

      <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 mb-4">
        <Input
          placeholder="Search by email or display name"
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
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Display Name</th>
              <th className="px-4 py-3 font-medium">Sent</th>
              <th className="px-4 py-3 font-medium">Last Activity</th>
              <th className="px-4 py-3 font-medium">Joined</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-t">
                  <td className="px-4 py-3"><Skeleton className="h-4 w-48" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-4 w-32" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-4 w-8" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-4 w-36" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-4 w-36" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-4 w-12 ml-auto" /></td>
                </tr>
              ))
            ) : isError ? (
              <tr className="border-t">
                <td colSpan={6} className="px-4 py-8 text-center text-destructive">
                  {(error as Error)?.message ?? "Failed to load bottle users."}
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr className="border-t">
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No bottle users found.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user._id} className="border-t">
                  <td className="px-4 py-3 font-medium">{user.email}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {user.displayName || "—"}
                  </td>
                  <td className="px-4 py-3 tabular-nums">{user.sentCount}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(user.lastActivityAt)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openMessages(user)}
                      >
                        <EyeIcon className="size-4" />
                        <span className="sr-only">View messages</span>
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

      <UserMessagesModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        user={viewingUser}
      />
    </div>
  );
}
