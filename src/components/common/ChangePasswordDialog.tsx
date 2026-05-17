import { useState } from "react";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/app/providers/auth-provider";
import { authApi } from "@/api/auth";
import { extractApiError } from "@/lib/api-error";

interface ChangePasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChangePasswordDialog({ open, onOpenChange }: ChangePasswordDialogProps) {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;

  const onSend = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await authApi.requestPasswordReset(user.email);
      setSent(true);
    } catch (err) {
      setError(extractApiError(err).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setSent(false);
      setError(null);
    }
    onOpenChange(next);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Change password</SheetTitle>
          <SheetDescription>
            We&apos;ll send a password reset link to <strong>{user.email}</strong>.
            The link expires in 10 minutes.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 px-4 py-4">
          {sent ? (
            <div className="text-sm">
              Reset link sent. Check your email to complete the change.
            </div>
          ) : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>

        <SheetFooter>
          {sent ? (
            <SheetClose asChild>
              <Button type="button">Done</Button>
            </SheetClose>
          ) : (
            <>
              <Button type="button" disabled={submitting} onClick={onSend}>
                {submitting ? "Sending…" : "Send reset link"}
              </Button>
              <SheetClose asChild>
                <Button type="button" variant="outline" disabled={submitting}>
                  Cancel
                </Button>
              </SheetClose>
            </>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
