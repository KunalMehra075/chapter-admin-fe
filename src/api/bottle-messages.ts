import { AxiosInstance } from "./axios";
import type { Pagination } from "./waitlist";

export interface BottleMessage {
  _id: string;
  content: string;
  senderEmail: string;
  recipientEmail: string | null;
  isDraft: boolean;
  shareableToken: string;
  acknowledgedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BottleMessageUser {
  _id: string;
  email: string;
  displayName: string | null;
  sentCount: number;
  lastActivityAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BottleStats {
  totalMessages: number;
  totalUsers: number;
  totalEmailed: number;
  totalDrafts: number;
}

export interface BottleUsersListParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface BottleUsersListResponse {
  data: BottleMessageUser[];
  pagination: Pagination;
}

export interface BottleMessagesListResponse {
  data: BottleMessage[];
  pagination: Pagination;
}

export const bottleMessagesApi = {
  getStats: async (): Promise<BottleStats> => {
    const { data } = await AxiosInstance.get<{ data: BottleStats }>(
      "/api/admin/bottle-messages/stats"
    );
    return data.data;
  },

  listUsers: async (
    params: BottleUsersListParams = {}
  ): Promise<BottleUsersListResponse> => {
    const { data } = await AxiosInstance.get<BottleUsersListResponse>(
      "/api/admin/bottle-message-users",
      { params }
    );
    return data;
  },

  listMessagesBySender: async (
    senderEmail: string,
    opts: { limit?: number } = {}
  ): Promise<BottleMessagesListResponse> => {
    const { data } = await AxiosInstance.get<BottleMessagesListResponse>(
      "/api/admin/bottle-messages",
      { params: { senderEmail, limit: opts.limit ?? 100 } }
    );
    return data;
  },
};
