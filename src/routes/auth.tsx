import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Admin Sign In — Chalet Rivera" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

const credsSchema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(8, "At least 8 characters").max(72),
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/admin" });
    });
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = credsSchema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword(parsed.data);
        if (error) throw error;
        toast.success("Welcome back");
        navigate({ to: "/admin" });
      } else {
        const { error } = await supabase.auth.signUp({
          ...parsed.data,
          options: { emailRedirectTo: window.location.origin + "/admin" },
        });
        if (error) throw error;
        toast.success("Account created — you can sign in now.");
        setMode("signin");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin + "/auth",
      });
      if (result.error) throw result.error;
      if (result.redirected) return;
      navigate({ to: "/admin" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Google sign-in failed");
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="font-display italic text-2xl block text-center mb-2">
          Chalet Rivera
        </Link>
        <p className="text-center text-xs uppercase tracking-[0.3em] text-muted-foreground mb-10">
          Caretaker Access
        </p>

        <div className="bg-card ring-1 ring-border rounded-sm p-8 space-y-6">
          <div className="flex gap-2 text-[11px] uppercase tracking-widest">
            <button
              onClick={() => setMode("signin")}
              className={`flex-1 py-2 transition-colors ${mode === "signin" ? "border-b-2 border-primary text-foreground" : "border-b border-border text-muted-foreground"}`}
            >
              Sign In
            </button>
            <button
              onClick={() => setMode("signup")}
              className={`flex-1 py-2 transition-colors ${mode === "signup" ? "border-b-2 border-primary text-foreground" : "border-b border-border text-muted-foreground"}`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <label className="flex flex-col gap-2">
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Email</span>
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-transparent border-b border-border py-2 text-sm focus:outline-none focus:border-primary"
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Password</span>
              <input
                type="password"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-transparent border-b border-border py-2 text-sm focus:outline-none focus:border-primary"
              />
            </label>
            <button
              type="submit"
              disabled={busy}
              className="w-full bg-foreground text-background py-3 rounded-full text-[11px] uppercase tracking-widest font-bold hover:bg-primary transition-colors disabled:opacity-50"
            >
              {busy ? "…" : mode === "signin" ? "Sign In" : "Create Account"}
            </button>
          </form>

          <div className="flex items-center gap-3 text-[10px] uppercase tracking-widest text-muted-foreground">
            <div className="flex-1 h-px bg-border" />
            or
            <div className="flex-1 h-px bg-border" />
          </div>

          <button
            onClick={handleGoogle}
            disabled={busy}
            className="w-full border border-border py-3 rounded-full text-[11px] uppercase tracking-widest font-medium hover:bg-accent transition-colors disabled:opacity-50"
          >
            Continue with Google
          </button>

          {mode === "signup" && (
            <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
              The first account created becomes the cottage admin.
            </p>
          )}
        </div>

        <div className="text-center mt-8">
          <Link to="/" className="text-[11px] uppercase tracking-widest text-muted-foreground hover:text-foreground">
            ← Return to site
          </Link>
        </div>
      </div>
    </div>
  );
}
