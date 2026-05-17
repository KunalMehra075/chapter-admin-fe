import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { authApi, type CurrentUser, type SessionTokens } from "@/api/auth";
import { authStorage } from "@/lib/auth-storage";
import { AUTH_EVENTS } from "@/api/axios";

export type AuthStatus =
  | "loading"
  | "authenticated"
  | "unauthenticated"
  | "must-change-password";

interface AuthState {
  user: CurrentUser | null;
  status: AuthStatus;
  firstLoginToken: string | null;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<{ mustChangePassword: boolean }>;
  logout: () => Promise<void>;
  completeInvite: (newPassword: string) => Promise<void>;
  refetchUser: () => Promise<void>;
  setFirstLoginToken: (token: string | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<AuthState>(() => {
    const storedUser = authStorage.getUser();
    const accessToken = authStorage.getAccessToken();
    return {
      user: storedUser,
      status: storedUser && accessToken ? "loading" : "unauthenticated",
      firstLoginToken: null,
    };
  });

  const mountedRef = useRef(true);

  const refetchUser = useCallback(async (): Promise<void> => {
    const accessToken = authStorage.getAccessToken();
    if (!accessToken) {
      setState((s) => ({ ...s, user: null, status: "unauthenticated" }));
      return;
    }
    try {
      const user = await authApi.me();
      authStorage.setUser(user);
      if (!mountedRef.current) return;
      setState({ user, status: "authenticated", firstLoginToken: null });
    } catch {
      authStorage.clear();
      if (!mountedRef.current) return;
      setState({ user: null, status: "unauthenticated", firstLoginToken: null });
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    const accessToken = authStorage.getAccessToken();
    if (accessToken) {
      refetchUser();
    }
    return () => {
      mountedRef.current = false;
    };
  }, [refetchUser]);

  useEffect(() => {
    const handleLogout = () => {
      authStorage.clear();
      setState({ user: null, status: "unauthenticated", firstLoginToken: null });
    };
    window.addEventListener(AUTH_EVENTS.LOGOUT, handleLogout);
    return () => window.removeEventListener(AUTH_EVENTS.LOGOUT, handleLogout);
  }, []);

  const finalizeSession = useCallback(
    (tokens: SessionTokens, user: CurrentUser) => {
      authStorage.setTokens(tokens.accessToken, tokens.refreshToken);
      authStorage.setUser(user);
      setState({ user, status: "authenticated", firstLoginToken: null });
    },
    []
  );

  const login = useCallback<AuthContextValue["login"]>(
    async (email, password) => {
      const response = await authApi.login(email, password);
      if ("mustChangePassword" in response && response.mustChangePassword) {
        setState((s) => ({
          ...s,
          status: "must-change-password",
          firstLoginToken: response.firstLoginToken,
        }));
        return { mustChangePassword: true };
      }
      // normal session
      const sessionResp = response as Extract<typeof response, { accessToken: string }>;
      const fullUser = await fetchMeWithToken(sessionResp.accessToken);
      finalizeSession(
        { accessToken: sessionResp.accessToken, refreshToken: sessionResp.refreshToken },
        fullUser
      );
      return { mustChangePassword: false };
    },
    [finalizeSession]
  );

  const completeInvite = useCallback<AuthContextValue["completeInvite"]>(
    async (newPassword) => {
      const token = state.firstLoginToken;
      if (!token) throw new Error("No active invitation");
      const resp = await authApi.completeInvite(token, newPassword);
      const fullUser = await fetchMeWithToken(resp.accessToken);
      finalizeSession(
        { accessToken: resp.accessToken, refreshToken: resp.refreshToken },
        fullUser
      );
    },
    [state.firstLoginToken, finalizeSession]
  );

  const logout = useCallback<AuthContextValue["logout"]>(async () => {
    const refresh = authStorage.getRefreshToken();
    if (refresh) {
      try {
        await authApi.logout(refresh);
      } catch {
        // ignore — we're clearing local state regardless
      }
    }
    authStorage.clear();
    setState({ user: null, status: "unauthenticated", firstLoginToken: null });
  }, []);

  const setFirstLoginToken = useCallback((token: string | null) => {
    setState((s) => ({
      ...s,
      firstLoginToken: token,
      status: token ? "must-change-password" : s.status,
    }));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ ...state, login, logout, completeInvite, refetchUser, setFirstLoginToken }),
    [state, login, logout, completeInvite, refetchUser, setFirstLoginToken]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

const fetchMeWithToken = async (accessToken: string): Promise<CurrentUser> => {
  // Persist token first so AxiosInstance picks it up on the next request
  authStorage.setAccessToken(accessToken);
  return authApi.me();
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
};
