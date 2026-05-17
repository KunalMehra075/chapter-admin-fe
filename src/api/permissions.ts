import { AxiosInstance } from "./axios";
import type { Role } from "@/lib/permissions";

export interface PermissionModule {
  key: string;
  label: string;
  actions: string[];
  wildcard: string;
}

export interface PermissionsCatalog {
  wildcard: string;
  actions: string[];
  modules: PermissionModule[];
  defaultAccess: Record<Role, string[]>;
}

export const permissionsApi = {
  getCatalog: async (): Promise<PermissionsCatalog> => {
    const { data } = await AxiosInstance.get<{ data: PermissionsCatalog }>(
      "/api/permissions/catalog"
    );
    return data.data;
  },
};
