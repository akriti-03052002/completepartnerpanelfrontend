import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useCustomerAuth } from "../context/CustomerAuthContext";
import customerApi from "../services/customerApi";

// Reuse recent reads when moving between dashboard, screens and billing.
// The global mutation listener invalidates these immediately after a save.
export function useCustomerRead() {
  const client = useQueryClient();
  const { customer } = useCustomerAuth();
  const account = customer?._id || customer?.id || customer?.email;
  return useCallback(async url => {
    if (!account) return customerApi.get(url);
    return { data: await client.fetchQuery({
    queryKey: ["customerRead", account, url],
    queryFn: ({ signal }) => customerApi.get(url, { signal }).then(response => response.data),
    staleTime: 5000,
    retry: false
    }) };
  }, [client, account]);
}
