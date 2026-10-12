import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight, Check, LayoutDashboard, Monitor, ShoppingBag, Share2, Megaphone, ShieldCheck, Wallet } from "lucide-react";
import Logo from "../components/ui/Logo";

const ROLES = [
  {
    id: "vendor", name: "Vendor", icon: Monitor, action: "Install SpotX",
    summary: "Install SpotX on business screens and earn commission.",
    description: "Help businesses start using SpotX on their screens. Use your panel to follow your earnings and payments.",
    details: ["Install SpotX on your customers' screens.", "Help businesses get started with SpotX.", "Earn commission under your agreement.", "Track your earnings and payments."],
    earning: "Earn commission", payment: "Earn commission from your customers' SpotX subscriptions, under your agreement. Follow your earnings and payments in the panel.", tools: ["Customers", "Earnings", "Payments"]
  },
  {
    id: "reseller", name: "Reseller", icon: ShoppingBag, action: "Sell licenses",
    summary: "Buy SpotX licenses and sell them with your screens.",
    description: "Sell your own screens with SpotX software at your chosen price. Use your panel to assign licenses and follow your bills.",
    details: ["Buy SpotX software licenses in bulk.", "Sell your screens with SpotX software.", "Assign licenses to your customers.", "Pay for all purchased licenses, including unused ones, under your agreement."],
    earning: "Earn from your sales", payment: "Set your own price for screens bundled with SpotX licenses. Your profit is what your customers pay, minus your license, screen and other business costs.", tools: ["Customers", "Screen licenses", "Bills"]
  },
  {
    id: "affiliate", name: "Affiliate", icon: Share2, action: "Refer businesses",
    summary: "Introduce businesses to SpotX and earn for successful deals.",
    description: "Connect SpotX with businesses that need it. The SpotX sales team handles the deal; your panel helps you follow each referral.",
    details: ["Refer businesses that need SpotX.", "The SpotX team handles the sale.", "Earn when your referral becomes a successful deal.", "Track your referrals and payments."],
    earning: "Earn for successful referrals", payment: "Receive a payment when your referral becomes a successful deal, under your agreement. Track each referral and its payment in the panel.", tools: ["Referrals", "Deals", "Payments"]
  },
  {
    id: "influencer", name: "Influencer", icon: Megaphone, action: "Promote SpotX",
    summary: "Create content about SpotX and earn for agreed campaigns.",
    description: "Share SpotX with your audience. Use your panel to follow your content, campaign work and payments.",
    details: ["Create content for your audience.", "Work on agreed SpotX campaigns.", "Earn campaign payments under your agreement.", "Track your content and payments."],
    earning: "Earn for campaigns", payment: "Get paid for agreed SpotX campaigns and content. Your payment follows your campaign agreement, and you can track it in the panel.", tools: ["Social accounts", "Content", "Payments"]
  }
];

const STEPS = [
  { number: "01", title: "Choose your role", description: "Pick how you want to work with SpotX." },
  { number: "02", title: "Register and submit details", description: "Create your account and add your documents." },
  { number: "03", title: "Complete approval", description: "Once approved, start your partner work in the panel." }
];

