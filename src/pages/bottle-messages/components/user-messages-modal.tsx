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
import { Skeleton } from "@/components/ui/skeleton";
import { useBottleMessagesBySender } from "@/hooks/useBottleMessages";
import type {
  BottleMessage,
  BottleMessageUser,
} from "@/api/bottle-messages";

interface UserMessagesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: BottleMessageUser | null;
}

const formatDate = (iso: string | null) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
};

const statusFor = (m: BottleMessage): { label: string; tone: string } => {
  if (m.isDraft) {
    return { label: "Draft", tone: "bg-amber-100 text-amber-900" };
  }
  if (m.acknowledgedAt) {
    return { label: "Read", tone: "bg-emerald-100 text-emerald-900" };
  }
  if (m.recipientEmail) {
    return { label: "Delivered", tone: "bg-blue-100 text-blue-900" };
  }
  return { label: "Drifting", tone: "bg-muted text-muted-foreground" };
};

export function UserMessagesModal({
  open,
  onOpenChange,
  user,
}: UserMessagesModalProps) {
  const { data, isLoading, isError, error } = useBottleMessagesBySender(
    open ? user?.email ?? null : null
  );

  const messages = data?.data ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0">
        <DialogHeader>
          <DialogTitle>Messages from {user?.email ?? "—"}</DialogTitle>
          <DialogDescription>
            Every bottle message sent by this user, newest first.
          </DialogDescription>
        </DialogHeader>

        <div className="px-4 pb-2">
          <div className="max-h-[60vh] overflow-y-auto rounded-md border">
            {isLoading ? (
              <div className="flex flex-col gap-3 p-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : isError ? (
              <p className="p-6 text-center text-destructive">
                {(error as Error)?.message ?? "Failed to load messages."}
              </p>
            ) : messages.length === 0 ? (
              <p className="p-6 text-center text-muted-foreground">
                This user has not sent any messages yet.
              </p>
            ) : (
              <ul className="divide-y">
                {messages.map((m) => {
                  const status = statusFor(m);
                  return (
                    <li key={m._id} className="p-4">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="text-xs text-muted-foreground">
                          {formatDate(m.createdAt)}
                        </div>
                        <span
                          className={`text-[10px] uppercase tracking-wide font-medium px-2 py-0.5 rounded-full ${status.tone}`}
                        >
                          {status.label}
                        </span>
                      </div>
                      <p className="text-sm text-foreground line-clamp-3 whitespace-pre-wrap">
                        {m.content}
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {m.recipientEmail
                          ? `To: ${m.recipientEmail}`
                          : "Shareable link only"}
                        {m.acknowledgedAt
                          ? ` · Read ${formatDate(m.acknowledgedAt)}`
                          : ""}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          {data?.pagination && data.pagination.total > messages.length ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Showing the most recent {messages.length} of{" "}
              {data.pagination.total} messages.
            </p>
          ) : null}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
