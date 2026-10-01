import { createContext, useContext, useState, type ReactNode } from "react";
import { authApi } from "../api/api";
import type { User } from "../types";
interface AuthValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
}
const AuthContext = createContext<AuthValue | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState(localStorage.getItem("hirelens_token"));
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem("hirelens_user");
    return raw ? JSON.parse(raw) : null;
  });
  const login = async (email: string, password: string) => {
    const { data } = await authApi.login({ email, password });
    setToken(data.data.token);
    setUser(data.data.user);
    localStorage.setItem("hirelens_token", data.data.token);
    localStorage.setItem("hirelens_user", JSON.stringify(data.data.user));
    return data.data.user;
  };
  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("hirelens_token");
    localStorage.removeItem("hirelens_user");
  };
  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(token),
        isLoading: false,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
