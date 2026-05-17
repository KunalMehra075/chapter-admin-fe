import { useEffect, useState } from "react";
import { toast } from "sonner";
import { XIcon } from "lucide-react";
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
import { AccessTableField } from "@/components/common/AccessTableField";
import { useCreateAdminGroup } from "@/hooks/useAdminGroups";
import { useAuth } from "@/app/providers/auth-provider";
import { extractApiError } from "@/lib/api-error";
import type { AdminGroupRole } from "@/api/admin-groups";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const roleOptionsFor = (
  actorRole: string | undefined
): AdminGroupRole[] => {
  if (actorRole === "tenet") return ["operator", "partner"];
  if (actorRole === "operator") return ["partner"];
  return [];
};

export function CreateAdminGroupWizard({ open, onOpenChange }: Props) {
  const { user } = useAuth();
  const createMutation = useCreateAdminGroup();

  const roleOptions = roleOptionsFor(user?.role);
  const defaultRole = roleOptions[0] ?? "partner";

  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [role, setRole] = useState<AdminGroupRole>(defaultRole);
  const [tagsInput, setTagsInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [access, setAccess] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setStep(1);
      setName("");
      setRole(roleOptions[0] ?? "partner");
      setTagsInput("");
      setTags([]);
      setAccess([]);
      setError(null);
    }
    // roleOptions intentionally not in deps — driven by user.role which is stable per session
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const addTag = () => {
    const t = tagsInput.trim();
    if (!t) return;
    if (tags.includes(t)) {
      setTagsInput("");
      return;
    }
    setTags([...tags, t]);
    setTagsInput("");
  };

  const removeTag = (t: string) => setTags(tags.filter((x) => x !== t));

  const validateStep1 = (): string | null => {
    if (!name.trim()) return "Name is required";
    if (!roleOptions.includes(role)) return "Invalid role for your account";
    return null;
  };

  const onNext = () => {
    const err = validateStep1();
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setStep(2);
  };

  const submit = async () => {
    setError(null);
    if (access.length === 0) {
      setError("Pick at least one permission");
      return;
    }
    try {
      await createMutation.mutateAsync({
        name: name.trim(),
        role,
        tags,
        access,
      });
      toast.success("Admin group created");
      onOpenChange(false);
    } catch (err) {
      const apiErr = extractApiError(err);
      if (apiErr.status === 409) {
        toast.error("A group with this name already exists for this role");
      }
      setError(apiErr.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl w-full p-0">
        <div
          onKeyDown={(e) => {
            if (e.key === "Enter") e.preventDefault();
          }}
          className="flex flex-col max-h-[90vh]"
        >
          <DialogHeader>
            <DialogTitle>Create admin group</DialogTitle>
            <DialogDescription>
              Step {step} of 2 — {step === 1 ? "Basics" : "Permissions"}.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 px-4 py-4 flex-1 overflow-y-auto">
            {step === 1 ? (
              <>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="group-name">Name</Label>
                  <Input
                    id="group-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoFocus
                    required
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label>For role</Label>
                  <div className="flex gap-2">
                    {roleOptions.map((r) => (
                      <Button
                        key={r}
                        type="button"
                        variant={role === r ? "default" : "outline"}
                        onClick={() => setRole(r)}
                        className="capitalize"
                      >
                        {r}
                      </Button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Determines who this group can be assigned to.
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="group-tags">Tags (optional)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="group-tags"
                      placeholder="e.g. cafe-owners, developers"
                      value={tagsInput}
                      onChange={(e) => setTagsInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addTag();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addTag}
                      disabled={!tagsInput.trim()}
                    >
                      Add
                    </Button>
                  </div>
                  {tags.length > 0 ? (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {tags.map((t) => (
                        <span
                          key={t}
                          className="inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-xs"
                        >
                          {t}
                          <button
                            type="button"
                            onClick={() => removeTag(t)}
                            className="hover:text-destructive"
                            aria-label={`Remove tag ${t}`}
                          >
                            <XIcon className="size-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              </>
            ) : (
              <AccessTableField value={access} onChange={setAccess} />
            )}

            {error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : null}
          </div>

          <DialogFooter className="flex-row">
            {step === 1 ? (
              <>
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </DialogClose>
                <Button type="button" onClick={onNext}>
                  Next
                </Button>
              </>
            ) : (
              <>
                <Button type="button" variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button
                  type="button"
                  onClick={submit}
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? "Creating…" : "Create group"}
                </Button>
              </>
            )}
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
