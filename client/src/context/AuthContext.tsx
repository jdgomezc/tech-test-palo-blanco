import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const TOKEN_KEY = "auth_token";

interface JwtPayload {
  sub?: number;
  username?: string;
}

function decodePayload(token: string): JwtPayload | null {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(base64);
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

function getUsernameFromToken(token: string | null): string | null {
  if (!token) return null;
  const payload = decodePayload(token);
  return payload?.username ?? null;
}

interface AuthContextValue {
  token: string | null;
  username: string | null;
  isAuthenticated: boolean;
  setToken: (token: string | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(getStoredToken);
  const username = useMemo(() => getUsernameFromToken(token), [token]);

  const setToken = useCallback((newToken: string | null) => {
    if (newToken) {
      localStorage.setItem(TOKEN_KEY, newToken);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
    setTokenState(newToken);
  }, []);

  const logout = useCallback(() => setToken(null), [setToken]);

  const value = useMemo(
    () => ({
      token,
      username,
      isAuthenticated: !!token,
      setToken,
      logout,
    }),
    [token, username, setToken, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
