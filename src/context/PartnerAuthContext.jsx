import { endSession } from "../services/session";
import { createContext, useContext, useState, useCallback } from "react";

const PartnerAuthContext = createContext(null);

const readStored = (key) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export function PartnerAuthProvider({ children }) {
  const [partner, setPartner] = useState(() => readStored("partner"));
  const [user, setUser] = useState(() => readStored("partnerUser"));

  const setSession = useCallback((data) => {
    localStorage.setItem("partnerToken", data.token || "cookie");
    localStorage.setItem("partner", JSON.stringify(data.partner));
    localStorage.setItem("partnerUser", JSON.stringify(data.user));
    setPartner(data.partner);
    setUser(data.user);
  }, []);

  const logout = useCallback(async () => {
    await endSession("partner");
    localStorage.removeItem("partnerToken");
    localStorage.removeItem("partner");
    localStorage.removeItem("partnerUser");
    setPartner(null);
    setUser(null);
  }, []);

  const syncSession = useCallback((data) => {
    // Background responses must not restore a session after logout.
    if (!localStorage.getItem("partnerToken") || !data?.partner || !data?.user) return;
    const stored = readStored("partner");
    if (String(stored?._id || stored?.id) !== String(data.partner._id || data.partner.id)) return;
    if (JSON.stringify(stored) !== JSON.stringify(data.partner)) {
      localStorage.setItem("partner", JSON.stringify(data.partner));
      setPartner(data.partner);
    }
    if (JSON.stringify(readStored("partnerUser")) !== JSON.stringify(data.user)) {
      localStorage.setItem("partnerUser", JSON.stringify(data.user));
      setUser(data.user);
    }
  }, []);

  const hasPermission = useCallback(
    (permission) => {
      if (!user) return false;
      if (user.role === "owner") return true;
      if (["documents:view", "documents:upload", "bank:view", "bank:manage"].includes(permission)) return false;
      return (user.permissions || []).includes(permission);
    },
    [user]
  );

  return (
    <PartnerAuthContext.Provider value={{ partner, user, setSession, syncSession, logout, hasPermission }}>
      {children}
    </PartnerAuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const usePartnerAuth = () => useContext(PartnerAuthContext);
