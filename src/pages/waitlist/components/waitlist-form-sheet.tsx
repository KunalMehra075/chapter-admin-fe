import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  useCreateWaitlistUser,
  useUpdateWaitlistUser,
} from "@/hooks/useWaitlist";
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      } else {
        await createMutation.mutateAsync({
          name: name.trim(),
          email: email.trim(),
        });
      }
      onOpenChange(false);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ?? "Something went wrong";
      setError(message);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <SheetHeader>
            <SheetTitle>
              {isEdit ? "Edit waitlist user" : "Add waitlist user"}
            </SheetTitle>
            <SheetDescription>
              {isEdit
                ? "Update the details of this waitlist user."
                : "Manually add a user to the waitlist."}
            </SheetDescription>
          </SheetHeader>

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

          <SheetFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : isEdit ? "Save changes" : "Add user"}
            </Button>
            <SheetClose asChild>
              <Button type="button" variant="outline" disabled={isSubmitting}>
                Cancel
              </Button>
            </SheetClose>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

export default WaitlistFormSheet;
