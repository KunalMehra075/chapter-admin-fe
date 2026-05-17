import { useEffect, useState } from "react";
import { toast } from "sonner";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminGroupPicker } from "./AdminGroupPicker";
import { useUpdateAdmin } from "@/hooks/useAdmins";
import { authApi } from "@/api/auth";
import { extractApiError } from "@/lib/api-error";
import type { AdminUser } from "@/api/admins";
import type { Role } from "@/lib/permissions";
import type { AdminGroupRole } from "@/api/admin-groups";

interface EditAdminSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: Role;
  user: AdminUser | null;
}

export function EditAdminSheet({ open, onOpenChange, role, user }: EditAdminSheetProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [adminGroupId, setAdminGroupId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const updateMutation = useUpdateAdmin(role);
  const needsGroup = role !== "tenet";

  useEffect(() => {
    if (open && user) {
      setName(user.name);
      setEmail(user.email);
      setPhone(user.phone ?? "");
      setAddress(user.address ?? "");
      setAdminGroupId(user.adminGroupId ?? null);
      setError(null);
      setResetSent(false);
    }
  }, [open, user]);

  if (!user) return null;

  const onSave = async () => {
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    if (needsGroup && !adminGroupId) {
      setError("Pick an admin group");
      return;
    }
    setError(null);
    try {
      await updateMutation.mutateAsync({
        id: user.id,
        input: {
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() ? phone.trim() : null,
          address: address.trim() ? address.trim() : null,
          ...(needsGroup ? { adminGroupId } : {}),
        },
      });
      toast.success("User updated");
      onOpenChange(false);
    } catch (err) {
      const apiErr = extractApiError(err);
      if (apiErr.status === 409) {
        toast.error("A user with this email already exists");
        onOpenChange(false);
        return;
      }
      setError(apiErr.message);
    }
  };

  const onSendResetLink = async () => {
    setResetting(true);
    try {
      await authApi.requestPasswordReset(user.email);
      setResetSent(true);
    } catch {
      setResetSent(true);
    } finally {
      setResetting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl w-full p-0">
        <div
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
            }
          }}
          className="flex flex-col max-h-[90vh]"
        >
          <DialogHeader>
            <DialogTitle>Edit user</DialogTitle>
            <DialogDescription>
              Update profile and admin group for <strong>{user.email}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 px-4 py-4 flex-1 overflow-y-auto">
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-phone">Phone</Label>
              <Input
                id="edit-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-address">Address</Label>
              <Input
                id="edit-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label>Password</Label>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={resetting || resetSent}
                  onClick={onSendResetLink}
                >
                  {resetSent
                    ? "Reset link sent"
                    : resetting
                      ? "Sending…"
                      : "Send password reset email"}
                </Button>
                <p className="text-xs text-muted-foreground">
                  Sends a reset link to the user&apos;s email.
                </p>
              </div>
            </div>

            {needsGroup ? (
              <div className="flex flex-col gap-2">
                <Label>Admin group</Label>
                <AdminGroupPicker
                  role={role as AdminGroupRole}
                  value={adminGroupId}
                  onChange={setAdminGroupId}
                />
              </div>
            ) : null}

            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </div>

          <DialogFooter className="flex-row">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={updateMutation.isPending}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="button"
              onClick={onSave}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
