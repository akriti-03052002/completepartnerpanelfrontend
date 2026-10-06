import { useEffect, useState } from "react";
import { ArrowUp, ArrowDown, Trash2, Plus, Eye, RotateCcw, Save, Copy, Info, Lock } from "lucide-react";
import adminApi from "../../services/adminApi";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { copyToClipboard } from "../../utils/copyToClipboard";

// Bullets are edited as one-per-line text and sent to the API as an array.
const toEditable = (template) => ({
  ...template,
  sections: template.sections.map((s) => ({ ...s, bulletsText: (s.bullets || []).join("\n") }))
});

const toPayload = (draft) => ({
  title: draft.title,
  companyName: draft.companyName,
  registeredAddress: draft.registeredAddress,
  intro: draft.intro,
  footerNote: draft.footerNote,
  sections: draft.sections.map((s) => ({
    kind: s.kind,
    heading: s.heading,
    body: s.body,
    bullets: s.bulletsText.split("\n").map((b) => b.trim()).filter(Boolean),
    note: s.note,
    noRatesText: s.noRatesText
  }))
});

function TextArea({ label, hint, value, onChange, rows = 4, disabled }) {
  return (
    <div>
      {label && <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>}
      {hint && <p className="text-xs text-slate-400 mb-1.5">{hint}</p>}
      <textarea
        rows={rows}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm leading-relaxed outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition disabled:bg-slate-50 disabled:text-slate-500"
      />
    </div>
  );
}

