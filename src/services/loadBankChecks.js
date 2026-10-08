import adminApi from "./adminApi";
export async function loadBankChecks() {
      const res = await adminApi.get("/admin/bank/pending");
      let incomplete = res.data.incompletePartners;
      if (!Array.isArray(incomplete)) {
        // Older deployments return only submitted accounts. Fetch partner
        // details as well so missing bank accounts cannot disappear.
        const partnerRes = await adminApi.get("/admin/partners");
        const partners = partnerRes.data.data.filter(p => !["rejected", "inactive"].includes(p.status));
        const details = await Promise.all(partners.map(p => adminApi.get(`/admin/partners/${p._id}`)));
        incomplete = details.flatMap(({ data: response }) => {
          const { partner, bankAccount } = response.data;
          if (bankAccount?.verification?.status === "verified") return [];
          return [{ ...partner, checkStatus: !bankAccount ? "Not submitted" : bankAccount.verification?.status === "rejected" ? "Needs correction" : "Waiting for review" }];
        });
      }
      // Include updates even when the server still uses the older count.
      const byPartner = new Map(incomplete.map(p => [String(p._id), p]));
      for (const account of res.data.data) {
        if (account.pendingChange && account.partnerId && !["rejected", "inactive"].includes(account.partnerId.status)) {
          byPartner.set(String(account.partnerId._id), { ...account.partnerId, checkStatus: "Bank update awaiting review", bankAccountId: account._id });
        }
      }
      incomplete = [...byPartner.values()];
  return { accounts: res.data.data, incompletePartners: incomplete };
}