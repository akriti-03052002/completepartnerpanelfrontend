// Free-text search over a list of records, used by every search box in the
// partner panel. A row matches when every word typed appears somewhere in
// its values — names, emails, phone numbers, amounts, statuses, references —
// however deeply they are nested.

const SKIPPED_KEYS = /hash|encrypted|token|password|^__v$/;
// A bare id means nothing to the person searching. But a field like
// `partnerId` often holds the whole linked record (its name, code, email),
// and that must stay findable.
const ID_KEYS = /^_id$|Id$/;

const collect = (value, parts, depth) => {
  if (value === null || value === undefined || depth > 5) return;
  if (typeof value === "string") {
    parts.push(value);
    // A stored date is also findable the way it is shown ("6/10/2026").
    if (/^\d{4}-\d{2}-\d{2}T/.test(value)) parts.push(new Date(value).toLocaleDateString());
    // "pending_approval" is shown as "pending approval".
    if (value.includes("_")) parts.push(value.replace(/_/g, " "));
  } else if (typeof value === "number") {
    parts.push(String(value), value.toLocaleString("en-IN"));
  } else if (Array.isArray(value)) {
    value.forEach((item) => collect(item, parts, depth + 1));
  } else if (typeof value === "object") {
    for (const [key, inner] of Object.entries(value)) {
      if (SKIPPED_KEYS.test(key)) continue;
      if (ID_KEYS.test(key) && (typeof inner !== "object" || inner === null)) continue;
      collect(inner, parts, depth + 1);
    }
  }
};

export const rowText = (row) => {
  const parts = [];
  collect(row, parts, 0);
  return parts.join(" ").toLowerCase();
};

export function searchRows(rows, query) {
  const words = String(query || "").toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return rows;
  return rows.filter((row) => {
    const text = rowText(row);
    return words.every((word) => text.includes(word));
  });
}
