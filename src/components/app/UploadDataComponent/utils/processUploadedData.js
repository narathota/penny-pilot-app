// FILE: src/components/app/UploadDataComponent/utils/processUploadedData.js
import { slugify } from "../../../../utils/firebase/collections";
import { splitTagPathsCell as splitPaths } from "./tagUtils";

// Build column index map from headers
const idxMap = (headers) => {
  const m = new Map();
  headers?.forEach((h, i) => m.set(h, i));
  return {
    id: m.get("ID"),
    date: m.get("Date"),
    desc: m.get("Description"),
    currency: m.get("Currency"),
    type: m.get("Type"),
    account: m.get("Account"),
    amount: m.get("Amount"),
    tags: m.get("Tags"),
  };
};

export function processUploadedData({ headers, rows, user }) {
  const idx = idxMap(headers || []);
  if (!rows?.length) {
    return {
      accounts: [],
      tags: { nodes: [], tree: [], conflicts: [] },
      transactions: [],
      counts: { accounts: 0, tags: 0, transactions: 0 },
    };
  }

  // ---------- ACCOUNTS ----------
  const accountMap = new Map(); // slug -> { name, slug, currencyCode }
  for (const r of rows) {
    const name = (r?.[idx.account] ?? "").toString().trim();
    if (!name) continue;
    const slug = slugify(name);
    const currencyCode = (r?.[idx.currency] ?? "").toString().trim().toUpperCase();
    if (!accountMap.has(slug)) {
      accountMap.set(slug, { name, slug, currencyCode });
    } else if (currencyCode && !accountMap.get(slug).currencyCode) {
      accountMap.get(slug).currencyCode = currencyCode;
    }
  }
  const accounts = Array.from(accountMap.values());

  // ---------- TAGS (unique nodes, preserve hierarchy) ----------
  const tagNodeBySlug = new Map(); // slug -> node
  const ensureNode = (name) => {
    const slug = slugify(name);
    let node = tagNodeBySlug.get(slug);
    if (!node) {
      node = { name, slug, parentSlug: null, ancestors: [], depth: 1, children: new Set() };
      tagNodeBySlug.set(slug, node);
    }
    return node;
  };

  const conflicts = [];
  const linkParent = (childName, parentName) => {
    const child = ensureNode(childName);
    const parent = parentName ? ensureNode(parentName) : null;
    if (!parent) return;
    if (child.parentSlug && child.parentSlug !== parent.slug) {
      conflicts.push({ child: child.slug, prevParent: child.parentSlug, newParent: parent.slug });
    }
    child.parentSlug = parent.slug;
    parent.children.add(child.slug);
  };

  for (const r of rows) {
    const raw = r?.[idx.tags];
    for (const path of splitPathsSafe(raw)) {
      const segs = segments(path);
      for (let i = 0; i < segs.length; i++) {
        ensureNode(segs[i]);
        if (i > 0) linkParent(segs[i], segs[i - 1]);
      }
    }
  }

  // finalize nodes (ancestors/depth) and tree
  for (const node of tagNodeBySlug.values()) {
    const ancestors = [];
    let cur = node;
    while (cur?.parentSlug) {
      const parent = tagNodeBySlug.get(cur.parentSlug);
      if (!parent) break;
      ancestors.unshift(parent.slug);
      cur = parent;
    }
    node.ancestors = ancestors;
    node.depth = Math.max(1, ancestors.length + 1);
  }
  const tagNodes = Array.from(tagNodeBySlug.values())
    .map((n) => ({ ...n, children: Array.from(n.children) }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const treeRoots = tagNodes.filter((n) => !n.parentSlug);
  const childMap = new Map(tagNodes.map((n) => [n.slug, n]));
  const tagTree = treeRoots.map((root) => expand(root.slug, childMap));

  // ---------- TRANSACTIONS ----------
  const transactions = [];
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const id = (r?.[idx.id] ?? "").toString().trim() || undefined;
    const date = toISO((r?.[idx.date] ?? "").toString().trim());
    const description = (r?.[idx.desc] ?? "").toString().trim();
    const currencyCode = (r?.[idx.currency] ?? "").toString().trim().toUpperCase();
    const typeName = (r?.[idx.type] ?? "").toString().trim();
    const accountName = (r?.[idx.account] ?? "").toString().trim();
    const accountId = slugify(accountName);
    const amount = Number(r?.[idx.amount]) || 0;

    // Use the first tag path for leaf/ancestors
    const firstPath = splitPathsSafe(r?.[idx.tags])[0] || "";
    const tagNames = segments(firstPath);
    const tagLeafName = tagNames[tagNames.length - 1] || "";
    const tagLeafId = tagLeafName ? slugify(tagLeafName) : null;
    const tagPathIds = tagNames.map(slugify);

    transactions.push({
      id,
      date,
      description,
      currencyCode,
      typeName,
      accountName,
      accountId,
      amount,
      tagPath: tagNames,
      tagPathIds,
      tagLeafId,
      tagAncestorIds: tagPathIds,
      source: "csv-upload",
      sourceRowIndex: i,
    });
  }

  return {
    accounts,
    tags: { nodes: tagNodes, tree: tagTree, conflicts },
    transactions,
    counts: { accounts: accounts.length, tags: tagNodes.length, transactions: transactions.length },
  };
}

/* helpers */
function splitPathsSafe(cell) {
  if (cell == null) return [];
  return splitPaths(cell);
}
function segments(path) {
  return String(path).split(/\s*\/\s*/g).map((s) => s.trim()).filter(Boolean);
}
function toISO(v) {
  if (!v) return "";
  const d = v instanceof Date ? v : new Date(v);
  if (isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function expand(slug, map) {
  const node = map.get(slug);
  if (!node) return null;
  return {
    ...node,
    children: (node.children || []).map((c) => expand(c, map)).filter(Boolean),
  };
}
