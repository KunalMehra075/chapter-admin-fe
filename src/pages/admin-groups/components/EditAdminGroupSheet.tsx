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
import { useUpdateAdminGroup } from "@/hooks/useAdminGroups";
import { extractApiError } from "@/lib/api-error";
import type { AdminGroup } from "@/api/admin-groups";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: AdminGroup | null;
}

export function EditAdminGroupSheet({ open, onOpenChange, group }: Props) {
  const updateMutation = useUpdateAdminGroup();

  const [name, setName] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [access, setAccess] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && group) {
      setName(group.name);
      setTags(group.tags);
      setTagsInput("");
      setAccess(group.access);
      setError(null);
    }
  }, [open, group]);

  if (!group) return null;

  const addTag = () => {
    const t = tagsInput.trim();
    if (!t || tags.includes(t)) {
      setTagsInput("");
      return;
    }
    setTags([...tags, t]);
    setTagsInput("");
  };
  const removeTag = (t: string) => setTags(tags.filter((x) => x !== t));

  const onSave = async () => {
    setError(null);
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    if (access.length === 0) {
      setError("Pick at least one permission");
      return;
    }
    try {
      await updateMutation.mutateAsync({
        id: group.id,
        input: { name: name.trim(), tags, access },
      });
      toast.success("Admin group updated");
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
            <DialogTitle>Edit admin group</DialogTitle>
            <DialogDescription>
              Update <strong>{group.name}</strong>. Role is fixed.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 px-4 py-4 flex-1 overflow-y-auto">
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-group-name">Name</Label>
              <Input
                id="edit-group-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label>For role</Label>
              <Input value={group.role} disabled className="capitalize" />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-group-tags">Tags</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="edit-group-tags"
                  placeholder="Add a tag"
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

            <div className="flex flex-col gap-2">
              <Label>Permissions</Label>
              <AccessTableField value={access} onChange={setAccess} />
            </div>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </div>

          <DialogFooter className="flex-row">
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                disabled={updateMutation.isPending}
              >
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
