import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  adminGroupsApi,
  type AdminGroupListParams,
  type CreateAdminGroupInput,
  type UpdateAdminGroupInput,
} from "@/api/admin-groups";

const keys = {
  all: ["admin-groups"] as const,
  list: (params: AdminGroupListParams) =>
    ["admin-groups", "list", params] as const,
  one: (id: string) => ["admin-groups", "one", id] as const,
};

export const useAdminGroupList = (params: AdminGroupListParams = {}) =>
  useQuery({
    queryKey: keys.list(params),
    queryFn: () => adminGroupsApi.list(params),
    placeholderData: (previous) => previous,
  });

export const useAdminGroup = (id: string | null) =>
  useQuery({
    queryKey: keys.one(id ?? ""),
    queryFn: () => adminGroupsApi.getById(id as string),
    enabled: !!id,
  });

export const useCreateAdminGroup = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAdminGroupInput) => adminGroupsApi.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
  });
};

export const useUpdateAdminGroup = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateAdminGroupInput }) =>
      adminGroupsApi.update(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
  });
};

export const useDeleteAdminGroup = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminGroupsApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
  });
};
