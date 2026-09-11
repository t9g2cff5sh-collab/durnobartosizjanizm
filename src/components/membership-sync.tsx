import { useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { ensureMembership } from "@/lib/domain";

export function MembershipSync() {
  const user = useCurrentUser();
  const queryClient = useQueryClient();

  const sync = useMutation({
    mutationFn: (displayName: string) => ensureMembership({ data: { displayName } }),
    onSuccess: (membership) => {
      queryClient.setQueryData(["me"], membership);
      void queryClient.invalidateQueries({ queryKey: ["domain"] });
    },
    onError: () => {
      /* signed-out or network — public page still renders */
    },
  });

  useEffect(() => {
    if (!user) return;
    sync.mutate(user.displayName?.trim() || "Bartosz");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync once per identity
  }, [user?.id]);

  return null;
}