export default function Landing() {
  const [selectedRole, setSelectedRole] = useState("vendor");
  const role = ROLES.find(item => item.id === selectedRole);
  const registerUrl = `/partner/register?partnerType=${role.id}`;

  return (
    <div className="partner-landing min-h-screen bg-[#faf9f6] text-slate-900">
      <header className="border-b border-black/5 bg-white/80">
        <div className="flex min-h-20 items-center justify-between gap-4 px-5 sm:px-8 lg:px-10">
          <Link to="/" aria-label="SpotX Partner Panel home" className="flex items-center gap-3 sm:gap-4">
            <Logo plain size="md" />
            <span className="border-l border-slate-200 pl-3 sm:pl-4 text-xs sm:text-sm font-semibold">Partner Panel</span>
          </Link>
          <nav aria-label="Main navigation" className="flex items-center gap-6">
            <a href="#partner-roles" className="hidden sm:block text-sm text-slate-600 hover:text-brand-red">Partner roles</a>
            <Link to="/partner/login" className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 sm:px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-red transition-colors">Sign in <ArrowUpRight size={15} /></Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="partner-intro relative isolate overflow-hidden px-5 sm:px-8">
          <div className="partner-intro-motion" aria-hidden="true"><span /><span /><span /><i className="partner-motion-ring" /><i className="partner-motion-ring partner-motion-ring-secondary" /><div className="partner-motion-grid" /></div>
          <div className="relative mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-16 py-14 sm:py-20">
            <div>
              <p className="mb-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[.16em] text-brand-red"><span className="h-1.5 w-1.5 rounded-full bg-brand-red" />For SpotX partners</p>
              <h1 className="font-heading text-[2.5rem] sm:text-5xl xl:text-6xl font-bold leading-[1.08] tracking-tight">Partner with SpotX.<br /><span className="text-brand-red">Turn your work into earnings.</span></h1>
              <p className="mt-6 max-w-md text-base sm:text-lg leading-relaxed text-slate-600">Join SpotX as a partner and earn through your work. Manage your partnership and track payments in the SpotX Partner Panel.</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/partner/register" className="inline-flex items-center gap-3 rounded-full bg-brand-red px-6 py-3.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors">Sign up <ArrowRight size={17} /></Link>
                <Link to="/partner/login" className="inline-flex items-center rounded-full border border-slate-300 bg-white px-6 py-3.5 text-sm font-semibold hover:border-slate-900 transition-colors">Sign in</Link>
              </div>
              <p className="mt-5 text-xs text-slate-500">Vendors, resellers, affiliates and influencers.</p>
            </div>

            <div className="rounded-3xl border border-white bg-white p-5 sm:p-7 shadow-[0_20px_70px_-30px_rgba(65,32,23,0.22)]">
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-5"><div><p className="text-xs text-slate-500">SpotX Partner Panel</p><h2 className="mt-1 text-xl font-semibold">Built around your role</h2></div><LayoutDashboard size={25} className="text-brand-red shrink-0" /></div>
              <div className="mt-5 space-y-2.5">
                {ROLES.map(item => <a key={item.id} href="#partner-roles" onClick={() => setSelectedRole(item.id)} className="group flex items-center gap-4 rounded-2xl border border-slate-100 bg-[#faf9f6] p-4 hover:border-brand-red/40 hover:bg-red-50 transition-colors">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-brand-red"><item.icon size={20} /></span>
                  <span className="flex-1"><span className="block text-sm font-semibold">{item.name}</span><span className="block text-xs text-slate-500 mt-0.5">{item.action}</span><span className="block text-xs font-medium text-brand-red mt-1">{item.earning}</span></span>
                  <ArrowUpRight size={17} className="text-slate-400 group-hover:text-brand-red" />
                </a>)}
              </div>
              <p className="mt-5 text-xs text-slate-500">Select a role to see what you can do.</p>
            </div>
          </div>
        </section>

        <section id="partner-roles" aria-labelledby="roles-heading" className="scroll-mt-6 border-y border-slate-200/70 bg-white px-5 sm:px-8 py-14 sm:py-16">
          <div className="mx-auto max-w-6xl">
            <div className="mb-7 flex flex-col sm:flex-row sm:items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-widest text-brand-red">Find your fit</p><h2 id="roles-heading" className="mt-2 text-3xl font-bold tracking-tight">How will you partner with SpotX?</h2></div><p className="max-w-xs text-sm text-slate-500">Choose a role to see your work and what the panel helps you track.</p></div>
            <div role="group" aria-label="Choose your partner role" className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {ROLES.map(item => <button key={item.id} type="button" aria-pressed={role.id === item.id} aria-controls="partner-role-detail" onClick={() => setSelectedRole(item.id)} className={`flex items-center justify-between gap-3 rounded-2xl border px-4 sm:px-5 py-4 text-left transition-colors ${role.id === item.id ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-slate-400"}`}>
                <span className="flex items-center gap-2 sm:gap-3 text-sm font-semibold"><item.icon size={18} />{item.name}</span>{role.id === item.id && <Check size={16} className="text-brand-yellow shrink-0" />}
              </button>)}
            </div>
            <div id="partner-role-detail" className="mt-5 grid lg:grid-cols-[1.1fr_1fr] overflow-hidden rounded-3xl border border-slate-200">
              <div className="bg-[#faf9f6] p-6 sm:p-9">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600"><role.icon size={14} />{role.name}</div>
                <h3 className="text-2xl sm:text-3xl font-bold tracking-tight">{role.action}</h3>
                <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-600">{role.description}</p>
                <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4"><p className="flex items-center gap-2 text-sm font-semibold text-emerald-900"><Wallet size={16} />How you earn</p><p className="mt-2 text-sm leading-relaxed text-emerald-900/80">{role.payment}</p></div>
                <Link to={registerUrl} className="mt-7 inline-flex items-center gap-3 rounded-full bg-brand-red px-5 py-3 text-sm font-semibold text-white hover:bg-red-700 transition-colors">Register as {role.name} <ArrowRight size={16} /></Link>
              </div>
              <div className="bg-white p-6 sm:p-9">
                <h4 className="text-sm font-semibold">What you’ll do</h4>
                <ul className="mt-5 space-y-4">{role.details.map(detail => <li key={detail} className="flex items-start gap-3 text-sm text-slate-600"><Check size={16} className="mt-0.5 shrink-0 text-brand-red" />{detail}</li>)}</ul>
                <div className="mt-7 border-t border-slate-100 pt-5"><p className="text-xs text-slate-500 mb-3">In your panel</p><div className="flex flex-wrap gap-2">{role.tools.map(tool => <span key={tool} className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">{tool}</span>)}</div></div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-5 sm:px-8 py-14 sm:py-16" aria-labelledby="start-heading">
          <div className="mx-auto max-w-6xl"><div className="mb-8"><p className="text-xs font-semibold uppercase tracking-widest text-brand-red">Getting started</p><h2 id="start-heading" className="mt-2 text-3xl font-bold tracking-tight">From registration to your dashboard.</h2></div>
            <div className="grid sm:grid-cols-3 gap-7">{STEPS.map(step => <div key={step.number} className="border-t border-slate-300 pt-5"><span className="text-xs font-semibold text-brand-red">{step.number}</span><h3 className="mt-3 text-base font-semibold">{step.title}</h3><p className="mt-2 text-sm leading-relaxed text-slate-500">{step.description}</p></div>)}</div>
            <div className="mt-10 flex flex-col sm:flex-row gap-5 sm:gap-8 rounded-2xl border border-slate-200 bg-white px-6 py-5">
              <p className="flex items-center gap-2.5 text-sm text-slate-600"><ShieldCheck size={18} className="text-brand-red" />Submit documents for review</p><p className="flex items-center gap-2.5 text-sm text-slate-600"><LayoutDashboard size={18} className="text-brand-red" />Follow your partner activity</p><p className="flex items-center gap-2.5 text-sm text-slate-600"><Wallet size={18} className="text-brand-red" />Track earnings or bills</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white px-5 sm:px-8 py-7">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"><div><p className="text-sm font-semibold">SpotX Partner Panel</p><p className="text-xs text-slate-500 mt-1">© {new Date().getFullYear()} SpotX</p></div><a href="https://spotx.in" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-brand-red">Visit spotx.in <ArrowUpRight size={16} /></a></div>
      </footer>
    </div>
  );
}
