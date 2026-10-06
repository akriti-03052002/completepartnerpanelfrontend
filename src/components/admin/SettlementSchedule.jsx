import { useEffect, useState } from "react";
import adminApi from "../../services/adminApi";
import Card from "../ui/Card";
import Button from "../ui/Button";
import { Input, Select } from "../ui/Input";

const TYPES = [
  { value: "monthly", label: "Monthly — on a fixed day" },
  { value: "quarterly", label: "Quarterly — on a fixed day" },
  { value: "threshold", label: "When earnings reach an amount" },
  { value: "manual", label: "Manual — paid by admin on demand" }
];

const EMPTY = { settlementType: "monthly", settlementDay: "1", minimumSettlementAmount: "", tdsEnabled: false, tdsRate: "" };

/** How and when this partner's approved earnings are paid out (commission-earning types only). */
export default function SettlementSchedule({ partnerId }) {
  const [form, setForm] = useState(EMPTY);
  const [exists, setExists] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    adminApi.get("/admin/config/settlement-settings", { params: { partnerId } })
      .then((res) => {
        const setting = res.data.data[0];
        if (!setting) return;
        setExists(true);
        setForm({
          settlementType: setting.settlementType,
          settlementDay: String(setting.settlementDay || 1),
          minimumSettlementAmount: setting.minimumSettlementAmount ? String(setting.minimumSettlementAmount) : "",
          tdsEnabled: Boolean(setting.tax?.tdsEnabled),
          tdsRate: setting.tax?.tdsRate ? String(setting.tax.tdsRate) : ""
        });
      })
      .catch(() => setError("Couldn't load the payout schedule."))
      .finally(() => setLoading(false));
  }, [partnerId]);

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));
  const hasDay = ["monthly", "quarterly"].includes(form.settlementType);

  const save = async () => {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const res = await adminApi.put("/admin/config/settlement-settings", {
        partnerId,
        settlementType: form.settlementType,
        settlementDay: hasDay ? Number(form.settlementDay) : undefined,
        minimumSettlementAmount: form.settlementType === "threshold" ? Number(form.minimumSettlementAmount) : 0,
        tax: { tdsEnabled: form.tdsEnabled, tdsRate: form.tdsEnabled ? Number(form.tdsRate) : 0 }
      });
      setExists(true);
      setMessage(res.data.message);
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't save the payout schedule.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="font-semibold text-slate-900">Payout schedule</h2>
          <p className="text-xs text-slate-500 mt-0.5">When this partner&apos;s approved earnings are settled to their bank account.</p>
        </div>
        {!loading && !exists && (
          <span className="shrink-0 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">Not set</span>
        )}
      </div>

      {error && <p role="alert" className="mb-3 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</p>}
      {message && <p role="status" className="mb-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">{message}</p>}

      {loading ? (
        <p className="text-sm text-slate-400">Loading...</p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          <Select label="Payout frequency" value={form.settlementType} onChange={(e) => set("settlementType", e.target.value)}>
            {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </Select>

          {hasDay && (
            <Select label="Day of the month" value={form.settlementDay} onChange={(e) => set("settlementDay", e.target.value)}>
              {Array.from({ length: 31 }, (_, i) => String(i + 1)).map((d) => <option key={d} value={d}>{d}</option>)}
            </Select>
          )}
          {form.settlementType === "threshold" && (
            <Input label="Pay out once earnings reach (₹)" type="number" min="1" value={form.minimumSettlementAmount} onChange={(e) => set("minimumSettlementAmount", e.target.value)} placeholder="e.g. 5000" />
          )}

          <label className="flex items-center gap-2 text-sm text-slate-700 sm:col-span-2">
            <input type="checkbox" checked={form.tdsEnabled} onChange={(e) => set("tdsEnabled", e.target.checked)} />
            Deduct TDS from payouts
          </label>
          {form.tdsEnabled && (
            <Input label="TDS rate (%)" type="number" min="0.1" max="30" step="0.1" value={form.tdsRate} onChange={(e) => set("tdsRate", e.target.value)} placeholder="e.g. 10" />
          )}

          <div className="sm:col-span-2 flex justify-end">
            <Button type="button" onClick={save} loading={saving}>{exists ? "Save changes" : "Set payout schedule"}</Button>
          </div>
        </div>
      )}
    </Card>
  );
}
