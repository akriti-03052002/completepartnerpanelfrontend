import { useState } from "react";
import { Link } from "react-router-dom";
import {
  LayoutDashboard, Wallet, ShieldCheck, ArrowRight,
  Monitor, MapPin, Activity, Radio, Check, ShoppingBag, Share2, Megaphone, Users2, X
} from "lucide-react";
import Logo from "../components/ui/Logo";

const FEATURES = [
  {
    icon: LayoutDashboard,
    title: "Your work in one place",
    description: "See your partner activity and progress in one dashboard."
  },
  {
    icon: Users2,
    title: "Choose your role",
    description: "Install SpotX, sell licenses, refer businesses or create content."
  },
  {
    icon: Wallet,
    title: "Track your payments",
    description: "Check your earnings, or your license bills if you are a reseller."
  },
  {
    icon: ShieldCheck,
    title: "Get ready to start",
    description: "Submit your documents and bank details for SpotX to review."
  }
];

const STATS = [
  { icon: Monitor, value: "1,521+", label: "Screens managed" },
  { icon: MapPin, value: "70+", label: "Business locations" },
  { icon: Activity, value: "99.9%", label: "Platform uptime" },
  { icon: Radio, value: "24/7", label: "Network monitoring" }
];

const PARTNER_TYPES = [
  {
    name: "Vendor",
    icon: Monitor,
    direction: "SpotX pays you",
    blurb: "Install SpotX on business screens and earn commission.",
    details: [
      "Install SpotX on your customers' screens.",
      "Help businesses start using SpotX.",
      "Earn commission under your agreement with SpotX.",
      "Track your earnings and payments in this panel."
    ]
  },
  {
    name: "Reseller",
    icon: ShoppingBag,
    direction: "You pay SpotX",
    blurb: "Buy SpotX licenses and sell them with your screens.",
    details: [
      "Buy SpotX software licenses in bulk.",
      "Sell your own screens with SpotX software at your chosen price.",
      "Assign licenses to your customers in this panel.",
      "Pay SpotX for all purchased licenses, including unused ones, under your agreement."
    ]
  },
  {
    name: "Affiliate",
    icon: Share2,
    direction: "SpotX pays you",
    blurb: "Refer businesses to SpotX and earn for successful deals.",
    details: [
      "Introduce businesses that need SpotX.",
      "The SpotX sales team speaks to them and handles the deal.",
      "Earn when your referral becomes a successful deal.",
      "Track referrals and payments in this panel. Payment terms depend on your agreement."
    ]
  },
  {
    name: "Influencer",
    icon: Megaphone,
    direction: "SpotX pays you",
    blurb: "Promote SpotX through your content and earn for campaigns.",
    details: [
      "Create content about SpotX for your audience.",
      "Work with SpotX on agreed campaigns.",
      "Earn campaign payments under your agreement.",
      "Track your content and payments in this panel."
    ]
  },
];

