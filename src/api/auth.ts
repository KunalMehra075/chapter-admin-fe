import { AxiosInstance } from "./axios";
import type { Role } from "@/lib/permissions";

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  role: Role;
  access: string[];
}

export interface SessionTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginNormalResponse extends SessionTokens {
  user: Pick<CurrentUser, "email" | "role" | "access">;
  mustChangePassword?: never;
}

export interface LoginPendingResponse {
  mustChangePassword: true;
  firstLoginToken: string;
  user: Pick<CurrentUser, "email" | "role">;
  accessToken?: never;
  refreshToken?: never;
}

export type LoginResponse = LoginNormalResponse | LoginPendingResponse;

export const authApi = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const { data } = await AxiosInstance.post<LoginResponse>("/api/auth/login", {
      email,
      password,
    });
    return data;
  },

  completeInvite: async (
    firstLoginToken: string,
    newPassword: string
  ): Promise<SessionTokens & { user: Pick<CurrentUser, "email" | "role" | "access"> }> => {
    const { data } = await AxiosInstance.post<
      SessionTokens & { user: Pick<CurrentUser, "email" | "role" | "access"> }
    >("/api/auth/complete-invite", { firstLoginToken, newPassword });
    return data;
  },

  refresh: async (refreshToken: string): Promise<SessionTokens> => {
    const { data } = await AxiosInstance.post<SessionTokens>("/api/auth/refresh", {
      refreshToken,
    });
    return data;
  },

  logout: async (refreshToken: string): Promise<void> => {
    await AxiosInstance.post("/api/auth/logout", { refreshToken });
  },

  me: async (): Promise<CurrentUser> => {
    const { data } = await AxiosInstance.get<{ data: CurrentUser }>("/api/auth/me");
    return data.data;
  },

  requestPasswordReset: async (email: string): Promise<void> => {
    await AxiosInstance.post("/api/auth/request-password-reset", { email });
  },

  resetPassword: async (token: string, newPassword: string): Promise<void> => {
    await AxiosInstance.post("/api/auth/reset-password", { token, newPassword });
  },
};
