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
    description: "Install SPOTX, sell licenses, refer businesses or create content."
  },
  {
    icon: Wallet,
    title: "Track your payments",
    description: "Check your earnings, or your license bills if you are a reseller."
  },
  {
    icon: ShieldCheck,
    title: "Get ready to start",
    description: "Submit your documents and bank details for SPOTX to review."
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
    direction: "SPOTX pays you",
    blurb: "Install SPOTX on business screens and earn commission.",
    details: [
      "Install SPOTX on your customers' screens.",
      "Help businesses start using SPOTX.",
      "Earn commission under your agreement with SPOTX.",
      "Track your earnings and payments in this panel."
    ]
  },
  {
    name: "Reseller",
    icon: ShoppingBag,
    direction: "You pay SPOTX",
    blurb: "Buy SPOTX licenses and sell them with your screens.",
    details: [
      "Buy SPOTX software licenses in bulk.",
      "Sell your own screens with SPOTX software at your chosen price.",
      "Assign licenses to your customers in this panel.",
      "Pay SPOTX for all purchased licenses, including unused ones, under your agreement."
    ]
  },
  {
    name: "Affiliate",
    icon: Share2,
    direction: "SPOTX pays you",
    blurb: "Refer businesses to SPOTX and earn for successful deals.",
    details: [
      "Introduce businesses that need SPOTX.",
      "The SPOTX sales team speaks to them and handles the deal.",
      "Earn when your referral becomes a successful deal.",
      "Track referrals and payments in this panel. Payment terms depend on your agreement."
    ]
  },
  {
    name: "Influencer",
    icon: Megaphone,
    direction: "SPOTX pays you",
    blurb: "Promote SPOTX through your content and earn for campaigns.",
    details: [
      "Create content about SPOTX for your audience.",
      "Work with SPOTX on agreed campaigns.",
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
          <Link to="/" aria-label="SPOTX home"><Logo size="md" plain /></Link>
          <Link to="/partner/login" className="text-sm font-semibold text-slate-700 hover:text-brand-black transition">
            Sign in
          </Link>
        </div>
      </header>

      <section className="landing-hero relative isolate overflow-hidden px-6 pt-20 pb-20 text-center">
        <div className="landing-motion" aria-hidden="true"><span /><span /><span /></div>
        <div className="relative max-w-4xl mx-auto">
        <span className="inline-block px-3 py-1 rounded-full bg-brand-red/10 text-brand-red text-xs font-semibold tracking-wide uppercase mb-6">
          SPOTX Partner Program
        </span>

        <h1 className="font-heading text-4xl sm:text-5xl font-extrabold text-brand-black tracking-tight leading-tight">
          Grow with SPOTX.<br />
          Choose how you partner with us.
        </h1>

        <p className="text-slate-500 text-lg mt-6 max-w-2xl mx-auto">
          SPOTX helps businesses show videos, menus and offers on their screens.
          Join as a partner to install SPOTX, sell licenses, refer businesses or promote it.
          Use this panel to track your work and payments.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
          <Link
            to="/partner/register"
            className="inline-flex items-center justify-center gap-2 bg-brand-black text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-charcoal transition"
          >
            Become a Partner
            <ArrowRight size={18} />
          </Link>
          <Link
            to="/partner/login"
            className="inline-flex items-center justify-center gap-2 border border-slate-200 text-slate-700 px-8 py-3.5 rounded-xl font-semibold hover:bg-slate-50 transition"
          >
            Sign In
          </Link>
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

      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center max-w-xl mx-auto mb-12">
          <h2 className="font-heading text-2xl font-bold text-brand-black mb-2">Choose your partner role</h2>
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
              className="text-left bg-white rounded-2xl border border-slate-200 p-5 flex flex-col hover:border-brand-red hover:shadow-md transition cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-brand-red/10 text-brand-red flex items-center justify-center mb-3">
                <type.icon size={18} />
              </div>
              <h3 className="font-heading font-bold text-brand-black text-sm mb-1">{type.name}</h3>
              <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-2">{type.direction}</span>
              <p className="text-xs text-slate-500 leading-relaxed">{type.blurb}</p>
              <span className="text-xs font-semibold text-brand-red mt-3">See how it works →</span>
            </button>
          ))}
        </div>

        <p className="text-center text-xs text-slate-400 mt-8">
          Choose a role above to get started.
        </p>
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
        <p className="text-xs text-slate-400">© {new Date().getFullYear()} SPOTX. Partner Program.</p>
      </footer>
    </div>
  );
}
