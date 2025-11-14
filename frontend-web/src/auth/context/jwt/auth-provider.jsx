"use client";
import { useSetState } from "minimal-shared/hooks";
import { useMemo, useEffect, useCallback } from "react";

import { JWT_STORAGE_KEY } from "./constant";
import { AuthContext } from "../auth-context";
import { setSession, isValidToken } from "./utils";
import { getSellerSession } from "src/actions/seller";
import { getAdminSession } from "src/actions/admin";

// ----------------------------------------------------------------------

export function AuthProvider({ children }) {
  const { state, setState } = useSetState({ user: null, loading: true });

  const checkUserSession = useCallback(async () => {
    try {
      const accessToken = sessionStorage.getItem(JWT_STORAGE_KEY);

      if (accessToken && isValidToken(accessToken)) {
        setSession(accessToken);

        // 빌드 모드에 따라 세션 조회 함수 선택
        const isAdminMode = process.env.NEXT_PUBLIC_BUILD_MODE === "admin";
        const sessionData = isAdminMode
          ? await getAdminSession()
          : await getSellerSession();

        const user = sessionData.admin || sessionData.user;

        setState({ user: { ...user, accessToken }, loading: false });
      } else {
        setState({ user: null, loading: false });
      }
    } catch (error) {
      console.error("Failed to check user session", error);
      setState({ user: null, loading: false });
    }
  }, [setState]);

  useEffect(() => {
    checkUserSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ----------------------------------------------------------------------

  const checkAuthenticated = state.user ? "authenticated" : "unauthenticated";

  const status = state.loading ? "loading" : checkAuthenticated;

  const memoizedValue = useMemo(
    () => {
      const isAdminMode = process.env.NEXT_PUBLIC_BUILD_MODE === "admin";
      const defaultRole = isAdminMode ? "admin" : "partner";

      return {
        user: state.user
          ? { ...state.user, role: state.user?.role ?? defaultRole }
          : null,
        checkUserSession,
        loading: status === "loading",
        authenticated: status === "authenticated",
        unauthenticated: status === "unauthenticated",
      };
    },
    [checkUserSession, state.user, status]
  );

  return <AuthContext value={memoizedValue}>{children}</AuthContext>;
}