export default function AdminAgreement() {
  const { user } = useAdminAuth();
  const canEdit = user?.role === "super_admin";

  const [draft, setDraft] = useState(null);
  const [savedJson, setSavedJson] = useState("");
  const [placeholders, setPlaceholders] = useState({});
  const [isDefault, setIsDefault] = useState(true);
  const [reissue, setReissue] = useState(false);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState("");

  const applyLoaded = (template) => {
    const editable = toEditable(template);
    setDraft(editable);
    setSavedJson(JSON.stringify(toPayload(editable)));
  };

  useEffect(() => {
    adminApi.get("/admin/config/agreement-template")
      .then((res) => {
        applyLoaded(res.data.data.template);
        setPlaceholders(res.data.data.placeholders);
        setIsDefault(res.data.data.isDefault);
      })
      .catch((loadError) => setError(loadError.response?.data?.message || "Couldn't load the agreement."));
  }, []);

  if (!draft) {
    return error
      ? <p role="alert" className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</p>
      : <p className="text-slate-400 text-sm">Loading agreement...</p>;
  }

  const unsaved = JSON.stringify(toPayload(draft)) !== savedJson;
  const set = (field, value) => setDraft((d) => ({ ...d, [field]: value }));
  const setSection = (index, field, value) =>
    setDraft((d) => ({ ...d, sections: d.sections.map((s, i) => (i === index ? { ...s, [field]: value } : s)) }));
  const moveSection = (index, delta) =>
    setDraft((d) => {
      const sections = [...d.sections];
      const [moved] = sections.splice(index, 1);
      sections.splice(index + delta, 0, moved);
      return { ...d, sections };
    });
  const removeSection = (index) => {
    if (!window.confirm(`Remove the "${draft.sections[index].heading}" section?`)) return;
    setDraft((d) => ({ ...d, sections: d.sections.filter((_, i) => i !== index) }));
  };
  const addSection = () =>
    setDraft((d) => ({
      ...d,
      sections: [...d.sections, { kind: "text", heading: "New section", body: "", bulletsText: "", note: "", noRatesText: "" }]
    }));

  const flash = (text) => { setMessage(text); setError(""); };
  const fail = (err, fallback) => { setError(err.response?.data?.message || fallback); setMessage(""); };

  const preview = async () => {
    setBusy("preview");
    try {
      const res = await adminApi.post("/admin/config/agreement-template/preview", { template: toPayload(draft) }, { responseType: "blob" });
      const url = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      window.open(url, "_blank", "noopener");
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err) {
      // Errors come back as a JSON blob when responseType is "blob".
      let msg = "Couldn't build the preview.";
      try { msg = JSON.parse(await err.response.data.text()).message || msg; } catch { /* keep default */ }
      setError(msg);
      setMessage("");
    } finally {
      setBusy("");
    }
  };

  const save = async () => {
    if (reissue && !window.confirm("Save and send the new agreement to every verified influencer now? Each one gets a notification.")) return;
    setBusy("save");
    try {
      const res = await adminApi.put("/admin/config/agreement-template", { template: toPayload(draft), reissueExisting: reissue });
      applyLoaded(res.data.data.template);
      setIsDefault(false);
      setReissue(false);
      flash(res.data.message);
    } catch (err) {
      fail(err, "Couldn't save the agreement.");
    } finally {
      setBusy("");
    }
  };

  const reset = async () => {
    if (!window.confirm("Replace all the wording with the original default agreement? Your edits will be lost.")) return;
    setBusy("reset");
    try {
      const res = await adminApi.post("/admin/config/agreement-template/reset");
      applyLoaded(res.data.data.template);
      setIsDefault(true);
      flash(res.data.message);
    } catch (err) {
      fail(err, "Couldn't reset the agreement.");
    } finally {
      setBusy("");
    }
  };

  const copyPlaceholder = (key) => {
    copyToClipboard(`{{${key}}}`).then((ok) => {
      if (!ok) return;
      setCopied(key);
      setTimeout(() => setCopied(""), 1500);
    });
  };

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Influencer Agreement</h1>
          <p className="text-sm text-slate-500 mt-1">
            The wording of the agreement every verified influencer receives. New agreements always use the latest saved version.
            {isDefault && " You're currently using the default wording."}
          </p>
        </div>
        <Button type="button" variant="outline" onClick={preview} loading={busy === "preview"}>
          <span className="flex items-center gap-2"><Eye size={16} /> Preview PDF</span>
        </Button>
      </div>

      {!canEdit && (
        <p className="flex items-center gap-2 p-3 rounded-xl bg-slate-100 text-slate-600 text-sm">
          <Lock size={15} /> Only a super admin can change the agreement. You can read and preview it.
        </p>
      )}
      {error && <p role="alert" className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</p>}
      {message && <p role="status" className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">{message}</p>}

      <div className="grid lg:grid-cols-[1fr_300px] gap-6 items-start">
        <div className="space-y-4">
          <Card className="p-6 space-y-4">
            <h2 className="font-semibold text-slate-900">Heading & company details</h2>
            <Input label="Agreement title" value={draft.title} onChange={(e) => set("title", e.target.value)} disabled={!canEdit} maxLength={120} />
            <div className="grid sm:grid-cols-2 gap-4">
              <Input label="Company name" value={draft.companyName} onChange={(e) => set("companyName", e.target.value)} disabled={!canEdit} maxLength={120} />
              <Input
                label="Registered office address"
                value={draft.registeredAddress}
                onChange={(e) => set("registeredAddress", e.target.value)}
                disabled={!canEdit}
                maxLength={300}
                placeholder="Required for a valid agreement"
                error={!draft.registeredAddress.trim() ? "Not set — the PDF will show a placeholder." : ""}
              />
            </div>
            <TextArea label="Opening paragraph" value={draft.intro} onChange={(v) => set("intro", v)} rows={5} disabled={!canEdit} />
          </Card>

          <Card className="p-5 flex items-start gap-3 bg-slate-50">
            <Info size={16} className="text-slate-400 shrink-0 mt-0.5" />
            <p className="text-sm text-slate-600">
              <span className="font-semibold">1. Parties</span> is filled in automatically from each influencer&apos;s profile
              (name, code, address, email, phone), so it isn&apos;t edited here. Your sections below are numbered from 2.
            </p>
          </Card>

          {draft.sections.map((section, index) => {
            const isRates = section.kind === "payment_rates";
            return (
              <Card key={index} className={`p-6 space-y-4 ${isRates ? "ring-2 ring-emerald-200" : ""}`}>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-slate-400 w-6">{index + 2}.</span>
                  <input
                    aria-label={`Heading of section ${index + 2}`}
                    value={section.heading}
                    onChange={(e) => setSection(index, "heading", e.target.value)}
                    disabled={!canEdit}
                    maxLength={120}
                    className="flex-1 font-semibold text-slate-900 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-slate-400 disabled:bg-slate-50"
                  />
                  {canEdit && (
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => moveSection(index, -1)} disabled={index === 0} aria-label="Move up" className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30"><ArrowUp size={16} /></button>
                      <button type="button" onClick={() => moveSection(index, 1)} disabled={index === draft.sections.length - 1} aria-label="Move down" className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30"><ArrowDown size={16} /></button>
                      <button
                        type="button"
                        onClick={() => removeSection(index)}
                        disabled={isRates}
                        aria-label="Remove section"
                        title={isRates ? "The Payment Terms section can't be removed — it's where the rates are listed." : "Remove section"}
                        className="p-2 rounded-lg text-red-500 hover:bg-red-50 disabled:opacity-30"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>

                {isRates && (
                  <p className="text-xs text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2">
                    The influencer&apos;s rate for each social account (e.g. &quot;Instagram — @handle: Rs. 8,000 per post&quot;) is listed
                    automatically after this text, from the prices set on their accounts.
                  </p>
                )}

                <TextArea label={isRates ? "Text before the rate list" : "Text"} value={section.body} onChange={(v) => setSection(index, "body", v)} disabled={!canEdit} />
                <TextArea
                  label="Bullet points (optional)"
                  hint="One per line."
                  value={section.bulletsText}
                  onChange={(v) => setSection(index, "bulletsText", v)}
                  rows={Math.max(2, section.bulletsText.split("\n").length)}
                  disabled={!canEdit}
                />
                {(isRates || section.note) && (
                  <TextArea label={isRates ? "Text after the rate list" : "Closing paragraph (optional)"} value={section.note} onChange={(v) => setSection(index, "note", v)} disabled={!canEdit} />
                )}
                {isRates && (
                  <TextArea
                    label="Shown instead of the rate list when no rates are set yet"
                    value={section.noRatesText}
                    onChange={(v) => setSection(index, "noRatesText", v)}
                    rows={3}
                    disabled={!canEdit}
                  />
                )}
              </Card>
            );
          })}

          {canEdit && (
            <button
              type="button"
              onClick={addSection}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-dashed border-slate-200 text-sm font-semibold text-slate-500 hover:border-slate-300 hover:text-slate-700"
            >
              <Plus size={16} /> Add section
            </button>
          )}

          <Card className="p-6">
            <TextArea
              label="Closing note"
              hint="Small print shown above the signature block."
              value={draft.footerNote}
              onChange={(v) => set("footerNote", v)}
              rows={3}
              disabled={!canEdit}
            />
          </Card>
        </div>

        <Card className="p-5 lg:sticky lg:top-6">
          <h2 className="font-semibold text-slate-900">Auto-filled words</h2>
          <p className="text-xs text-slate-500 mt-1 mb-3">Type these anywhere in the text — each is replaced for every influencer. Click to copy.</p>
          <div className="space-y-2">
            {Object.entries(placeholders).map(([key, description]) => (
              <button
                key={key}
                type="button"
                onClick={() => copyPlaceholder(key)}
                className="w-full text-left rounded-lg border border-slate-100 px-3 py-2 hover:bg-slate-50"
              >
                <span className="flex items-center justify-between gap-2">
                  <code className="text-xs font-semibold text-slate-800">{`{{${key}}}`}</code>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">{copied === key ? "Copied" : <Copy size={12} />}</span>
                </span>
                <span className="block text-xs text-slate-500 mt-0.5">{description}</span>
              </button>
            ))}
          </div>
        </Card>
      </div>

      {canEdit && (
        <div className="fixed bottom-0 left-0 right-0 lg:left-64 z-20 border-t border-slate-200 bg-white/95 backdrop-blur px-6 py-3">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={reissue} onChange={(e) => setReissue(e.target.checked)} />
              Also send the updated agreement to all verified influencers now
            </label>
            <div className="flex items-center gap-2">
              {unsaved && <span className="text-xs font-medium text-amber-600">Unsaved changes</span>}
              <Button type="button" variant="ghost" onClick={reset} loading={busy === "reset"} disabled={isDefault && !unsaved}>
                <span className="flex items-center gap-2"><RotateCcw size={15} /> Reset to default</span>
              </Button>
              <Button type="button" onClick={save} loading={busy === "save"} disabled={!unsaved && !reissue}>
                <span className="flex items-center gap-2"><Save size={15} /> Save agreement</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
