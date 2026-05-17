import { useState } from "react";
import { AxiosError } from "axios";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useDeleteAdminGroup } from "@/hooks/useAdminGroups";
import { extractApiError } from "@/lib/api-error";
import type { AdminGroup } from "@/api/admin-groups";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: AdminGroup | null;
}

interface BlockedMember {
  id: string;
  email: string;
  role: string;
}

export function DeleteAdminGroupDialog({ open, onOpenChange, group }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [blocked, setBlocked] = useState<{
    memberCount: number;
    members: BlockedMember[];
  } | null>(null);
  const deleteMutation = useDeleteAdminGroup();

  if (!group) return null;

  const onDelete = async () => {
    setError(null);
    setBlocked(null);
    try {
      await deleteMutation.mutateAsync(group.id);
      onOpenChange(false);
    } catch (err) {
      const axiosErr = err as AxiosError<{
        error?: string;
        memberCount?: number;
        members?: BlockedMember[];
      }>;
      if (
        axiosErr.response?.status === 409 &&
        axiosErr.response.data?.memberCount
      ) {
        setBlocked({
          memberCount: axiosErr.response.data.memberCount,
          members: axiosErr.response.data.members ?? [],
        });
        return;
      }
      setError(extractApiError(err).message);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          setError(null);
          setBlocked(null);
        }
        onOpenChange(o);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete admin group?</DialogTitle>
          <DialogDescription>
            This will permanently remove <strong>{group.name}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="px-4 space-y-2">
          {blocked ? (
            <div className="rounded-md border border-amber-300 bg-amber-50 dark:bg-amber-950/30 p-3 text-sm">
              <p className="font-medium text-amber-900 dark:text-amber-200">
                {blocked.memberCount} user
                {blocked.memberCount === 1 ? "" : "s"} currently assigned to this
                group. Reassign them before deleting.
              </p>
              <ul className="mt-2 list-disc pl-5 space-y-0.5 text-amber-900 dark:text-amber-200">
                {blocked.members.map((m) => (
                  <li key={m.id}>
                    {m.email} <span className="text-xs opacity-70">({m.role})</span>
                  </li>
                ))}
                {blocked.memberCount > blocked.members.length ? (
                  <li className="opacity-70">
                    …and {blocked.memberCount - blocked.members.length} more
                  </li>
                ) : null}
              </ul>
            </div>
          ) : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>

        <DialogFooter className="flex-row">
          <DialogClose asChild>
            <Button
              type="button"
              variant="outline"
              disabled={deleteMutation.isPending}
            >
              {blocked ? "Close" : "Cancel"}
            </Button>
          </DialogClose>
          {!blocked ? (
            <Button
              type="button"
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={onDelete}
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete"}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
