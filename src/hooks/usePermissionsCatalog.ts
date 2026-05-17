import { useQuery } from "@tanstack/react-query";
import { permissionsApi } from "@/api/permissions";

const KEY = ["permissions", "catalog"] as const;

export const usePermissionsCatalog = () =>
  useQuery({
    queryKey: KEY,
    queryFn: permissionsApi.getCatalog,
    staleTime: Infinity,
  });
