import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  waitlistApi,
  type WaitlistListParams,
  type WaitlistUserInput,
} from "@/api/waitlist";

const KEYS = {
  all: ["waitlist"] as const,
  list: (params: WaitlistListParams) => ["waitlist", "list", params] as const,
};

export const useWaitlistUsers = (params: WaitlistListParams) =>
  useQuery({
    queryKey: KEYS.list(params),
    queryFn: () => waitlistApi.list(params),
    placeholderData: (previous) => previous,
  });

export const useCreateWaitlistUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: WaitlistUserInput) => waitlistApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.all });
    },
  });
};

export const useUpdateWaitlistUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<WaitlistUserInput> }) =>
      waitlistApi.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.all });
    },
  });
};

export const useDeleteWaitlistUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => waitlistApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.all });
    },
  });
};
