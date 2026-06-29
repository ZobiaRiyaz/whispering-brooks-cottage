import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { addBlockedDate, listBlockedDates, removeBlockedDate } from "@/lib/admin.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/calendar")({
  component: CalendarPage,
});

type Block = {
  id: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  inquiry_id: string | null;
};

function ymd(d: Date) {
  return d.toISOString().slice(0, 10);
}

function CalendarPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(listBlockedDates);
  const addFn = useServerFn(addBlockedDate);
  const removeFn = useServerFn(removeBlockedDate);

  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });
  const [range, setRange] = useState<{ start?: string; end?: string }>({});

  const blocks = useQuery({ queryKey: ["admin", "blocks"], queryFn: () => listFn() });

  const addMut = useMutation({
    mutationFn: (vars: { start_date: string; end_date: string; reason?: string }) => addFn({ data: vars }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin"] });
      toast.success("Dates blocked");
      setRange({});
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const removeMut = useMutation({
    mutationFn: (id: string) => removeFn({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin"] });
      toast.success("Block removed");
    },
  });

  const blockedDays = useMemo(() => {
    const map = new Map<string, Block>();
    for (const b of (blocks.data ?? []) as Block[]) {
      const s = new Date(b.start_date);
      const e = new Date(b.end_date);
      for (let d = new Date(s); d < e; d.setDate(d.getDate() + 1)) {
        map.set(ymd(d), b);
      }
    }
    return map;
  }, [blocks.data]);

  const days = useMemo(() => {
    const first = new Date(cursor);
    const startWeekday = first.getDay();
    const last = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < startWeekday; i++) cells.push(null);
    for (let d = 1; d <= last; d++) cells.push(new Date(cursor.getFullYear(), cursor.getMonth(), d));
    return cells;
  }, [cursor]);

  function handleClick(d: Date) {
    const key = ymd(d);
    if (!range.start || (range.start && range.end)) {
      setRange({ start: key });
    } else if (key < range.start) {
      setRange({ start: key });
    } else {
      setRange({ start: range.start, end: key });
    }
  }

  function inSelection(key: string) {
    if (!range.start) return false;
    if (!range.end) return key === range.start;
    return key >= range.start && key <= range.end;
  }

  function submitBlock() {
    if (!range.start) return;
    const start = range.start;
    const endDate = new Date(range.end ?? range.start);
    endDate.setDate(endDate.getDate() + 1); // exclusive end
    addMut.mutate({ start_date: start, end_date: ymd(endDate), reason: "Manual block" });
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Availability</p>
        <h1 className="font-display text-4xl mt-2">Calendar</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Click a start date, then an end date, to block a range. Confirmed bookings appear here automatically.
        </p>
      </header>

      <div className="ring-1 ring-border rounded-sm bg-card p-4 md:p-6">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
            className="p-2 hover:bg-accent rounded-md"
            aria-label="Previous month"
          >
            <ChevronLeft className="size-4" />
          </button>
          <h2 className="font-display text-xl">
            {cursor.toLocaleString("en", { month: "long", year: "numeric" })}
          </h2>
          <button
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
            className="p-2 hover:bg-accent rounded-md"
            aria-label="Next month"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>

        <div className="grid grid-cols-7 text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="text-center py-1">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((d, i) => {
            if (!d) return <div key={`x${i}`} />;
            const key = ymd(d);
            const blocked = blockedDays.get(key);
            const selected = inSelection(key);
            const isToday = key === ymd(new Date());
            return (
              <button
                key={key}
                onClick={() => handleClick(d)}
                className={`aspect-square text-sm rounded-md transition-colors relative ${
                  blocked
                    ? "bg-destructive/15 text-destructive cursor-help"
                    : selected
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-accent"
                } ${isToday ? "ring-1 ring-primary" : ""}`}
                title={blocked ? blocked.reason ?? "Blocked" : ""}
              >
                {d.getDate()}
              </button>
            );
          })}
        </div>

        {range.start && (
          <div className="mt-6 flex items-center justify-between gap-4 p-4 bg-muted rounded-sm">
            <div className="text-sm">
              Block <strong>{range.start}</strong>
              {range.end && range.end !== range.start && <> → <strong>{range.end}</strong></>}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setRange({})} className="text-xs px-3 py-2 hover:bg-background rounded">Cancel</button>
              <button
                onClick={submitBlock}
                disabled={addMut.isPending}
                className="text-[11px] uppercase tracking-widest px-4 py-2 bg-foreground text-background rounded-full disabled:opacity-50"
              >
                {addMut.isPending ? "…" : "Block dates"}
              </button>
            </div>
          </div>
        )}
      </div>

      <section>
        <h2 className="font-display text-xl mb-3">All blocks</h2>
        <div className="ring-1 ring-border rounded-sm bg-card divide-y divide-border">
          {blocks.isLoading && <div className="p-6 text-sm text-muted-foreground">Loading…</div>}
          {!blocks.isLoading && (blocks.data ?? []).length === 0 && (
            <div className="p-6 text-sm text-muted-foreground">No blocks yet.</div>
          )}
          {((blocks.data ?? []) as Block[]).map((b) => (
            <div key={b.id} className="p-4 flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-medium">{b.start_date} → {b.end_date}</div>
                <div className="text-xs text-muted-foreground">{b.reason ?? "Blocked"}</div>
              </div>
              {!b.inquiry_id && (
                <button
                  onClick={() => removeMut.mutate(b.id)}
                  className="p-2 text-muted-foreground hover:text-destructive"
                  aria-label="Remove block"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