export default function Landing() {
  const [activeType, setActiveType] = useState(null);

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-100">
        <div className="w-full px-5 sm:px-8 h-20 flex items-center justify-between">
          <Link to="/" aria-label="SpotX home"><Logo size="md" plain /></Link>
          <Link to="/partner/login" className="text-sm font-semibold text-slate-700 hover:text-brand-black transition">
            Sign in
          </Link>
        </div>
      </header>

      <section className="landing-hero relative isolate overflow-hidden px-6 py-14 sm:py-20">
        <div className="landing-motion" aria-hidden="true"><span /><span /><span /></div>
        <div className="landing-grid" aria-hidden="true" />
        <div className="relative max-w-6xl mx-auto grid lg:grid-cols-2 items-center gap-14 lg:gap-16">
        <div>
        <span className="inline-block px-3 py-1 rounded-full bg-brand-red/10 text-brand-red text-xs font-semibold tracking-wide uppercase mb-6">
          SpotX Partner Program
        </span>

        <h1 className="font-heading text-4xl sm:text-5xl font-extrabold text-brand-black tracking-tight leading-tight">
          Your next opportunity.<br />
          <span className="text-brand-red">With SpotX.</span>
        </h1>

        <p className="text-slate-600 text-base sm:text-lg leading-relaxed mt-6 max-w-lg">
          SpotX helps businesses show videos, menus and offers on their screens.
          Join as a partner to install SpotX, sell licenses, refer businesses or promote it.
          Use this panel to track your work and payments.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 mt-8">
          <Link
            to="#partner-roles"
            className="inline-flex items-center justify-center gap-2 bg-brand-black text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-charcoal transition"
          >
            Choose your role
            <ArrowRight size={18} />
          </Link>
          <Link
            to="/partner/login"
            className="inline-flex items-center justify-center gap-2 border border-slate-200 text-slate-700 px-8 py-3.5 rounded-xl font-semibold hover:bg-slate-50 transition"
          >
            Sign In
          </Link>
        </div>
        <p className="text-xs text-slate-500 mt-5">Install · Sell · Refer · Promote</p>
        </div>
        <div className="landing-scene relative mx-auto w-full max-w-lg" aria-label="Ways to partner with SpotX">
          <div className="landing-orbit" aria-hidden="true" />
          <div className="landing-screen relative rounded-3xl bg-white border border-slate-200 p-4 shadow-2xl shadow-slate-900/10">
            <div className="flex items-center justify-between px-2 pb-4"><Logo plain size="sm" /><span className="text-xs text-slate-400">Partner program</span></div>
            <div className="rounded-2xl bg-slate-950 p-6 sm:p-8 overflow-hidden relative min-h-64">
              <div className="landing-screen-glow" aria-hidden="true" />
              <div className="relative text-white">
                <span className="text-[10px] uppercase tracking-[.2em] text-brand-yellow">Partner with SpotX</span>
                <p className="font-heading font-bold text-3xl sm:text-4xl mt-4 leading-tight">Your role.<br />Your opportunity.</p>
                <div className="grid grid-cols-2 gap-2 mt-6">
                  {PARTNER_TYPES.map((type, index) => <div key={type.name} className={`landing-content-tag landing-tag-${index % 3} px-3 py-3 rounded-lg border border-white/15 bg-white/10`}>
                    <div className="flex items-center gap-2 text-xs font-semibold"><type.icon size={14} className="text-brand-yellow" />{type.name}</div>
                    <p className="text-[11px] text-slate-300 mt-1">{["Install SpotX", "Sell licenses", "Refer businesses", "Promote SpotX"][index]}</p>
                  </div>)}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-4 px-2"><LayoutDashboard size={14} className="text-slate-400" /><span className="text-xs text-slate-500">Track your work and payments</span><div className="ml-auto flex gap-1.5" aria-hidden="true"><i className="w-1.5 h-1.5 rounded-full bg-brand-red" /><i className="w-1.5 h-1.5 rounded-full bg-slate-200" /><i className="w-1.5 h-1.5 rounded-full bg-slate-200" /></div></div>
          </div>
          <div className="landing-float-card absolute -top-5 -right-2 sm:-right-6 flex items-center gap-2 bg-white border border-slate-100 rounded-xl px-4 py-3 shadow-lg shadow-slate-900/5 text-sm font-medium"><Users2 size={17} className="text-brand-red" />Choose your role</div>
          <div className="landing-float-card landing-float-delayed absolute -bottom-5 -left-2 sm:-left-6 flex items-center gap-2 bg-white border border-slate-100 rounded-xl px-4 py-3 shadow-lg shadow-slate-900/5 text-sm font-medium"><LayoutDashboard size={17} className="text-brand-red" />Your partner dashboard</div>
        </div>
        </div>
      </section>

      <section className="border-y border-slate-100 bg-brand-black">
        <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-2 sm:grid-cols-4 gap-8">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <s.icon size={20} className="mx-auto mb-2 text-brand-yellow" />
              <div className="font-heading text-2xl font-extrabold text-white">{s.value}</div>
              <div className="text-xs text-slate-400 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section id="partner-roles" className="max-w-6xl mx-auto px-6 py-16 sm:py-20 scroll-mt-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div><p className="text-xs uppercase tracking-widest text-brand-red font-semibold mb-3">Four ways to work with us</p>
          <h2 className="font-heading text-2xl font-bold text-brand-black mb-2">Choose your partner role</h2>
          </div>
          <p className="text-sm text-slate-500">
            Pick the work you want to do. Open a role to learn more.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PARTNER_TYPES.map((type) => (
            <button
              key={type.name}
              type="button"
              onClick={() => setActiveType(type)}
              className="group text-left bg-white rounded-2xl border border-slate-200 p-6 flex flex-col hover:-translate-y-1 hover:border-brand-red hover:shadow-lg hover:shadow-brand-red/5 transition duration-300 cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-brand-red/10 text-brand-red flex items-center justify-center mb-3">
                <type.icon size={18} />
              </div>
              <h3 className="font-heading font-bold text-brand-black text-sm mb-1">{type.name}</h3>
              <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-2">{type.direction}</span>
              <p className="text-xs text-slate-500 leading-relaxed">{type.blurb}</p>
              <span className="text-xs font-semibold text-brand-red mt-5 flex items-center gap-2">See how it works <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" /></span>
            </button>
          ))}
        </div>

        <div className="grid sm:grid-cols-3 gap-6 mt-10 pt-8 border-t border-slate-100">
          {[['01', 'Choose your role', 'Pick the work that suits you.'], ['02', 'Create your account', 'Register and submit your details.'], ['03', 'Start with SpotX', 'Complete approval and start your partner work.']].map(([step, title, description]) => <div key={step} className="flex gap-3"><span className="text-brand-red font-heading text-lg font-bold">{step}</span><div><p className="font-semibold text-sm">{title}</p><p className="text-xs text-slate-500 mt-1">{description}</p></div></div>)}
        </div>
      </section>

      {activeType && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setActiveType(null)}>
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[85vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between px-6 py-5 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-red/10 text-brand-red flex items-center justify-center shrink-0">
                  <activeType.icon size={18} />
                </div>
                <div>
                  <p className="font-heading font-bold text-brand-black">{activeType.name}</p>
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{activeType.direction}</span>
                </div>
              </div>
              <button type="button" onClick={() => setActiveType(null)} className="text-slate-400 hover:text-brand-black shrink-0" aria-label="Close">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-auto p-6">
              <ul className="space-y-3">
                {activeType.details.map((line) => (
                  <li key={line} className="flex items-start gap-2.5 text-sm text-slate-600">
                    <Check size={15} className="text-brand-red mt-0.5 shrink-0" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>


            </div>

            <div className="px-6 py-4 border-t border-slate-100 shrink-0">
              <Link
                to={`/partner/register?partnerType=${activeType.name.toLowerCase()}`}
                className="inline-flex items-center justify-center gap-2 w-full bg-brand-black text-white px-6 py-3 rounded-xl font-semibold hover:bg-charcoal transition"
              >
                Register as a {activeType.name}
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      )}

      <section className="bg-light-grey border-y border-slate-100">
        <div className="max-w-6xl mx-auto px-6 py-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-white rounded-2xl border border-slate-200 p-6">
              <div className="w-11 h-11 rounded-xl bg-brand-red/10 text-brand-red flex items-center justify-center mb-4">
                <f.icon size={20} />
              </div>
              <h3 className="font-heading font-bold text-brand-black mb-2">{f.title}</h3>
              <p className="text-sm text-slate-500">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="max-w-6xl mx-auto px-6 py-8 text-center">
        <a href="https://spotx.in" target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-brand-black hover:text-brand-red">Visit our main website: spotx.in <span aria-hidden="true">↗</span></a>
        <p className="text-xs text-slate-400">© {new Date().getFullYear()} SpotX. Partner Program.</p>
      </footer>
    </div>
  );
}
