import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useCreateWaitlistUser,
  useUpdateWaitlistUser,
} from "@/hooks/useWaitlist";
import { extractApiError } from "@/lib/api-error";
import type { WaitlistUser } from "@/api/waitlist";

interface WaitlistFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: WaitlistUser | null;
}

export function WaitlistFormSheet({
  open,
  onOpenChange,
  user,
}: WaitlistFormSheetProps) {
  const isEdit = Boolean(user);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  const createMutation = useCreateWaitlistUser();
  const updateMutation = useUpdateWaitlistUser();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (open) {
      setName(user?.name ?? "");
      setEmail(user?.email ?? "");
      setError(null);
    }
  }, [open, user]);

  const handleSave = async () => {
    setError(null);

    if (!name.trim() || !email.trim()) {
      setError("Name and email are required");
      return;
    }

    try {
      if (isEdit && user) {
        await updateMutation.mutateAsync({
          id: user._id,
          input: { name: name.trim(), email: email.trim() },
        });
        toast.success("Waitlist user updated");
      } else {
        await createMutation.mutateAsync({
          name: name.trim(),
          email: email.trim(),
        });
        toast.success("Waitlist user added");
      }
      onOpenChange(false);
    } catch (err: unknown) {
      const apiErr = extractApiError(err);
      if (apiErr.status === 409) {
        toast.error("A user with this email already exists");
        onOpenChange(false);
        return;
      }
      setError(apiErr.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0">
        <div
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSave();
            }
          }}
          className="flex flex-col max-h-[90vh]"
        >
          <DialogHeader>
            <DialogTitle>
              {isEdit ? "Edit waitlist user" : "Add waitlist user"}
            </DialogTitle>
            <DialogDescription>
              {isEdit
                ? "Update the details of this waitlist user."
                : "Manually add a user to the waitlist."}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 px-4 py-4 flex-1">
            <div className="flex flex-col gap-2">
              <Label htmlFor="waitlist-name">Name</Label>
              <Input
                id="waitlist-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                autoFocus
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="waitlist-email">Email</Label>
              <Input
                id="waitlist-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@example.com"
              />
            </div>
            {error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : null}
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isSubmitting}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="button" onClick={handleSave} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : isEdit ? "Save changes" : "Add user"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default WaitlistFormSheet;
