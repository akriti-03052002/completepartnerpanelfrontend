import adminApi from "./adminApi";
export async function loadIdentityChecks() {
      const res = await adminApi.get("/admin/documents/pending");
      let incomplete = res.data.incompletePartners;
      if (!Array.isArray(incomplete)) {
        const all = await adminApi.get("/admin/partners");
        const eligible = all.data.data.filter(p => !["rejected", "inactive"].includes(p.status));
        const details = await Promise.all(eligible.map(p => adminApi.get(`/admin/partners/${p._id}`)));
        incomplete = details.flatMap(({ data: response }) => {
          const { partner, documents, requiredDocumentTypes } = response.data;
          const missing = requiredDocumentTypes.filter(type => !documents.some(d => d.documentType === type && d.verification?.status === "verified"));
          if (!missing.length) return [];
          const notSubmitted = missing.filter(type => !documents.some(d => d.documentType === type));
          const awaiting = documents.some(d => missing.includes(d.documentType) && d.verification?.status === "pending");
          return [{ ...partner, missing, notSubmitted, checkStatus: awaiting ? "Waiting for review" : notSubmitted.length ? "Not submitted" : "Needs correction" }];
        });
      }
  return incomplete;
}