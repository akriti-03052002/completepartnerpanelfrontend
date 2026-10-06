import { useEffect, useState } from "react";
import { X } from "lucide-react";
import adminApi from "../../services/adminApi";
import Button from "../ui/Button";
import Badge from "../ui/Badge";

// Lets an admin edit any clause of one partner's agreement before it's
// (re)generated — different partners can be on different negotiated terms.
// Only sections the admin actually changed are saved as overrides; the rest
// keep following the standard wording for the partner's type (which tracks
// their live commission / pricing terms). Clearing a section's text resets
// it to that standard wording.
export default function AgreementTermsModal({ partnerId, hasAgreement, onClose, onReissued }) {
  const [sections, setSections] = useState(null);
  const [values, setValues] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reissuing, setReissuing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    adminApi.get(`/admin/partners/${partnerId}/agreement-terms`)
      .then((res) => {
        const data = res.data.data.sections;
        setSections(data);
        setValues(Object.fromEntries(data.map((s) => [s.key, s.value])));
      })
      .catch((err) => setError(err.response?.data?.message || "Couldn't load the agreement terms."))
      .finally(() => setLoading(false));
  }, [partnerId]);

  const changedSections = () =>
    Object.fromEntries((sections || [])
      .filter((s) => (values[s.key] ?? "") !== s.value)
      .map((s) => [s.key, values[s.key] ?? ""]));

  const saveTerms = () => adminApi.patch(`/admin/partners/${partnerId}/agreement-terms`, { sections: changedSections() });

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      await saveTerms();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't save these terms. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleReissue = async () => {
    setReissuing(true);
    setError("");
    try {
      await saveTerms();
      await adminApi.post(`/admin/partners/${partnerId}/agreement/regenerate`);
      onReissued();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't reissue the agreement. Try again.");
    } finally {
      setReissuing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
          <div>
            <p className="text-sm font-semibold text-slate-900">Agreement Terms</p>
            <p className="text-xs text-slate-400">Edit any section for this partner — leave as-is to keep the standard wording.</p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-brand-black" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-auto p-5 space-y-5">
          {loading && <p className="text-sm text-slate-400">Loading...</p>}
          {!loading && sections && sections.map((section) => (
            <div key={section.key}>
              <div className="flex items-center gap-2 mb-1.5">
                <p className="text-sm font-semibold text-slate-900">{section.title}</p>
                {section.isCustomized && <Badge tone="warning">Customized</Badge>}
                {section.isCustomized && (
                  <button
                    type="button"
                    onClick={() => setValues((prev) => ({ ...prev, [section.key]: "" }))}
                    className="ml-auto text-xs font-semibold text-slate-500 hover:underline"
                  >
                    Reset to standard
                  </button>
                )}
              </div>
              <textarea
                value={values[section.key] ?? ""}
                onChange={(e) => setValues((prev) => ({ ...prev, [section.key]: e.target.value }))}
                rows={4}
                maxLength={10000}
                placeholder="Blank — the standard wording will be used."
                aria-label={section.title}
                className="w-full text-sm text-slate-700 border border-slate-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-brand-red/30 focus:border-brand-red"
              />
            </div>
          ))}
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-slate-100 shrink-0">
          <Button variant="outline" onClick={handleSave} loading={saving} disabled={reissuing || loading || !sections}>
            Save Terms
          </Button>
          <Button onClick={handleReissue} loading={reissuing} disabled={saving || loading || !sections}>
            {hasAgreement === false ? "Save & Generate Agreement" : "Save & Reissue Agreement"}
          </Button>
        </div>
      </div>
    </div>
  );
}
