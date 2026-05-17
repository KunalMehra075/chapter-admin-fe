import { useQuery } from "@tanstack/react-query";

import {
  bottleMessagesApi,
  type BottleUsersListParams,
} from "@/api/bottle-messages";

const KEYS = {
  all: ["bottle"] as const,
  stats: ["bottle", "stats"] as const,
  users: (params: BottleUsersListParams) =>
    ["bottle", "users", params] as const,
  messagesBySender: (email: string) =>
    ["bottle", "messages", "by-sender", email] as const,
};

export const useBottleStats = () =>
  useQuery({
    queryKey: KEYS.stats,
    queryFn: () => bottleMessagesApi.getStats(),
  });

export const useBottleUsers = (params: BottleUsersListParams) =>
  useQuery({
    queryKey: KEYS.users(params),
    queryFn: () => bottleMessagesApi.listUsers(params),
    placeholderData: (previous) => previous,
  });

export const useBottleMessagesBySender = (email: string | null) =>
  useQuery({
    queryKey: KEYS.messagesBySender(email ?? ""),
    queryFn: () => bottleMessagesApi.listMessagesBySender(email as string),
    enabled: Boolean(email),
  });
