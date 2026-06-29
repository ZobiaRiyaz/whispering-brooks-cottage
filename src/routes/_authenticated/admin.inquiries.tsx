import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { deleteInquiry, listInquiries, updateInquiry } from "@/lib/admin.functions";
import { StatusBadge } from "./admin.index";
import { toast } from "sonner";
import { Trash2, X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/inquiries")({
  component: InquiriesPage,
});

type Inquiry = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  check_in: string;
  check_out: string;
  guests: number;
  message: string | null;
  status: "new" | "contacted" | "confirmed" | "declined";
  admin_notes: string | null;
  created_at: string;
};

const STATUSES = ["all", "new", "contacted", "confirmed", "declined"] as const;

function InquiriesPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(listInquiries);
  const updateFn = useServerFn(updateInquiry);
  const deleteFn = useServerFn(deleteInquiry);

  const [filter, setFilter] = useState<(typeof STATUSES)[number]>("all");
  const [selected, setSelected] = useState<Inquiry | null>(null);

  const inquiries = useQuery({ queryKey: ["admin", "inquiries"], queryFn: () => listFn() });

  const updateMut = useMutation({
    mutationFn: (vars: { id: string; status?: Inquiry["status"]; admin_notes?: string | null }) =>
      updateFn({ data: vars }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin"] });
      toast.success("Updated");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Update failed"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin"] });
      setSelected(null);
      toast.success("Inquiry deleted");
    },
  });

  const items = (inquiries.data ?? []) as Inquiry[];
  const filtered = filter === "all" ? items : items.filter((i) => i.status === filter);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Bookings</p>
        <h1 className="font-display text-4xl mt-2">Inquiries</h1>
      </header>

      <div className="flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`text-[11px] uppercase tracking-widest px-3 py-1.5 rounded-full transition-colors ${
              filter === s ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:bg-accent"
            }`}
          >
            {s} {s !== "all" && `(${items.filter((i) => i.status === s).length})`}
          </button>
        ))}
      </div>

      <div className="ring-1 ring-border rounded-sm overflow-hidden bg-card">
        {inquiries.isLoading && <div className="p-6 text-sm text-muted-foreground">Loading…</div>}
        {!inquiries.isLoading && filtered.length === 0 && (
          <div className="p-10 text-center text-sm text-muted-foreground">No inquiries in this view.</div>
        )}
        <div className="divide-y divide-border">
          {filtered.map((i) => (
            <button
              key={i.id}
              onClick={() => setSelected(i)}
              className="w-full text-left p-4 hover:bg-accent transition-colors grid grid-cols-12 gap-3 items-center"
            >
              <div className="col-span-12 md:col-span-3 min-w-0">
                <div className="font-medium truncate">{i.name}</div>
                <div className="text-xs text-muted-foreground truncate">{i.email}</div>
              </div>
              <div className="col-span-6 md:col-span-3 text-sm">
                {i.check_in} → {i.check_out}
              </div>
              <div className="col-span-3 md:col-span-2 text-sm text-muted-foreground">{i.guests} guests</div>
              <div className="col-span-3 md:col-span-2 text-xs text-muted-foreground">
                {new Date(i.created_at).toLocaleDateString()}
              </div>
              <div className="col-span-12 md:col-span-2 flex md:justify-end">
                <StatusBadge status={i.status} />
              </div>
            </button>
          ))}
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center p-0 md:p-6" onClick={() => setSelected(null)}>
          <div
            className="bg-background w-full max-w-lg rounded-t-2xl md:rounded-sm ring-1 ring-border max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Inquiry</p>
                <h2 className="font-display text-2xl mt-1">{selected.name}</h2>
              </div>
              <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground">
                <X className="size-5" />
              </button>
            </div>
            <div className="p-6 space-y-5 text-sm">
              <Detail label="Email"><a href={`mailto:${selected.email}`} className="text-primary hover:underline">{selected.email}</a></Detail>
              {selected.phone && <Detail label="Phone"><a href={`tel:${selected.phone}`} className="text-primary hover:underline">{selected.phone}</a></Detail>}
              <Detail label="Dates">{selected.check_in} → {selected.check_out}</Detail>
              <Detail label="Guests">{selected.guests}</Detail>
              {selected.message && <Detail label="Message"><p className="whitespace-pre-wrap">{selected.message}</p></Detail>}
              <Detail label="Submitted">{new Date(selected.created_at).toLocaleString()}</Detail>

              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Status</p>
                <div className="flex flex-wrap gap-2">
                  {(["new", "contacted", "confirmed", "declined"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => updateMut.mutate({ id: selected.id, status: s })}
                      disabled={updateMut.isPending}
                      className={`text-[11px] uppercase tracking-widest px-3 py-1.5 rounded-full transition-colors ${
                        selected.status === s ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:bg-accent"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                {selected.status !== "confirmed" && (
                  <p className="text-[11px] text-muted-foreground mt-2">Marking <em>confirmed</em> will block these dates on the public calendar.</p>
                )}
              </div>

              <div>
                <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Private notes</label>
                <textarea
                  defaultValue={selected.admin_notes ?? ""}
                  onBlur={(e) => {
                    if (e.target.value !== (selected.admin_notes ?? "")) {
                      updateMut.mutate({ id: selected.id, admin_notes: e.target.value || null });
                    }
                  }}
                  rows={3}
                  className="mt-2 w-full bg-transparent border border-border rounded-sm p-3 text-sm focus:outline-none focus:border-primary"
                  placeholder="Notes saved automatically when you click away"
                />
              </div>

              <button
                onClick={() => {
                  if (confirm("Delete this inquiry? This cannot be undone.")) deleteMut.mutate(selected.id);
                }}
                className="flex items-center gap-2 text-xs text-destructive hover:underline"
              >
                <Trash2 className="size-3.5" /> Delete inquiry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <div className="mt-1">{children}</div>
    </div>
  );
}
