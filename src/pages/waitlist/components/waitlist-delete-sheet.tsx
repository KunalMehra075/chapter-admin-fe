import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDeleteWaitlistUser } from "@/hooks/useWaitlist";
import type { WaitlistUser } from "@/api/waitlist";

interface WaitlistDeleteSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: WaitlistUser | null;
}

export function WaitlistDeleteSheet({
  open,
  onOpenChange,
  user,
}: WaitlistDeleteSheetProps) {
  const [error, setError] = useState<string | null>(null);
  const deleteMutation = useDeleteWaitlistUser();

  const handleDelete = async () => {
    if (!user) return;
    setError(null);
    try {
      await deleteMutation.mutateAsync(user._id);
      onOpenChange(false);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ?? "Failed to delete user";
      setError(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete waitlist user</DialogTitle>
          <DialogDescription>
            This will permanently remove{" "}
            <span className="font-medium">{user?.email}</span> from the waitlist.
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        {error ? (
          <p className="text-sm text-destructive px-4">{error}</p>
        ) : null}

        <DialogFooter>
          <DialogClose asChild>
            <Button
              type="button"
              variant="outline"
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default WaitlistDeleteSheet;
