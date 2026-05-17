import { ActivityIcon, MapPinIcon, UserPlusIcon, UsersIcon } from "lucide-react";

import { CommonHeader } from "@/components/common/CommonHeader";
import { useStats } from "@/hooks/useStats";

import { StatCard } from "./components/stat-card";
import { DailyUsersChart } from "./components/daily-users-chart";

const healthLabel = (status?: string) => {
  if (!status) return "Unknown";
  return status.charAt(0).toUpperCase() + status.slice(1);
};

const Dashboard = () => {
  const { data, isLoading } = useStats();

  return (
    <div>
      <CommonHeader
        title="Dashboard"
        description="A quick overview of your platform."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Users"
          value={data?.totalUsers ?? 0}
          icon={UsersIcon}
          loading={isLoading}
        />
        <StatCard
          title="Waitlisted Users"
          value={data?.waitlistedUsers ?? 0}
          icon={UserPlusIcon}
          loading={isLoading}
        />
        <StatCard
          title="Total Places"
          value={data?.totalPlaces ?? 0}
          icon={MapPinIcon}
          loading={isLoading}
        />
        <StatCard
          title="Services Health"
          value={healthLabel(data?.servicesHealth)}
          icon={ActivityIcon}
          loading={isLoading}
          valueClassName="capitalize"
        />
      </div>

      <div className="mt-6">
        <DailyUsersChart data={data?.dailyUserCounts} loading={isLoading} />
      </div>
    </div>
  );
};

export default Dashboard;
