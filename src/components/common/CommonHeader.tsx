import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface CommonHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

export function CommonHeader({
  title,
  description,
  actions,
  className,
}: CommonHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 pb-4 border-b mb-6 md:flex-row md:items-center md:justify-between",
        className
      )}
    >
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export default CommonHeader;
