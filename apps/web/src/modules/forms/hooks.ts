import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "../../lib/api";

const API = "https://client-portal.qilife.workers.dev";

export function useForms(token?: string) {
  return useQuery({
    queryKey: ["forms"],
    queryFn: () => apiGet(`${API}/api/forms`, token!),
    enabled: Boolean(token),
    staleTime: 30_000,
    retry: 1,
  });
}

export function useCreateForm(token?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { title: string; schema: any }) => apiPost(`${API}/api/forms`, body, token!),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["forms"] });
    },
  });
}
