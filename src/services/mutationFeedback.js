import toast from "react-hot-toast";
export function mutationFeedback(response) {
  const method = response.config.method?.toLowerCase();
  const url = response.config.url || "";
  // Authentication and payment verification have their own completion UI.
  // Commission approvals already display a toast with settlement details.
  if (["post", "put", "patch", "delete"].includes(method) && response.data?.success !== false
      && !response.config.silentSuccess && !/auth|login|register|checkout|webhooks/.test(url)
      && !/commissions\/[^/]+\/approve/.test(url)) {
    const message = response.data?.message || (method === "delete" ? "Removed successfully." : "Saved successfully.");
    toast.success(message, { id: `saved:${url}`, duration: 3500 });
  }
  return response;
}
