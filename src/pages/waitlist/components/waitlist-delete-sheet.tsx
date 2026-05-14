import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Delete waitlist user</SheetTitle>
          <SheetDescription>
            This will permanently remove{" "}
            <span className="font-medium">{user?.email}</span> from the waitlist.
            This action cannot be undone.
          </SheetDescription>
        </SheetHeader>

        {error ? (
          <p className="text-sm text-destructive px-4">{error}</p>
        ) : null}

        <SheetFooter>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete"}
          </Button>
          <SheetClose asChild>
            <Button
              type="button"
              variant="outline"
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export default WaitlistDeleteSheet;
