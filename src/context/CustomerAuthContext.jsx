import { endSession } from "../services/session";
import { createContext, useContext, useState, useCallback } from "react";

const CustomerAuthContext = createContext(null);

const readStored = (key) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export function CustomerAuthProvider({ children }) {
  const [customer, setCustomer] = useState(() => readStored("customer"));

  const setSession = useCallback((data) => {
    localStorage.setItem("customerToken", data.token || "cookie");
    localStorage.setItem("customer", JSON.stringify(data.customer));
    setCustomer(data.customer);
  }, []);

  const logout = useCallback(async () => {
    await endSession("customer");
    localStorage.removeItem("customerToken");
    localStorage.removeItem("customer");
    setCustomer(null);
  }, []);

  return (
    <CustomerAuthContext.Provider value={{ customer, setSession, logout }}>
      {children}
    </CustomerAuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useCustomerAuth = () => useContext(CustomerAuthContext);
