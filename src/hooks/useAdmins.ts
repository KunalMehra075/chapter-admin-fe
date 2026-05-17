import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  adminsApi,
  type AdminListParams,
  type CreateAdminInput,
  type UpdateAdminInput,
} from "@/api/admins";
import type { Role } from "@/lib/permissions";

const keys = {
  all: (role: Role) => ["admins", role] as const,
  list: (role: Role, params: AdminListParams) =>
    ["admins", role, "list", params] as const,
  one: (role: Role, id: string) => ["admins", role, "one", id] as const,
};

export const useAdminList = (role: Role, params: AdminListParams) =>
  useQuery({
    queryKey: keys.list(role, params),
    queryFn: () => adminsApi.list(role, params),
    placeholderData: (previous) => previous,
  });

export const useAdmin = (role: Role, id: string | null) =>
  useQuery({
    queryKey: keys.one(role, id ?? ""),
    queryFn: () => adminsApi.getById(role, id as string),
    enabled: !!id,
  });

export const useCreateAdmin = (role: Role) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAdminInput) => adminsApi.create(role, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all(role) }),
  });
};

export const useUpdateAdmin = (role: Role) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateAdminInput }) =>
      adminsApi.update(role, id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all(role) }),
  });
};

export const useDeleteAdmin = (role: Role) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminsApi.remove(role, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all(role) }),
  });
};

export const useResendInvite = (role: Role) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminsApi.resendInvite(role, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all(role) }),
  });
};
