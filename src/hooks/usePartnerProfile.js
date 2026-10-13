import { useQuery } from "@tanstack/react-query";
import { usePartnerAuth } from "../context/PartnerAuthContext";
import api from "../services/api";

// One account-scoped request shared by the layout, gate and progress cards.
export function usePartnerProfile() {
  const { partner, user } = usePartnerAuth();
  return useQuery({
    queryKey: ["partnerProfile", partner?._id || partner?.id, user?._id || user?.id],
    queryFn: ({ signal }) => api.get("/partner/profile", { signal }).then(response => response.data.data),
    enabled: Boolean(partner && user && localStorage.getItem("partnerToken")),
    staleTime: 10000,
    refetchInterval: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: false
  });
}
