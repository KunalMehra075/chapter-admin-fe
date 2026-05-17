import { AxiosInstance } from "./axios";
import type { Role } from "@/lib/permissions";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  role: Role;
  access: string[];
  mustChangePassword: boolean;
  inviteExpiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminListResponse {
  data: AdminUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface AdminListParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface CreateAdminInput {
  name: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
  access?: string[];
}

export interface UpdateAdminInput {
  name?: string;
  email?: string;
  phone?: string | null;
  address?: string | null;
  access?: string[];
}

const basePath = (role: Role): string => `/api/${role}s`;

export const adminsApi = {
  list: async (role: Role, params: AdminListParams = {}): Promise<AdminListResponse> => {
    const { data } = await AxiosInstance.get<AdminListResponse>(basePath(role), {
      params,
    });
    return data;
  },

  getById: async (role: Role, id: string): Promise<AdminUser> => {
    const { data } = await AxiosInstance.get<{ data: AdminUser }>(
      `${basePath(role)}/${id}`
    );
    return data.data;
  },

  create: async (role: Role, input: CreateAdminInput): Promise<AdminUser> => {
    const { data } = await AxiosInstance.post<{ data: AdminUser }>(
      basePath(role),
      input
    );
    return data.data;
  },

  update: async (
    role: Role,
    id: string,
    input: UpdateAdminInput
  ): Promise<AdminUser> => {
    const { data } = await AxiosInstance.put<{ data: AdminUser }>(
      `${basePath(role)}/${id}`,
      input
    );
    return data.data;
  },

  remove: async (role: Role, id: string): Promise<AdminUser> => {
    const { data } = await AxiosInstance.delete<{ data: AdminUser }>(
      `${basePath(role)}/${id}`
    );
    return data.data;
  },

  resendInvite: async (role: Role, id: string): Promise<AdminUser> => {
    const { data } = await AxiosInstance.post<{ data: AdminUser }>(
      `${basePath(role)}/${id}/resend-invite`
    );
    return data.data;
  },
};
