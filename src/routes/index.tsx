import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import cottageExterior from "@/assets/cottage-exterior.jpg";
import hearthImg from "@/assets/hearth.jpg";
import bedroomImg from "@/assets/bedroom.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Chalet Rivera — One House. Three Brooks. Infinite Quiet." },
      { name: "description", content: "A single-occupancy two-bedroom mountain cottage with outdoor fireplace, tea stand, electric blankets and free wifi. Hosted one family at a time." },
      { property: "og:title", content: "Chalet Rivera — One House. Three Brooks. Infinite Quiet." },
      { property: "og:description", content: "A single-occupancy two-bedroom mountain cottage with outdoor fireplace, tea stand, electric blankets and free wifi." },
      { property: "og:image", content: cottageExterior },
      { name: "twitter:image", content: cottageExterior },
    ],
  }),
  component: Index,
});

type Content = {
  hero_headline: string;
  hero_subtitle: string;
  description: string;
  amenities: string[];
  contact_email: string;
};

const inquirySchema = z.object({
  name: z.string().trim().min(1, "Your name is required").max(100),
  email: z.string().trim().email("Enter a valid email").max(255),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  check_in: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick an arrival date"),
  check_out: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a departure date"),
  guests: z.number().int().min(1).max(20),
  message: z.string().max(2000).optional().or(z.literal("")),
});

