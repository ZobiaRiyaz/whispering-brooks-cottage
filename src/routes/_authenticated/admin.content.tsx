import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { updateContent } from "@/lib/admin.functions";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/content")({
  component: ContentPage,
});

type Content = {
  hero_headline: string;
  hero_subtitle: string;
  description: string;
  amenities: string[];
  contact_email: string;
};

function ContentPage() {
  const qc = useQueryClient();
  const updateFn = useServerFn(updateContent);

  const content = useQuery({
    queryKey: ["content"],
    queryFn: async () => {
      const { data, error } = await supabase.from("cottage_content").select("*").eq("id", 1).single();
      if (error) throw error;
      return data as Content;
    },
  });

  const [form, setForm] = useState<Content | null>(null);
  useEffect(() => {
    if (content.data && !form) setForm(content.data);
  }, [content.data, form]);

  const mut = useMutation({
    mutationFn: (data: Content) => updateFn({ data }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["content"] });
      toast.success("Saved — the public site is updated.");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Save failed"),
  });

  if (!form) return <div className="text-sm text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-6">
      <header>
        <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Public site</p>
        <h1 className="font-display text-4xl mt-2">Content</h1>
      </header>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          mut.mutate(form);
        }}
        className="space-y-6 bg-card ring-1 ring-border rounded-sm p-6"
      >
        <Field label="Hero headline">
          <input
            value={form.hero_headline}
            onChange={(e) => setForm({ ...form, hero_headline: e.target.value })}
            maxLength={200}
            className="input"
            required
          />
        </Field>

        <Field label="Hero subtitle">
          <textarea
            value={form.hero_subtitle}
            onChange={(e) => setForm({ ...form, hero_subtitle: e.target.value })}
            maxLength={500}
            rows={2}
            className="input"
            required
          />
        </Field>

        <Field label="Description">
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            maxLength={2000}
            rows={5}
            className="input"
            required
          />
        </Field>

        <Field label="Contact email">
          <input
            type="email"
            value={form.contact_email}
            onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
            maxLength={255}
            className="input"
            required
          />
        </Field>

        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Amenities</p>
          <div className="space-y-2">
            {form.amenities.map((a, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  value={a}
                  onChange={(e) => {
                    const next = [...form.amenities];
                    next[idx] = e.target.value;
                    setForm({ ...form, amenities: next });
                  }}
                  className="input flex-1"
                  maxLength={100}
                />
                <button
                  type="button"
                  onClick={() => setForm({ ...form, amenities: form.amenities.filter((_, i) => i !== idx) })}
                  className="p-2 text-muted-foreground hover:text-destructive"
                  aria-label="Remove amenity"
                >
                  <X className="size-4" />
                </button>
              </div>
            ))}
            {form.amenities.length < 20 && (
              <button
                type="button"
                onClick={() => setForm({ ...form, amenities: [...form.amenities, ""] })}
                className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground mt-2"
              >
                <Plus className="size-3.5" /> Add amenity
              </button>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={mut.isPending}
          className="bg-foreground text-background py-3 px-8 rounded-full text-[11px] uppercase tracking-widest font-bold hover:bg-primary transition-colors disabled:opacity-50"
        >
          {mut.isPending ? "Saving…" : "Save changes"}
        </button>
      </form>

      <style>{`
        .input {
          width: 100%;
          background: transparent;
          border: 1px solid hsl(var(--border));
          border-radius: 2px;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
        }
        .input:focus { outline: none; border-color: hsl(var(--primary)); }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground block mb-2">{label}</span>
      {children}
    </label>
  );
}
