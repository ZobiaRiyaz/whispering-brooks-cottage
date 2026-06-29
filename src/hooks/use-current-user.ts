import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type CurrentUser = {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
};

export function useCurrentUser(): CurrentUser {
  const [state, setState] = useState<CurrentUser>({ user: null, isAdmin: false, loading: true });

  useEffect(() => {
    let active = true;

    async function resolve(user: User | null) {
      if (!user) {
        if (active) setState({ user: null, isAdmin: false, loading: false });
        return;
      }
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (active) setState({ user, isAdmin: !!data, loading: false });
    }

    supabase.auth.getUser().then(({ data }) => resolve(data.user ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED" || event === "INITIAL_SESSION") {
        resolve(session?.user ?? null);
      }
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return state;
}
