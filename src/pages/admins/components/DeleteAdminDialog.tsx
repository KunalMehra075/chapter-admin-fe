import { useState } from "react";
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
import { useDeleteAdmin } from "@/hooks/useAdmins";
import { extractApiError } from "@/lib/api-error";
import type { AdminUser } from "@/api/admins";
import type { Role } from "@/lib/permissions";

interface DeleteAdminDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: Role;
  user: AdminUser | null;
}

export function DeleteAdminDialog({ open, onOpenChange, role, user }: DeleteAdminDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const deleteMutation = useDeleteAdmin(role);

  if (!user) return null;

  const onDelete = async () => {
    setError(null);
    try {
      await deleteMutation.mutateAsync(user.id);
      onOpenChange(false);
    } catch (err) {
      setError(extractApiError(err).message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete user?</DialogTitle>
          <DialogDescription>
            This will permanently remove <strong>{user.email}</strong>. This action
            cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="px-4">
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>

        <DialogFooter className="flex-row">
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={deleteMutation.isPending}>
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="button"
            variant="destructive"
            disabled={deleteMutation.isPending}
            onClick={onDelete}
          >
            {deleteMutation.isPending ? "Deleting…" : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
