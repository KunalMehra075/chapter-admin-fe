import { AxiosInstance } from "./axios";
import type { Role } from "@/lib/permissions";

export type AdminGroupRole = Extract<Role, "operator" | "partner">;

export interface AdminGroup {
  id: string;
  name: string;
  role: AdminGroupRole;
  tags: string[];
  access: string[];
  createdBy: string;
  memberCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminGroupListResponse {
  data: AdminGroup[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface AdminGroupListParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: AdminGroupRole;
}

export interface CreateAdminGroupInput {
  name: string;
  role: AdminGroupRole;
  tags?: string[];
  access: string[];
}

export interface UpdateAdminGroupInput {
  name?: string;
  tags?: string[];
  access?: string[];
}

const BASE = "/api/admin-groups";

export const adminGroupsApi = {
  list: async (
    params: AdminGroupListParams = {}
  ): Promise<AdminGroupListResponse> => {
    const { data } = await AxiosInstance.get<AdminGroupListResponse>(BASE, {
      params,
    });
    return data;
  },

  getById: async (id: string): Promise<AdminGroup> => {
    const { data } = await AxiosInstance.get<{ data: AdminGroup }>(
      `${BASE}/${id}`
    );
    return data.data;
  },

  create: async (input: CreateAdminGroupInput): Promise<AdminGroup> => {
    const { data } = await AxiosInstance.post<{ data: AdminGroup }>(
      BASE,
      input
    );
    return data.data;
  },

  update: async (
    id: string,
    input: UpdateAdminGroupInput
  ): Promise<AdminGroup> => {
    const { data } = await AxiosInstance.put<{ data: AdminGroup }>(
      `${BASE}/${id}`,
      input
    );
    return data.data;
  },

  remove: async (id: string): Promise<AdminGroup> => {
    const { data } = await AxiosInstance.delete<{ data: AdminGroup }>(
      `${BASE}/${id}`
    );
    return data.data;
  },
};
