import { AxiosInstance } from "./axios";

export interface DailyUserCount {
  date: string;
  count: number;
}

export interface Stats {
  totalUsers: number;
  waitlistedUsers: number;
  totalPlaces: number;
  servicesHealth: "healthy" | "degraded" | "down" | string;
  dailyUserCounts: DailyUserCount[];
}

export const statsApi = {
  get: async (): Promise<Stats> => {
    const { data } = await AxiosInstance.get<{ data: Stats }>("/api/stats");
    return data.data;
  },
};
