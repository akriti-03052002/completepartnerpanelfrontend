import { useEffect, useState } from "react";
import adminApi from "../../services/adminApi";
import Card from "../ui/Card";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import { Input, Select } from "../ui/Input";
import OfflinePaymentModal from "../ui/OfflinePaymentModal";
import PaymentHistory from "../ui/PaymentHistory";
import ListToolbar from "../ui/ListToolbar";
import { useListFilter } from "../../hooks/useListFilter";

/* ============================================================
   RESELLER ADMIN SECTION
   Rendered only inside AdminPartnerDetail.jsx when
   partner.partnerType === "reseller". Covers everything a
   superadmin controls for this partner type: pricing mode/rate, billing cycle,
   inventory snapshot, and manual inventory adjustment. A Reseller
   partner can never edit any of this from their own panel.
============================================================ */
export default function ResellerAdminSection({ partnerId }) {
  const [historyInvoice, setHistoryInvoice] = useState(null);
  const [detail, setDetail] = useState(null);
  const invoiceList = useListFilter(detail?.invoices, [{ label: "Status", value: (inv) => inv.paymentStatus }]);
  const [pricing, setPricing] = useState(null);
  const [billing, setBilling] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingPricing, setSavingPricing] = useState(false);
  const [savingBilling, setSavingBilling] = useState(false);
  const [message, setMessage] = useState("");

  const [adjustQty, setAdjustQty] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [adjusting, setAdjusting] = useState(false);

  const [prepayAmount, setPrepayAmount] = useState("");
  const [settingPrepayment, setSettingPrepayment] = useState(false);
  const [confirmingOfflinePrepayment, setConfirmingOfflinePrepayment] = useState(false);
  const [offlinePrepayError, setOfflinePrepayError] = useState("");

  const [switchingInvoiceId, setSwitchingInvoiceId] = useState(null);
  const [verifyingInvoiceId, setVerifyingInvoiceId] = useState(null);
  const [invoiceOfflineError, setInvoiceOfflineError] = useState("");

  const load = () => {
    Promise.all([
      adminApi.get(`/admin/reseller/partners/${partnerId}`).then((res) => setDetail(res.data.data)),
      adminApi.get(`/admin/reseller/partners/${partnerId}/pricing-plan`).then((res) => setPricing(res.data.data)),
      adminApi.get(`/admin/reseller/partners/${partnerId}/billing-config`).then((res) => setBilling(res.data.data))
    ]).finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [partnerId]);

  const savePricing = async () => {
    setSavingPricing(true);
    setMessage("");
    try {
      const res = await adminApi.put(`/admin/reseller/partners/${partnerId}/pricing-plan`, {
        standardPricePerScreen: Number(pricing.standardPricePerScreen),
        pricingMode: pricing.pricingMode,
        wholesaleDiscountPercent: pricing.wholesaleDiscountPercent !== undefined ? Number(pricing.wholesaleDiscountPercent) : undefined,
        fixedPricePerScreen: pricing.fixedPricePerScreen !== undefined ? Number(pricing.fixedPricePerScreen) : undefined,
        taxRatePercent: Number(pricing.taxRatePercent),
        minPurchaseQty: Number(pricing.minPurchaseQty)
      });
      setPricing(res.data.data);
      setMessage("Pricing plan saved.");
    } catch (err) {
      setMessage(err.response?.data?.message || "Something went wrong saving the pricing plan.");
    } finally {
      setSavingPricing(false);
    }
  };

  const saveBilling = async () => {
    setSavingBilling(true);
    setMessage("");
    try {
      const res = await adminApi.put(`/admin/reseller/partners/${partnerId}/billing-config`, {
        billingCycle: billing.billingCycle,
        dueDays: Number(billing.dueDays),
        gracePeriodDays: Number(billing.gracePeriodDays),
        agreementEndDate: billing.agreementEndDate || undefined
      });
      setBilling(res.data.data);
      setMessage("Billing config saved.");
    } catch (err) {
      setMessage(err.response?.data?.message || "Something went wrong saving the billing config.");
    } finally {
      setSavingBilling(false);
    }
  };

  const setOnlinePrepayment = async () => {
    if (!Number(prepayAmount) || Number(prepayAmount) <= 0) {
      setMessage("Enter a valid prepayment amount.");
      return;
    }
    setSettingPrepayment(true);
    setMessage("");
    try {
      const res = await adminApi.patch(`/admin/reseller/partners/${partnerId}/prepayment`, { paymentMode: "online", amount: Number(prepayAmount) });
      setBilling(res.data.data);
      setPrepayAmount("");
      setMessage("Prepayment set — the reseller can now pay it from their panel.");
    } catch (err) {
      setMessage(err.response?.data?.message || "Something went wrong setting the prepayment.");
    } finally {
      setSettingPrepayment(false);
    }
  };

  const confirmOfflinePrepayment = async (paymentDetails) => {
    if (!Number(prepayAmount) || Number(prepayAmount) <= 0) {
      setOfflinePrepayError("Enter a valid prepayment amount first.");
      return;
    }
    setOfflinePrepayError("");
    setSettingPrepayment(true);
    try {
      const res = await adminApi.patch(`/admin/reseller/partners/${partnerId}/prepayment`, {
        paymentMode: "offline",
        amount: Number(prepayAmount),
        ...paymentDetails
      });
      setBilling(res.data.data);
      setPrepayAmount("");
      setConfirmingOfflinePrepayment(false);
      setMessage(res.data.message);
    } catch (err) {
      setOfflinePrepayError(err.response?.data?.message || "Something went wrong verifying this payment.");
    } finally {
      setSettingPrepayment(false);
    }
  };

  const switchInvoiceToOnline = async (invoiceId) => {
    setSwitchingInvoiceId(invoiceId);
    setMessage("");
    try {
      await adminApi.patch(`/admin/reseller/invoices/${invoiceId}/payment-mode`);
      setMessage("Invoice switched to online payment.");
      load();
    } catch (err) {
      setMessage(err.response?.data?.message || "Something went wrong switching this invoice.");
    } finally {
      setSwitchingInvoiceId(null);
    }
  };

  const confirmInvoiceOfflinePayment = async (paymentDetails) => {
    if (!window.confirm("Record this licence invoice payment? Confirm the amount and payment reference have been checked.")) return;
    setInvoiceOfflineError("");
    try {
      const res = await adminApi.patch(`/admin/reseller/invoices/${verifyingInvoiceId}/verify-offline`, paymentDetails);
      setVerifyingInvoiceId(null);
      setMessage(res.data.message);
      load();
    } catch (err) {
      setInvoiceOfflineError(err.response?.data?.message || "Something went wrong verifying this payment.");
    }
  };

  const adjustInventory = async () => {
    if (!window.confirm(`Adjust this reseller licence count by ${adjustQty}? This changes available licences. Continue?`)) return;
    const qty = parseInt(adjustQty, 10);
    if (!qty || qty < 1 || !adjustReason.trim()) {
      setMessage("Enter a quantity of at least 1 and a reason for the adjustment.");
      return;
    }
    setAdjusting(true);
    setMessage("");
    try {
      await adminApi.post(`/admin/reseller/partners/${partnerId}/adjust-inventory`, { quantity: qty, reason: adjustReason });
      setAdjustQty("");
      setAdjustReason("");
      setMessage("Inventory adjusted.");
      load();
    } catch (err) {
      setMessage(err.response?.data?.message || "Something went wrong adjusting inventory.");
    } finally {
      setAdjusting(false);
    }
  };

  if (loading) return <Card className="p-6"><p className="text-slate-400 text-sm">Loading Reseller data...</p></Card>;
  if (!pricing || !billing) return null;

  const available = Math.max(0, (detail?.inventory?.totalPurchasedLicenses || 0) - (detail?.inventory?.totalAllocatedLicenses || 0));

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="font-semibold text-slate-900 mb-4">Reseller — License Inventory</h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <Stat label="Purchased" value={detail?.inventory?.totalPurchasedLicenses || 0} highlight />
          <Stat label="Allocated" value={detail?.inventory?.totalAllocatedLicenses || 0} />
          <Stat label="Available" value={available} />
          <Stat label="Registered" value={detail?.inventory?.totalRegisteredScreens || 0} />
          <Stat label="Active" value={detail?.inventory?.totalActiveScreens || 0} />
        </div>

        <div className="mt-5 pt-5 border-t border-slate-100">
          <p className="text-sm font-medium text-slate-700 mb-2">Manual Adjustment</p>
          <div className="flex flex-wrap items-end gap-3">
            <Input
              label="Quantity to add"
              type="number"
              min="1"
              step="1"
              value={adjustQty}
              onChange={(e) => setAdjustQty(e.target.value)}
              className="w-32"
            />
            <Input label="Reason" value={adjustReason} onChange={(e) => setAdjustReason(e.target.value)} className="flex-1 min-w-[200px]" />
            <Button variant="outline" loading={adjusting} onClick={adjustInventory}>Apply</Button>
          </div>
        </div>
      </Card>

      {message && <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-sm">{message}</div>}

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-900">One-Time Prepayment</h2>
          <Badge status={billing.prepayment?.status === "done" ? "verified" : billing.prepayment?.status === "awaiting_payment" ? "pending" : "not_submitted"}>
            {billing.prepayment?.cheque?.status && <p className="text-sm text-slate-600 mb-3">Cheque {billing.prepayment.cheque.number}: <span className="capitalize">{billing.prepayment.cheque.status}</span></p>}
        {(billing.prepayment?.paymentHistory?.length > 0 || billing.prepayment?.status === "done") && <button type="button" className="text-xs text-brand-red hover:underline mb-3" onClick={() => setHistoryInvoice({ ...billing.prepayment, invoiceNumber: "One-time prepayment", total: billing.prepayment.amount })}>Prepayment history</button>}
        {billing.prepayment?.status === "done" ? "Done" : billing.prepayment?.status === "awaiting_payment" ? "Awaiting Payment" : "Not Done"}
          </Badge>
        </div>

        {billing.prepayment?.status === "done" ? (
          <p className="text-sm text-slate-500">
            ₹{billing.prepayment.amount?.toLocaleString("en-IN")} paid {billing.prepayment.paymentMode === "offline" ? "offline" : "online"} on {new Date(billing.prepayment.paidAt).toLocaleDateString()}.
            This is one-time — nothing further needed.
          </p>
        ) : (
          <>
            <p className="text-xs text-slate-400 mb-3">
              Required before this reseller can buy any licenses. Set an amount and choose how it'll be paid.
            </p>
            <div className="flex flex-wrap items-end gap-3">
              <Input
                label="Amount (₹)"
                type="number"
                min="1"
                value={prepayAmount}
                onChange={(e) => setPrepayAmount(e.target.value)}
                className="w-40"
              />
              <Button variant="outline" loading={settingPrepayment} onClick={setOnlinePrepayment}>
                {billing.prepayment?.status === "awaiting_payment" ? "Update — Online" : "Set — Online"}
              </Button>
              <Button loading={settingPrepayment} onClick={() => { setOfflinePrepayError(""); setConfirmingOfflinePrepayment(true); }}>
                Verify — Offline
              </Button>
            </div>
            {billing.prepayment?.status === "awaiting_payment" && (
              <p className="text-xs text-slate-400 mt-3">
                Currently awaiting ₹{billing.prepayment.amount?.toLocaleString("en-IN")} from the reseller via their Billing page.
              </p>
            )}
          </>
        )}
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Pricing Plan</h2>
          <div className="space-y-3">
            <Input label="Standard price / screen (₹)" type="number" value={pricing.standardPricePerScreen} onChange={(e) => setPricing({ ...pricing, standardPricePerScreen: e.target.value })} />

            <Select label="Pricing Mode" value={pricing.pricingMode} onChange={(e) => setPricing({ ...pricing, pricingMode: e.target.value })}>
              <option value="discount_percent">Discount % off standard</option>
              <option value="fixed_price">Flat negotiated price</option>
            </Select>

            {pricing.pricingMode === "discount_percent" ? (
              <Input label="Wholesale discount %" type="number" value={pricing.wholesaleDiscountPercent ?? ""} onChange={(e) => setPricing({ ...pricing, wholesaleDiscountPercent: e.target.value })} />
            ) : (
              <Input label="Discounted price / screen (₹)" type="number" value={pricing.fixedPricePerScreen ?? ""} onChange={(e) => setPricing({ ...pricing, fixedPricePerScreen: e.target.value })} />
            )}

            <Input label="Tax rate %" type="number" value={pricing.taxRatePercent} onChange={(e) => setPricing({ ...pricing, taxRatePercent: e.target.value })} />
            <Input label="Minimum purchase quantity" type="number" value={pricing.minPurchaseQty} onChange={(e) => setPricing({ ...pricing, minPurchaseQty: e.target.value })} />

            <div className="flex items-center justify-between pt-2">
              <Badge tone="neutral">Effective rate: ₹{pricing.effectivePricePerScreen}/screen</Badge>
              <Button loading={savingPricing} onClick={savePricing}>Save Pricing</Button>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Billing Config</h2>
          <div className="space-y-3">
            <Select label="Billing Cycle" value={billing.billingCycle} onChange={(e) => setBilling({ ...billing, billingCycle: e.target.value })}>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
            </Select>
            <Input label="Due days after invoice" type="number" value={billing.dueDays} onChange={(e) => setBilling({ ...billing, dueDays: e.target.value })} />
            <Input label="Grace period days" type="number" value={billing.gracePeriodDays} onChange={(e) => setBilling({ ...billing, gracePeriodDays: e.target.value })} />
            <Input
              label="Agreement end date"
              type="date"
              value={billing.agreementEndDate ? billing.agreementEndDate.slice(0, 10) : ""}
              onChange={(e) => setBilling({ ...billing, agreementEndDate: e.target.value })}
            />
            <p className="text-xs text-slate-400">Billing is always based on total purchased licenses — never active/allocated usage.</p>
            <div className="flex justify-end pt-2">
              <Button loading={savingBilling} onClick={saveBilling}>Save Billing Config</Button>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="p-4 border-b border-slate-100">
          <p className="text-sm font-semibold text-slate-900">Recent Invoices</p>
        </div>
        <ListToolbar toolbar={invoiceList.toolbar} placeholder="Search invoices by number, amount or status" className="p-3 border-b border-slate-100" />
        <div className="divide-y divide-slate-100">
          {(detail?.invoices || []).length === 0 ? (
            <p className="text-center py-10 text-slate-400 text-sm">No invoices yet.</p>
          ) : invoiceList.visible.length === 0 ? (
            <p className="text-center py-10 text-slate-400 text-sm">Nothing matches your search or filters.</p>
          ) : (
            invoiceList.visible.map((inv) => (
              <div key={inv._id} className="flex items-center justify-between px-4 py-3 text-sm gap-3 flex-wrap">
                <span>
                  {inv.invoiceNumber}
                  {inv.orderCode && <span className="block text-xs text-slate-400">{inv.orderCode} · bill {inv.installmentNumber} of {inv.installmentsInTerm}</span>}
                </span>
                <span className="text-xs text-slate-500">
                  {new Date(inv.billingPeriodStart).toLocaleDateString("en-IN")} – {new Date(inv.billingPeriodEnd).toLocaleDateString("en-IN")}
                </span>
                <span className="text-slate-500">{inv.purchasedLicenseSnapshot + (inv.proratedLicenseCount || 0)} licenses</span>
                <span className="font-medium">₹{inv.total.toLocaleString("en-IN")}</span>
                <Badge status={inv.paymentStatus} />
                {inv.cheque?.status && <span className="text-xs text-slate-500 capitalize">Cheque: {inv.cheque.status}</span>}
                <button type="button" onClick={() => setHistoryInvoice(inv)} className="text-xs text-brand-red hover:underline">Payment history</button>
                {inv.paymentStatus === "paid" ? (
                  <span className="text-xs text-slate-400">{inv.paymentMode === "offline" ? `Paid ${inv.offlinePayment?.method || "offline"}` : "Paid online"}</span>
                ) : (
                  <div className="flex items-center gap-3">
                    <Badge tone="neutral">{inv.paymentMode === "online" ? "Online" : "Offline"}</Badge>
                    {inv.onlineRequested && inv.paymentMode !== "online" && (
                      <span className="text-xs text-amber-600 font-medium">Reseller requested online</span>
                    )}
                    {inv.paymentMode !== "online" && (
                      <button
                        type="button"
                        disabled={switchingInvoiceId === inv._id}
                        onClick={() => switchInvoiceToOnline(inv._id)}
                        className="text-xs font-semibold text-brand-red hover:underline disabled:opacity-50"
                      >
                        Switch to Online
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => { setVerifyingInvoiceId(inv._id); setInvoiceOfflineError(""); }}
                      className="text-xs font-semibold text-brand-red hover:underline"
                    >
                      Verify Offline Payment
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </Card>

      <OfflinePaymentModal
        key={`prepayment-${confirmingOfflinePrepayment}`}
        amount={Number(prepayAmount)}
        partnerName={detail?.partner?.primaryContact?.name || detail?.partner?.legalEntity?.businessName || detail?.partner?.partnerCode}
        trackCheque
        open={confirmingOfflinePrepayment}
        title="Verify offline prepayment"
        error={offlinePrepayError}
        onConfirm={confirmOfflinePrepayment}
        onCancel={() => { setConfirmingOfflinePrepayment(false); setOfflinePrepayError(""); }}
      />

      {historyInvoice && <PaymentHistory invoice={historyInvoice} onClose={() => setHistoryInvoice(null)} />}

      <OfflinePaymentModal
        key={verifyingInvoiceId || "invoice-closed"}
        amount={detail?.invoices?.find((invoice) => invoice._id === verifyingInvoiceId)?.total}
        invoiceNumber={detail?.invoices?.find((invoice) => invoice._id === verifyingInvoiceId)?.invoiceNumber}
        partnerName={detail?.partner?.primaryContact?.name || detail?.partner?.legalEntity?.businessName || detail?.partner?.partnerCode}
        trackCheque
        open={Boolean(verifyingInvoiceId)}
        title="Verify offline invoice payment"
        error={invoiceOfflineError}
        onConfirm={confirmInvoiceOfflinePayment}
        onCancel={() => { setVerifyingInvoiceId(null); setInvoiceOfflineError(""); }}
      />
    </div>
  );
}

function Stat({ label, value, highlight }) {
  return (
    <div>
      <p className={`text-xl font-bold ${highlight ? "text-brand-red" : "text-slate-900"}`}>{value}</p>
      <p className="text-xs text-slate-500 mt-1">{label}</p>
    </div>
  );
}
