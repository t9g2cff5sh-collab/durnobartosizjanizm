import { useRouteContext } from "@tanstack/react-router";
import {
  useCurrentUserState,
  type AppUser,
} from "@/lib/auth/use-current-user";

/**
 * First paint that matches SSR: cookie session from the root loader when
 * present, otherwise signed-out. Avoids a pending skeleton on the server
 * swapping into a sign-in button on the client (hydration mismatch).
 */
export function useResolvedAuth(): { user: AppUser | null; isSignedIn: boolean } {
  const { sessionUser } = useRouteContext({ from: "__root__" });
  const { user, isPending } = useCurrentUserState();

  if (user) return { user, isSignedIn: true };

  if (isPending && sessionUser) {
    return {
      user: {
        id: sessionUser.id,
        displayName: null,
        primaryEmail: sessionUser.email,
        profileImageUrl: null,
        isDevFallback: false,
      },
      isSignedIn: true,
    };
  }

  return { user: null, isSignedIn: false };
}
