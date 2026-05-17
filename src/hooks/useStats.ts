import { useQuery } from "@tanstack/react-query";

import { statsApi } from "@/api/stats";

export const useStats = () =>
  useQuery({
    queryKey: ["stats"],
    queryFn: () => statsApi.get(),
  });
