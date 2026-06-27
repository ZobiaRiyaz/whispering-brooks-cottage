import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
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

function Index() {
  const [arrive, setArrive] = useState("");
  const [depart, setDepart] = useState("");

  const scrollTo = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
      {/* Navigation */}
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

      {/* Hero */}
      <section id="top" className="pt-44 pb-24 px-6 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-12 gap-12 items-end">
          <div className="lg:col-span-7 animate-fade-up">
            <h1 className="text-6xl md:text-8xl font-display leading-[0.9] text-balance mb-8">
              One house.<br />
              <span className="italic">Three brooks.</span><br />
              Infinite quiet.
            </h1>
            <p className="max-w-md text-lg text-muted-foreground leading-relaxed">
              A single-occupancy sanctuary tucked into the mountains. We host only
              one family or group at a time. The cottage, the fireplace, and the
              woods are yours alone.
            </p>
          </div>
          <div className="lg:col-span-5 animate-fade-up [animation-delay:200ms]">
            <img
              src={cottageExterior}
              alt="Chalet Rivera at dusk between three mountain brooks"
              width={800}
              height={1000}
              className="w-full aspect-[4/5] object-cover rounded-sm ring-1 ring-border"
            />
          </div>
        </div>
      </section>

      {/* Concept */}
      <section id="brooks" className="py-32 bg-deep text-deep-foreground">
        <div className="max-w-4xl mx-auto px-6 flex flex-col items-center text-center">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] mb-12 opacity-60">
            The Offering
          </span>
          <h2 className="text-3xl md:text-5xl font-display italic leading-snug text-balance">
            “We believe luxury is the absence of others. No lobbies, no shared
            walls — only the sound of three brooks and steam rising from the
            tea stand.”
          </h2>
        </div>
      </section>

      {/* Amenities */}
      <section id="amenities" className="py-32 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 border-y border-border">
          <div className="py-16 md:pr-8">
            <span className="font-mono text-[10px] text-primary mb-4 block">01/ Living</span>
            <h3 className="text-xl font-display mb-6">Rest & Quarters</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex justify-between"><span>Two Bedrooms</span><span className="font-mono">02</span></li>
              <li className="flex justify-between"><span>Private Baths</span><span className="font-mono">02</span></li>
              <li className="flex justify-between"><span>Full Kitchen</span><span className="font-mono">Incl.</span></li>
            </ul>
          </div>
          <div className="py-16 md:px-8 md:border-x border-border">
            <span className="font-mono text-[10px] text-primary mb-4 block">02/ Warmth</span>
            <h3 className="text-xl font-display mb-6">The Hearth</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex justify-between"><span>Outdoor Fireplace</span><span>Stone</span></li>
              <li className="flex justify-between"><span>Electric Blankets</span><span>Wool</span></li>
              <li className="flex justify-between"><span>Tea Stand</span><span>Ceramic</span></li>
            </ul>
          </div>
          <div className="py-16 md:pl-8">
            <span className="font-mono text-[10px] text-primary mb-4 block">03/ Essential</span>
            <h3 className="text-xl font-display mb-6">Connected</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex justify-between"><span>Free Fiber Wi-Fi</span><span>High Speed</span></li>
              <li className="flex justify-between"><span>Three Brooks</span><span>Natural</span></li>
              <li className="flex justify-between"><span>Surrounding Trees</span><span>Pine/Oak</span></li>
            </ul>
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section className="pb-32 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 md:col-span-8">
            <img
              src={hearthImg}
              alt="Steaming tea cups beside the outdoor stone fireplace"
              width={1216}
              height={800}
              loading="lazy"
              className="w-full aspect-video object-cover rounded-sm ring-1 ring-border"
            />
            <p className="mt-4 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">The Hearth</p>
          </div>
          <div className="col-span-12 md:col-span-4 flex flex-col">
            <img
              src={bedroomImg}
              alt="Cozy bedroom with electric blanket facing the pines"
              width={608}
              height={800}
              loading="lazy"
              className="w-full aspect-[3/4] object-cover rounded-sm ring-1 ring-border"
            />
            <p className="mt-4 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Interior</p>
          </div>
        </div>
      </section>

      {/* Reserve */}
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
        <form
          onSubmit={(e) => {
            e.preventDefault();
            alert(`Thank you. We'll confirm availability for ${arrive} → ${depart} shortly.`);
          }}
          className="bg-card ring-1 ring-border rounded-sm p-8 space-y-6"
        >
          <div className="grid md:grid-cols-2 gap-6">
            <label className="flex flex-col gap-2">
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Arrive</span>
              <input
                type="date"
                required
                value={arrive}
                onChange={(e) => setArrive(e.target.value)}
                className="bg-transparent border-b border-border py-2 text-sm focus:outline-none focus:border-primary"
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Depart</span>
              <input
                type="date"
                required
                value={depart}
                onChange={(e) => setDepart(e.target.value)}
                className="bg-transparent border-b border-border py-2 text-sm focus:outline-none focus:border-primary"
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Your Name</span>
              <input required className="bg-transparent border-b border-border py-2 text-sm focus:outline-none focus:border-primary" />
            </label>
            <label className="flex flex-col gap-2">
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Email</span>
              <input type="email" required className="bg-transparent border-b border-border py-2 text-sm focus:outline-none focus:border-primary" />
            </label>
          </div>
          <label className="flex flex-col gap-2">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Party Size</span>
            <input type="number" min={1} max={6} defaultValue={2} className="bg-transparent border-b border-border py-2 text-sm focus:outline-none focus:border-primary" />
          </label>
          <button
            type="submit"
            className="w-full bg-foreground text-background py-4 rounded-full text-[11px] uppercase tracking-widest font-bold hover:bg-primary transition-colors"
          >
            Request the Cottage
          </button>
        </form>
      </section>

      {/* Sticky booking bar */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-4xl z-40 animate-fade-up [animation-delay:800ms]">
        <div className="bg-foreground text-background p-2 rounded-full flex items-center shadow-2xl ring-1 ring-white/10">
          <div className="flex-1 px-6 md:px-8 flex gap-6 md:gap-12 items-center">
            <div className="flex flex-col">
              <span className="text-[9px] uppercase tracking-widest opacity-50">Exclusive Stay</span>
              <span className="text-sm font-medium">Entire Cottage</span>
            </div>
            <div className="hidden sm:block h-6 w-px bg-white/10"></div>
            <div className="hidden sm:flex flex-col">
              <span className="text-[9px] uppercase tracking-widest opacity-50">Availability</span>
              <span className="text-sm font-medium">Select Dates</span>
            </div>
          </div>
          <a
            href="#reserve"
            onClick={scrollTo("reserve")}
            className="bg-primary text-primary-foreground px-6 md:px-10 py-3 md:py-4 rounded-full text-[11px] uppercase tracking-widest font-bold hover:scale-[1.02] active:scale-95 transition-transform"
          >
            Reserve
          </a>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-24 px-6 border-t border-border">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12">
          <div className="max-w-xs">
            <h4 className="font-display italic text-xl mb-4">Chalet Rivera</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              The High Woods, by Three Brooks.<br />
              hello@chaletrivera.com
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
