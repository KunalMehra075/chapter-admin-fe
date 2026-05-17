import { AxiosError } from "axios";

export interface ApiError {
  status: number;
  message: string;
}

export const extractApiError = (error: unknown): ApiError => {
  if (error instanceof AxiosError) {
    const status = error.response?.status ?? 0;
    const data = error.response?.data as { error?: string; message?: string } | undefined;
    const message =
      data?.error ||
      data?.message ||
      error.message ||
      "Something went wrong. Please try again.";
    return { status, message };
  }
  if (error instanceof Error) {
    return { status: 0, message: error.message };
  }
  return { status: 0, message: "Unknown error" };
};
