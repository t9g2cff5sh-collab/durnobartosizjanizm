import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";
import { Paywall } from "@/components/paywall";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getDuesStatus } from "@/lib/dues";
import { getMyCredo, saveCredo } from "@/lib/domain";
import { useResolvedAuth } from "@/lib/use-resolved-auth";
import { CREDO_LINE } from "@/lib/world";

export function CredoBox() {
  const { isSignedIn } = useResolvedAuth();
  const queryClient = useQueryClient();
  const dues = useQuery({
    queryKey: ["dues"],
    queryFn: () => getDuesStatus(),
    enabled: isSignedIn,
  });
  const mine = useQuery({
    queryKey: ["my-credo"],
    queryFn: () => getMyCredo(),
    enabled: isSignedIn,
  });
  const [credo, setCredo] = useState("");
  useEffect(() => {
    if (mine.data?.credo != null) setCredo(mine.data.credo);
  }, [mine.data?.credo]);

  const save = useMutation({
    mutationFn: () => saveCredo({ data: { credo } }),
    onSuccess: () => {
      toast.success("Kredo stoi.");
      void queryClient.invalidateQueries({ queryKey: ["my-credo"] });
      void queryClient.invalidateQueries({ queryKey: ["credos"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (!isSignedIn) {
    return (
      <p className="mt-3 text-sm text-muted">
        <Link to="/login" className="underline underline-offset-4">
          Wejdź
        </Link>
        , żeby zapisać swoje.
      </p>
    );
  }

  if (dues.data && !dues.data.paid) {
    return <Paywall action="złożyć kredo" />;
  }

  return (
    <form
      className="mt-4 space-y-3"
      onSubmit={(event: FormEvent) => {
        event.preventDefault();
        save.mutate();
      }}
    >
      <p className="text-sm text-muted">{CREDO_LINE} Jedno zdanie. Swoje, nie chóru.</p>
      <Textarea
        value={credo}
        onChange={(e) => setCredo(e.target.value)}
        rows={3}
        maxLength={400}
        placeholder="Moje kredo."
        required
      />
      <Button type="submit" disabled={save.isPending}>
        Pieczętuj kredo
      </Button>
    </form>
  );
}
