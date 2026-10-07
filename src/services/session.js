// Production uses the same-origin Vercel API proxy so cookies remain first-party.
export const API_BASE = import.meta.env.PROD ? "/api" : (import.meta.env.VITE_API_URL || "http://localhost:5000/api");
export const endSession = async (portal) => {
  const response = await fetch(`${API_BASE}/session/logout`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json", "X-Session-Mode": "cookie" }, body: JSON.stringify({ portal }) });
  if (!response.ok) throw new Error("Could not sign out. Please try again.");
};
