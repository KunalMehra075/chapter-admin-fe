import { ShieldOff } from "lucide-react";

export const Forbidden = ({ permission }: { permission?: string }) => (
  <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center">
    <ShieldOff className="size-10 text-muted-foreground" />
    <div className="text-lg font-medium">You don&apos;t have access to this page</div>
    {permission ? (
      <div className="text-sm text-muted-foreground">
        Requires permission: <code className="rounded bg-muted px-1.5 py-0.5">{permission}</code>
      </div>
    ) : null}
    <div className="text-sm text-muted-foreground">
      Contact your administrator if you think this is a mistake.
    </div>
  </div>
);
