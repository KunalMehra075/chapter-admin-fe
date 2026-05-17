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
import { useCreateAdmin } from "@/hooks/useAdmins";
import { extractApiError } from "@/lib/api-error";
import type { Role } from "@/lib/permissions";
import type { AdminGroupRole } from "@/api/admin-groups";

interface CreateAdminWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: Role;
}

const MIN_PASSWORD_LENGTH = 8;

const roleLabel = (role: Role): string => {
  if (role === "tenet") return "Tenet";
  if (role === "operator") return "Operator";
  return "Partner";
};

const blank = {
  name: "",
  email: "",
  password: "",
  phone: "",
  address: "",
};

export function CreateAdminWizard({ open, onOpenChange, role }: CreateAdminWizardProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [basics, setBasics] = useState(blank);
  const [adminGroupId, setAdminGroupId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const createMutation = useCreateAdmin(role);
  const needsGroup = role !== "tenet";

  useEffect(() => {
    if (open) {
      setStep(1);
      setBasics(blank);
      setAdminGroupId(null);
      setError(null);
    }
  }, [open]);

  const validateStep1 = (): string | null => {
    if (!basics.name.trim()) return "Name is required";
    if (!basics.email.trim()) return "Email is required";
    if (!basics.password) return "Password is required";
    if (basics.password.length < MIN_PASSWORD_LENGTH) {
      return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
    }
    return null;
  };

  const submitCreate = async () => {
    setError(null);
    if (needsGroup && !adminGroupId) {
      setError("Pick an admin group");
      return;
    }
    try {
      await createMutation.mutateAsync({
        name: basics.name.trim(),
        email: basics.email.trim(),
        password: basics.password,
        phone: basics.phone.trim() || undefined,
        address: basics.address.trim() || undefined,
        adminGroupId: needsGroup ? adminGroupId : null,
      });
      toast.success(`${roleLabel(role)} invited successfully`);
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

  const onNext = () => {
    const err = validateStep1();
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    if (needsGroup) {
      setStep(2);
    } else {
      submitCreate();
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
            <DialogTitle>Invite {roleLabel(role)}</DialogTitle>
            <DialogDescription>
              {needsGroup
                ? `Step ${step} of 2 — ${step === 1 ? "Basic info" : "Admin group"}.`
                : "Basic info."}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 px-4 py-4 flex-1 overflow-y-auto">
            {step === 1 ? (
              <>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="role-display">Role</Label>
                  <Input id="role-display" value={roleLabel(role)} disabled />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="admin-name">Name</Label>
                  <Input
                    id="admin-name"
                    value={basics.name}
                    onChange={(e) => setBasics((b) => ({ ...b, name: e.target.value }))}
                    autoFocus
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="admin-email">Email</Label>
                  <Input
                    id="admin-email"
                    type="email"
                    value={basics.email}
                    onChange={(e) => setBasics((b) => ({ ...b, email: e.target.value }))}
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="admin-password">Initial password</Label>
                  <Input
                    id="admin-password"
                    type="password"
                    value={basics.password}
                    onChange={(e) => setBasics((b) => ({ ...b, password: e.target.value }))}
                    minLength={MIN_PASSWORD_LENGTH}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    The user will be required to change this on first login.
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="admin-phone">Phone (optional)</Label>
                  <Input
                    id="admin-phone"
                    value={basics.phone}
                    onChange={(e) => setBasics((b) => ({ ...b, phone: e.target.value }))}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="admin-address">Address (optional)</Label>
                  <Input
                    id="admin-address"
                    value={basics.address}
                    onChange={(e) => setBasics((b) => ({ ...b, address: e.target.value }))}
                  />
                </div>
              </>
            ) : (
              <AdminGroupPicker
                role={role as AdminGroupRole}
                value={adminGroupId}
                onChange={setAdminGroupId}
              />
            )}

            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </div>

          <DialogFooter className="flex-row">
            {step === 1 ? (
              <>
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </DialogClose>
                <Button
                  type="button"
                  onClick={onNext}
                  disabled={createMutation.isPending}
                >
                  {needsGroup
                    ? "Next"
                    : createMutation.isPending
                      ? "Creating…"
                      : "Create user"}
                </Button>
              </>
            ) : (
              <>
                <Button type="button" variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button
                  type="button"
                  onClick={submitCreate}
                  disabled={createMutation.isPending || !adminGroupId}
                >
                  {createMutation.isPending ? "Creating…" : "Create user"}
                </Button>
              </>
            )}
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
