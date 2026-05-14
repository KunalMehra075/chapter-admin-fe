import { AxiosInstance } from "./axios";

export interface WaitlistUser {
  _id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface WaitlistListResponse {
  data: WaitlistUser[];
  pagination: Pagination;
}

export interface WaitlistListParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface WaitlistUserInput {
  name: string;
  email: string;
}

export const waitlistApi = {
  list: async (params: WaitlistListParams = {}): Promise<WaitlistListResponse> => {
    const { data } = await AxiosInstance.get<WaitlistListResponse>("/api/waitlist", {
      params,
    });
    return data;
  },

  getById: async (id: string): Promise<WaitlistUser> => {
    const { data } = await AxiosInstance.get<{ data: WaitlistUser }>(
      `/api/waitlist/${id}`
    );
    return data.data;
  },

  create: async (input: WaitlistUserInput): Promise<WaitlistUser> => {
    const { data } = await AxiosInstance.post<{ data: WaitlistUser }>(
      "/api/waitlist",
      input
    );
    return data.data;
  },

  update: async (
    id: string,
    input: Partial<WaitlistUserInput>
  ): Promise<WaitlistUser> => {
    const { data } = await AxiosInstance.put<{ data: WaitlistUser }>(
      `/api/waitlist/${id}`,
      input
    );
    return data.data;
  },

  remove: async (id: string): Promise<WaitlistUser> => {
    const { data } = await AxiosInstance.delete<{ data: WaitlistUser }>(
      `/api/waitlist/${id}`
    );
    return data.data;
  },
};
