import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LayoutDashboard, MailQuestion, CalendarDays, FileText, LogOut, Menu, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-current-user";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — Chalet Rivera" }, { name: "robots", content: "noindex" }] }),
  component: AdminLayout,
});

const nav = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/inquiries", label: "Inquiries", icon: MailQuestion },
  { to: "/admin/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/admin/content", label: "Content", icon: FileText },
] as const;

function AdminLayout() {
  const { user, isAdmin, loading } = useCurrentUser();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!loading && user && !isAdmin) {
      toast.error("This account is not an admin.");
      navigate({ to: "/" });
    }
  }, [loading, user, isAdmin, navigate]);

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  if (loading || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground text-sm">
        Loading…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile toggle */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="md:hidden fixed top-4 left-4 z-50 bg-foreground text-background p-2 rounded-md"
        aria-label="Toggle navigation"
      >
        {open ? <X className="size-4" /> : <Menu className="size-4" />}
      </button>

      {/* Sidebar */}
      <aside
        className={`${open ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 transition-transform fixed md:static z-40 inset-y-0 left-0 w-64 bg-card border-r border-border flex flex-col`}
      >
        <div className="p-6 border-b border-border">
          <Link to="/" className="font-display italic text-xl">Chalet Rivera</Link>
          <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mt-1">Caretaker</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {nav.map((item) => {
            const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                  active ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-border space-y-2">
          <p className="px-3 text-[11px] text-muted-foreground truncate">{user?.email}</p>
          <button
            onClick={signOut}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <LogOut className="size-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 md:ml-0 overflow-x-hidden">
        <div className="max-w-6xl mx-auto p-6 md:p-10 pt-16 md:pt-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
