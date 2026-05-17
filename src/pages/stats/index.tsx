import { CommonHeader } from "@/components/common/CommonHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { useStats } from "@/hooks/useStats";

export default function StatsPage() {
  const { data, isLoading, isError, error } = useStats();

  return (
    <div>
      <CommonHeader
        title="Stats"
        description="Snapshot of waitlist signups, places, and service health."
      />

      {isError ? (
        <p className="text-sm text-destructive">
          {(error as Error)?.message ?? "Failed to load stats."}
        </p>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Tile label="Total users" value={data?.totalUsers} loading={isLoading} />
        <Tile label="Waitlisted users" value={data?.waitlistedUsers} loading={isLoading} />
        <Tile label="Total places" value={data?.totalPlaces} loading={isLoading} />
      </div>

      <div className="mt-6 rounded-md border p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">Last 7 days</h2>
          <span className="text-xs text-muted-foreground">
            Service health: {data?.servicesHealth ?? "—"}
          </span>
        </div>
        <div className="mt-3 grid grid-cols-7 gap-2">
          {isLoading ? (
            Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-16" />
            ))
          ) : (
            (data?.dailyUserCounts ?? []).map((d) => (
              <div key={d.date} className="rounded border p-2 text-center">
                <div className="text-xs text-muted-foreground">
                  {d.date.slice(5)}
                </div>
                <div className="mt-1 text-lg font-semibold">{d.count}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

const Tile = ({
  label,
  value,
  loading,
}: {
  label: string;
  value?: number;
  loading: boolean;
}) => (
  <div className="rounded-md border p-4">
    <div className="text-sm text-muted-foreground">{label}</div>
    {loading ? (
      <Skeleton className="mt-2 h-8 w-24" />
    ) : (
      <div className="mt-2 text-3xl font-semibold tabular-nums">
        {value?.toLocaleString() ?? "—"}
      </div>
    )}
  </div>
);