function Index() {
  const [content, setContent] = useState<Content | null>(null);
  const [blocked, setBlocked] = useState<Array<{ start_date: string; end_date: string }>>([]);

  const [arrive, setArrive] = useState("");
  const [depart, setDepart] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [guests, setGuests] = useState(2);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase.from("cottage_content").select("*").eq("id", 1).single().then(({ data }) => {
      if (data) setContent(data as Content);
    });
    const loadBlocked = () =>
      supabase.from("blocked_dates").select("start_date,end_date").then(({ data }) => {
        if (data) setBlocked(data);
      });
    loadBlocked();
    const channel = supabase
      .channel("blocked_dates_public")
      .on("postgres_changes", { event: "*", schema: "public", table: "blocked_dates" }, () => {
        loadBlocked();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  function isDateConflict(start: string, end: string): boolean {
    if (!start || !end) return false;
    return blocked.some((b) => start < b.end_date && end > b.start_date);
  }

  const scrollTo = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = inquirySchema.safeParse({
      name, email, phone, check_in: arrive, check_out: depart, guests, message,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check the form");
      return;
    }
    if (parsed.data.check_out <= parsed.data.check_in) {
      toast.error("Departure must be after arrival");
      return;
    }
    if (isDateConflict(parsed.data.check_in, parsed.data.check_out)) {
      toast.error("Those dates are unavailable. Please choose another range.");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("inquiries").insert({
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
      check_in: parsed.data.check_in,
      check_out: parsed.data.check_out,
      guests: parsed.data.guests,
      message: parsed.data.message || null,
    });
    setSubmitting(false);
    if (error) {
      toast.error("Could not send your inquiry. Please try again.");
      return;
    }
    toast.success("Thank you. We'll write back within the day.");
    setName(""); setEmail(""); setPhone(""); setMessage(""); setArrive(""); setDepart(""); setGuests(2);
  }

  const heroLines = (content?.hero_headline ?? "One house. Three brooks. Infinite quiet.").split(/[.]\s*/).filter(Boolean);

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
      <nav className="fixed top-0 w-full z-50 px-6 py-8 flex justify-between items-center mix-blend-multiply">
        <a href="#" onClick={scrollTo("top")} className="font-display italic text-2xl tracking-tight">
          Chalet Rivera
        </a>
        <div className="hidden md:flex gap-8 text-[11px] uppercase tracking-[0.2em] font-medium">
          <a href="#brooks" onClick={scrollTo("brooks")} className="hover:text-primary transition-colors">The Brook</a>
          <a href="#amenities" onClick={scrollTo("amenities")} className="hover:text-primary transition-colors">Amenities</a>
          <a href="#reserve" onClick={scrollTo("reserve")} className="hover:text-primary transition-colors">Reserve</a>
        </div>
      </nav>

      <section id="top" className="pt-44 pb-24 px-6 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-12 gap-12 items-end">
          <div className="lg:col-span-7 animate-fade-up">
            <h1 className="text-6xl md:text-8xl font-display leading-[0.9] text-balance mb-8">
              {heroLines.map((line, i) => (
                <span key={i} className={i === 1 ? "italic block" : "block"}>
                  {line.trim()}.
                </span>
              ))}
            </h1>
            <p className="max-w-md text-lg text-muted-foreground leading-relaxed">
              {content?.hero_subtitle ?? "A solitary sanctuary tucked into the mountains."}
            </p>
          </div>
          <div className="lg:col-span-5 animate-fade-up [animation-delay:200ms]">
            <img src={cottageExterior} alt="Chalet Rivera at dusk between three mountain brooks" width={800} height={1000} className="w-full aspect-[4/5] object-cover rounded-sm ring-1 ring-border" />
          </div>
        </div>
      </section>

      <section id="brooks" className="py-32 bg-deep text-deep-foreground">
        <div className="max-w-4xl mx-auto px-6 flex flex-col items-center text-center">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] mb-12 opacity-60">The Offering</span>
          <h2 className="text-3xl md:text-5xl font-display italic leading-snug text-balance">
            {content?.description ?? "We believe luxury is the absence of others."}
          </h2>
        </div>
      </section>

      <section id="amenities" className="py-32 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 border-y border-border py-12">
          {(content?.amenities ?? []).map((a, i) => (
            <div key={i} className="flex flex-col gap-2">
              <span className="font-mono text-[10px] text-primary">{String(i + 1).padStart(2, "0")}</span>
              <span className="text-sm">{a}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="pb-32 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 md:col-span-8">
            <img src={hearthImg} alt="Steaming tea cups beside the outdoor stone fireplace" width={1216} height={800} loading="lazy" className="w-full aspect-video object-cover rounded-sm ring-1 ring-border" />
            <p className="mt-4 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">The Hearth</p>
          </div>
          <div className="col-span-12 md:col-span-4 flex flex-col">
            <img src={bedroomImg} alt="Cozy bedroom with electric blanket facing the pines" width={608} height={800} loading="lazy" className="w-full aspect-[3/4] object-cover rounded-sm ring-1 ring-border" />
            <p className="mt-4 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Interior</p>
          </div>
        </div>
      </section>

      <section id="reserve" className="pb-44 px-6 max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-primary">Reservation</span>
          <h2 className="font-display text-4xl md:text-5xl mt-4 text-balance">
            Inquire after your <span className="italic">private season</span>.
          </h2>
          <p className="mt-6 text-muted-foreground">
            Only one party at a time. Send your dates and we will write back within the day.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="bg-card ring-1 ring-border rounded-sm p-8 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Label text="Arrive">
              <input type="date" required value={arrive} onChange={(e) => setArrive(e.target.value)} min={new Date().toISOString().slice(0, 10)} className="field" />
            </Label>
            <Label text="Depart">
              <input type="date" required value={depart} onChange={(e) => setDepart(e.target.value)} min={arrive || new Date().toISOString().slice(0, 10)} className="field" />
            </Label>
            <Label text="Your Name">
              <input required value={name} onChange={(e) => setName(e.target.value)} className="field" />
            </Label>
            <Label text="Email">
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="field" />
            </Label>
            <Label text="Phone (optional)">
              <input value={phone} onChange={(e) => setPhone(e.target.value)} className="field" />
            </Label>
            <Label text="Party Size">
              <input type="number" min={1} max={20} value={guests} onChange={(e) => setGuests(Number(e.target.value) || 1)} className="field" />
            </Label>
          </div>
          <Label text="Message (optional)">
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} maxLength={2000} className="field" placeholder="Anything we should know?" />
          </Label>
          {arrive && depart && isDateConflict(arrive, depart) && (
            <p className="text-sm text-destructive">These dates overlap an existing booking. Please pick another range.</p>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-foreground text-background py-4 rounded-full text-[11px] uppercase tracking-widest font-bold hover:bg-primary transition-colors disabled:opacity-50"
          >
            {submitting ? "Sending…" : "Request the Cottage"}
          </button>
        </form>
        <style>{`
          .field {
            width: 100%;
            background: transparent;
            border-bottom: 1px solid hsl(var(--border));
            padding: 0.5rem 0;
            font-size: 0.875rem;
          }
          .field:focus { outline: none; border-color: hsl(var(--primary)); }
          textarea.field { border: 1px solid hsl(var(--border)); padding: 0.75rem; border-radius: 2px; }
        `}</style>
      </section>

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-4xl z-40 animate-fade-up [animation-delay:800ms]">
        <div className="bg-foreground text-background p-2 rounded-full flex items-center shadow-2xl ring-1 ring-white/10">
          <div className="flex-1 px-6 md:px-8 flex gap-6 md:gap-12 items-center">
            <div className="flex flex-col">
              <span className="text-[9px] uppercase tracking-widest opacity-50">Exclusive Stay</span>
              <span className="text-sm font-medium">Entire Cottage</span>
            </div>
            <div className="hidden sm:block h-6 w-px bg-white/10" />
            <div className="hidden sm:flex flex-col">
              <span className="text-[9px] uppercase tracking-widest opacity-50">Availability</span>
              <span className="text-sm font-medium">Select Dates</span>
            </div>
          </div>
          <a href="#reserve" onClick={scrollTo("reserve")} className="bg-primary text-primary-foreground px-6 md:px-10 py-3 md:py-4 rounded-full text-[11px] uppercase tracking-widest font-bold hover:scale-[1.02] active:scale-95 transition-transform">
            Reserve
          </a>
        </div>
      </div>

      <footer className="py-24 px-6 border-t border-border">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12">
          <div className="max-w-xs">
            <h4 className="font-display italic text-xl mb-4">Chalet Rivera</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              The High Woods, by Three Brooks.<br />
              {content?.contact_email ?? "hello@chaletrivera.com"}
            </p>
          </div>
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Designed for Silence &copy; 2026
          </div>
        </div>
      </footer>
    </div>
  );
}

function Label({ text, children }: { text: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{text}</span>
      {children}
    </label>
  );
}
