import { Link } from "react-router-dom";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import Card from "../ui/Card";
import { PARTNER_TYPE_COLORS } from "../../utils/partnerTypeColors";

const money = value => `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

export function PartnerMix({ partners }) {
  const rows = Object.entries(partners.byType).map(([type, value]) => ({ type, name: type[0].toUpperCase() + type.slice(1), value }));
  return <Card className="p-5 sm:p-6">
    <h3 className="font-semibold text-slate-900">Partner mix</h3>
    <div className="grid sm:grid-cols-2 items-center gap-4">
      <div className="relative h-64" role="img" aria-label={`Partner mix: ${rows.map(r => `${r.name} ${r.value}`).join(", ")}`}>
        {partners.total > 0 ? <ResponsiveContainer width="100%" height="100%"><PieChart>
          <Pie data={rows} dataKey="value" nameKey="name" innerRadius="68%" outerRadius="90%" paddingAngle={3} stroke="none">
            {rows.map(r => <Cell key={r.type} fill={PARTNER_TYPE_COLORS[r.type]} />)}
          </Pie><Tooltip /></PieChart></ResponsiveContainer> : <div className="absolute inset-8 rounded-full border-[18px] border-slate-100" />}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><span className="text-4xl font-bold text-slate-900">{partners.total}</span><span className="text-xs text-slate-500">Partners</span></div>
      </div>
      <div className="space-y-2">{rows.map(r => <Link key={r.type} to={`/admin/partners?partnerType=${r.type}`} className="flex items-center gap-3 rounded-xl p-3 hover:bg-slate-50 focus-visible:outline-2">
        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: PARTNER_TYPE_COLORS[r.type] }} /><span className="flex-1 text-sm text-slate-600">{r.name}</span><span className="font-bold tabular-nums">{r.value}</span>
      </Link>)}</div>
    </div>
  </Card>;
}

export function PaymentProgress({ payouts }) {
  const rows = ["vendor", "affiliate", "influencer"].map(type => ({ name: type[0].toUpperCase() + type.slice(1), Paid: Number(payouts[type].paid) || 0, Pending: Number(payouts[type].pending) || 0 }));
  return <Card className="p-5 sm:p-6">
    <div className="flex items-center justify-between gap-3 mb-4"><h3 className="font-semibold text-slate-900">Partner payments</h3><Link to="/admin/settlements" className="text-xs font-semibold text-brand-red">Open payments →</Link></div>
    <div className="h-64" role="img" aria-label={rows.map(r => `${r.name}: ${money(r.Paid)} paid, ${money(r.Pending)} pending`).join(". ")}>
      <ResponsiveContainer width="100%" height="100%"><BarChart data={rows} layout="vertical" margin={{ left: 0, right: 16 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
        <XAxis type="number" tickFormatter={value => value >= 100000 ? `₹${(value / 100000).toFixed(1)}L` : value >= 1000 ? `₹${(value / 1000).toFixed(0)}k` : `₹${value}`} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
        <Tooltip formatter={money} cursor={{ fill: "#f8fafc" }} /><Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="Paid" stackId="payments" fill="#10b981" barSize={26} />
        <Bar dataKey="Pending" stackId="payments" fill="#f59e0b" radius={[0, 6, 6, 0]} barSize={26} />
      </BarChart></ResponsiveContainer>
    </div>
  </Card>;
}
