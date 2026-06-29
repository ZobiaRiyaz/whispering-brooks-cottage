import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getStats, listInquiries } from "@/lib/admin.functions";
import { MailQuestion, CalendarCheck, Inbox, Percent } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const navigate = useNavigate();
  const statsFn = useServerFn(getStats);
  const inquiriesFn = useServerFn(listInquiries);

  const stats = useQuery({ queryKey: ["admin", "stats"], queryFn: () => statsFn() });
  const inquiries = useQuery({ queryKey: ["admin", "inquiries"], queryFn: () => inquiriesFn() });

  const recent = (inquiries.data ?? []).slice(0, 5);

  const cards = [
    { label: "Total Inquiries", value: stats.data?.total ?? "—", icon: Inbox },
    { label: "New / Unread", value: stats.data?.newCount ?? "—", icon: MailQuestion, highlight: (stats.data?.newCount ?? 0) > 0 },
    { label: "Upcoming Stays", value: stats.data?.upcoming ?? "—", icon: CalendarCheck },
    { label: `Occupancy · ${stats.data?.monthLabel ?? ""}`, value: stats.data ? `${stats.data.occupancyPct}%` : "—", icon: Percent },
  ];

  return (
    <div className="space-y-10">
      <header>
        <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Overview</p>
        <h1 className="font-display text-4xl mt-2">Welcome back.</h1>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.label}
              className={`p-5 rounded-sm ring-1 ring-border bg-card ${c.highlight ? "ring-primary/40 bg-primary/5" : ""}`}
            >
              <div className="flex items-center justify-between mb-3 text-muted-foreground">
                <span className="text-[10px] uppercase tracking-widest">{c.label}</span>
                <Icon className="size-4" />
              </div>
              <div className="text-3xl font-display">{c.value}</div>
            </div>
          );
        })}
      </div>

      <section>
        <div className="flex items-end justify-between mb-4">
          <h2 className="font-display text-2xl">Recent Inquiries</h2>
          <button
            onClick={() => navigate({ to: "/admin/inquiries" })}
            className="text-[11px] uppercase tracking-widest text-muted-foreground hover:text-foreground"
          >
            View all →
          </button>
        </div>
        <div className="ring-1 ring-border rounded-sm overflow-hidden bg-card">
          {inquiries.isLoading && <div className="p-6 text-sm text-muted-foreground">Loading…</div>}
          {!inquiries.isLoading && recent.length === 0 && (
            <div className="p-10 text-center text-sm text-muted-foreground">
              No inquiries yet. They'll appear here when guests submit the booking form.
            </div>
          )}
          {recent.map((i) => (
            <button
              key={i.id}
              onClick={() => navigate({ to: "/admin/inquiries" })}
              className="w-full text-left p-4 border-b border-border last:border-b-0 hover:bg-accent transition-colors flex items-center justify-between gap-4"
            >
              <div className="min-w-0">
                <div className="font-medium truncate">{i.name}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {i.check_in} → {i.check_out} · {i.guests} guests
                </div>
              </div>
              <StatusBadge status={i.status} />
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    new: "bg-primary/15 text-primary",
    contacted: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    confirmed: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    declined: "bg-muted text-muted-foreground",
  };
  return (
    <span className={`text-[10px] uppercase tracking-widest px-2 py-1 rounded-full ${styles[status] ?? ""}`}>
      {status}
    </span>
  );
}
