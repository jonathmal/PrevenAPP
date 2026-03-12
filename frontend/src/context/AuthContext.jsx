import { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem("prevenapp_token");
    if (!token) { setLoading(false); return; }
    try {
      api.token = token;
      const res = await api.getMe();
      setUser(res.data.user);
      setPatient(res.data.patient);
    } catch {
      api.logout();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUser(); }, [loadUser]);

  const login = async (cedula, password) => {
    const data = await api.login(cedula, password);
    setUser(data.user);
    if (data.patientId) {
      localStorage.setItem("prevenapp_patientId", data.patientId);
    }
    // Reload full profile
    const me = await api.getMe();
    setUser(me.data.user);
    setPatient(me.data.patient);
    return data;
  };

  const logout = () => {
    api.logout();
    setUser(null);
    setPatient(null);
  };

  return (
    <AuthContext.Provider value={{ user, patient, loading, login, logout, isDoctor: user?.role === "doctor" }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
