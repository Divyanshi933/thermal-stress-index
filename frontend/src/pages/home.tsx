import { Link } from "react-router-dom";
import { ArrowRight, ChevronRight, Radio, ShieldAlert, Thermometer, Users, Waves, Wind } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const methods = [
  { code: "HTSI", title: "Human Thermal Stress", copy: "A 0–100 composite signal blending heat, humidity, exposure and vulnerability.", icon: ShieldAlert },
  { code: "WBGT", title: "Workplace heat load", copy: "Outdoor radiant heat and humidity translated into action-ready work-rest guidance.", icon: Thermometer },
  { code: "UTCI", title: "Physiological strain", copy: "Wind, moisture and air temperature combined into a human comfort stress estimate.", icon: Wind },
  { code: "NOAA HI", title: "Perceived heat", copy: "A familiar apparent-temperature reference for public-facing communication.", icon: Waves },
];

export default function Home() {
  return (
    <main className="min-h-svh overflow-hidden bg-[#0a0d12] text-slate-100" data-testid="landing-page">
      <div className="pointer-events-none fixed inset-0 opacity-30" style={{ background: "radial-gradient(circle at 78% 15%, rgba(0,240,255,.16), transparent 32%), radial-gradient(circle at 20% 60%, rgba(255,0,85,.08), transparent 28%)" }} />
      <header className="relative z-10 mx-auto flex max-w-[1440px] items-center justify-between px-5 py-5 sm:px-8 lg:px-12" data-testid="landing-header">
        <Link to="/" className="flex items-center gap-3" data-testid="nav-brand-logo">
          <span className="flex size-9 items-center justify-center border border-cyan-300/50 bg-cyan-300/10 text-cyan-300"><Radio size={17} /></span>
          <span><span className="block font-mono text-[10px] uppercase tracking-[0.3em] text-cyan-300">AGNIDRISHTI</span><span className="font-heading text-sm font-bold uppercase tracking-wider">Thermal Risk Index</span></span>
        </Link>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="hidden border-emerald-400/30 bg-emerald-400/10 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-emerald-300 sm:inline-flex" data-testid="landing-live-status">● live telemetry</Badge>
          <Link to="/dashboard" className={buttonVariants({ variant: "outline", size: "sm" })} data-testid="nav-dashboard-button">Command deck <ArrowRight size={14} /></Link>
        </div>
      </header>

      <section className="relative mx-auto grid max-w-[1440px] grid-cols-1 items-center gap-12 px-5 pb-20 pt-16 sm:px-8 lg:grid-cols-12 lg:px-12 lg:pb-28 lg:pt-24" data-testid="landing-hero-section">
        <div className="relative z-10 lg:col-span-7">
          <p className="mb-5 font-mono text-xs uppercase tracking-[0.28em] text-cyan-300" data-testid="landing-eyebrow">Impact-based early warning / 01</p>
          <h1 className="max-w-4xl font-heading text-5xl font-black uppercase leading-[.9] tracking-tight text-white sm:text-7xl lg:text-8xl" data-testid="landing-hero-title">Heat is not a number.<br /><span className="text-cyan-300">It is a signal.</span></h1>
          <p className="mt-7 max-w-xl text-base leading-relaxed text-slate-400 sm:text-lg" data-testid="landing-hero-description">A live thermal intelligence layer for cities, responders and people working in the heat. Sense the weather. Compute human stress. Localize the risk. Dispatch action.</p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Link to="/dashboard" className={buttonVariants({ size: "lg" })} data-testid="landing-open-command-deck-button">Open command deck <ArrowRight size={17} /></Link>
            <a href="#method" className="group flex items-center gap-2 font-mono text-xs uppercase tracking-[0.18em] text-slate-400 transition-colors duration-200 hover:text-cyan-300" data-testid="landing-methodology-link">How it works <ChevronRight size={15} className="transition-transform duration-200 group-hover:translate-x-1" /></a>
          </div>
        </div>
        <div className="relative min-h-[340px] overflow-hidden border border-slate-700/70 bg-slate-900/70 lg:col-span-5 lg:min-h-[520px]" data-testid="landing-telemetry-visual">
          <div className="absolute inset-0 bg-cover bg-center opacity-45 mix-blend-screen" style={{ backgroundImage: "url(https://images.unsplash.com/photo-1635994432822-9c4ba0ec21c7?crop=entropy&cs=srgb&fm=jpg&q=70)" }} />
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(10,13,18,.1),#0a0d12_82%)]" />
          <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
            <div className="mb-8 flex items-center justify-between border-b border-slate-700/70 pb-4"><span className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-400">Live observation</span><span className="size-2 animate-pulse bg-cyan-300" /></div>
            <div className="font-mono text-7xl font-bold tracking-[-0.08em] text-white sm:text-8xl" data-testid="landing-telemetry-value">40.2<span className="ml-2 text-3xl text-cyan-300">°C</span></div>
            <div className="mt-3 flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-orange-300" data-testid="landing-telemetry-risk"><span className="size-2 bg-orange-400" /> elevated human stress / jaipur</div>
            <div className="mt-8 grid grid-cols-3 gap-3 border-t border-slate-700/70 pt-4 text-xs"><div data-testid="landing-telemetry-humidity"><span className="block font-mono text-slate-500">RH</span><span className="font-mono text-slate-200">44%</span></div><div data-testid="landing-telemetry-wind"><span className="block font-mono text-slate-500">WIND</span><span className="font-mono text-slate-200">12 km/h</span></div><div data-testid="landing-telemetry-index"><span className="block font-mono text-slate-500">HTSI</span><span className="font-mono text-slate-200">61.4</span></div></div>
          </div>
        </div>
      </section>

      <section className="relative border-y border-slate-800/80 bg-[#0d121b]" data-testid="landing-comparison-section">
        <div className="mx-auto max-w-[1440px] px-5 py-16 sm:px-8 lg:px-12 lg:py-24">
          <div className="mb-10 flex flex-col justify-between gap-5 lg:flex-row lg:items-end"><div><p className="font-mono text-xs uppercase tracking-[0.25em] text-cyan-300">The thesis / 02</p><h2 className="mt-3 max-w-3xl font-heading text-3xl font-bold uppercase sm:text-5xl" data-testid="landing-comparison-title">Same temperature.<br /><span className="text-slate-500">Different threat.</span></h2></div><p className="max-w-sm text-sm leading-relaxed text-slate-400" data-testid="landing-comparison-description">Dry-bulb temperature is only the beginning. Humidity, wind, solar load and context decide what the heat does to a body.</p></div>
          <div className="grid gap-px border border-slate-800 bg-slate-800 md:grid-cols-2"><div className="bg-[#121824] p-7 sm:p-10" data-testid="landing-jaipur-comparison"><div className="mb-10 flex justify-between"><span className="font-mono text-xs uppercase tracking-widest text-slate-400">JAIPUR / DRY HEAT</span><span className="font-mono text-xs text-orange-300">40°C</span></div><div className="font-heading text-6xl font-black text-orange-300 sm:text-8xl">61.4</div><p className="mt-2 font-mono text-xs uppercase tracking-widest text-slate-500">HTSI / elevated</p><div className="mt-10 h-1 bg-slate-800"><div className="h-full w-[61%] bg-orange-400" /></div></div><div className="bg-[#121824] p-7 sm:p-10" data-testid="landing-kolkata-comparison"><div className="mb-10 flex justify-between"><span className="font-mono text-xs uppercase tracking-widest text-slate-400">KOLKATA / HUMID HEAT</span><span className="font-mono text-xs text-rose-300">40°C</span></div><div className="font-heading text-6xl font-black text-rose-400 sm:text-8xl">84.7</div><p className="mt-2 font-mono text-xs uppercase tracking-widest text-slate-500">HTSI / severe</p><div className="mt-10 h-1 bg-slate-800"><div className="h-full w-[85%] bg-rose-500" /></div></div></div>
        </div>
      </section>

      <section id="method" className="relative mx-auto max-w-[1440px] px-5 py-16 sm:px-8 lg:px-12 lg:py-24" data-testid="landing-methodology-section">
        <div className="mb-10"><p className="font-mono text-xs uppercase tracking-[0.25em] text-cyan-300">The intelligence layer / 03</p><h2 className="mt-3 font-heading text-3xl font-bold uppercase sm:text-5xl" data-testid="landing-methodology-title">Four signals. One clear decision.</h2></div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{methods.map(({ code, title, copy, icon: Icon }) => <article className="group border border-slate-800 bg-[#121824] p-6 transition-[transform,border-color] duration-300 hover:-translate-y-1 hover:border-cyan-300/40" key={code} data-testid={`method-card-${code.toLowerCase().replace(" ", "-")}`}><div className="mb-14 flex items-center justify-between"><Icon size={21} className="text-cyan-300" /><span className="font-mono text-[10px] tracking-widest text-slate-500">{code}</span></div><h3 className="font-heading text-xl font-bold uppercase" data-testid={`method-title-${code.toLowerCase().replace(" ", "-")}`}>{title}</h3><p className="mt-3 text-sm leading-relaxed text-slate-400">{copy}</p></article>)}</div>
      </section>

      <footer className="relative border-t border-slate-800/80 px-5 py-8 sm:px-8 lg:px-12" data-testid="landing-footer"><div className="mx-auto flex max-w-[1440px] flex-col gap-4 font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500 sm:flex-row sm:items-center sm:justify-between"><span>AGNIDRISHTI / thermal risk index</span><span className="flex items-center gap-2 text-emerald-300"><span className="size-1.5 bg-emerald-400" /> Open-Meteo data link operational</span></div></footer>
    </main>
  );
}