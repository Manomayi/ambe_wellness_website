import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

const FALLBACK_IMAGE = "/images/icons/herbal.png";

export const DEFAULT_CATEGORIES = [
  "Shop By Types",
  "Shop By Needs",
];

function parsePrice(value) {
  const n = typeof value === "number" ? value : parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

function slugify(value) {
  return String(value || "item")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function isActive(data) {
  return data.is_active !== false && data.isActive !== false;
}

function parseHighlights(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === "string") {
    return value
      .split("|")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

function resolvePricing(data) {
  const packs = Array.isArray(data.packs) ? data.packs : [];
  const firstPack = packs[0] || {};
  const price = parsePrice(
    firstPack.price ??
      firstPack.trp ??
      data.trp ??
      data.offer_price ??
      data.price ??
      data.selling_price
  );
  const originalPrice = parsePrice(
    firstPack.mrp ?? data.mrp ?? data.original_price ?? data.originalPrice ?? price
  );

  return {
    price: price || originalPrice,
    originalPrice: originalPrice > price ? originalPrice : price,
    packSize: firstPack.size || null,
    packs,
  };
}

function parseRating(value) {
  const n = typeof value === "number" ? value : parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

function parseFeaturedOrder(data) {
  const value =
    data.featured_order ??
    data.sort_order ??
    data.display_order ??
    data.order ??
    data.priority;
  const n = typeof value === "number" ? value : parseInt(value, 10);
  return Number.isFinite(n) ? n : null;
}

function mapProduct(docId, data, parentCategory) {
  const { price, originalPrice, packSize, packs } = resolvePricing(data);
  const name = data.product_name || data.name || data.title || "Product";
  const highlights = parseHighlights(data.productHighlights);

  return {
    id: docId,
    name,
    category: data.category || parentCategory || "Wellness",
    subcategory: data.subcategory || null,
    price,
    originalPrice,
    image: data.image_url || data.imageUrl || data.image || FALLBACK_IMAGE,
    description: data.description || "",
    credentials:
      data.credentials ||
      data.tags ||
      data.certifications ||
      highlights,
    badge: data.badge || (data.new_arrival ? "New" : undefined),
    featured: Boolean(
      data.featured ?? data.is_featured ?? data.isFeatured ?? data.doctor_pick
    ),
    featuredOrder: parseFeaturedOrder(data),
    rating: parseRating(
      data.rating ?? data.average_rating ?? data.avg_rating ?? data.product_rating
    ),
    stripePriceId: data.stripe_price_id || data.stripePriceId || null,
    packSize,
    packs,
    availableQuantity:
      typeof data.available_quantity === "number" ? data.available_quantity : null,
    productLink: data.product_link || data.productLink || null,
  };
}

function mapPackProduct(storeDocId, prod, index, parentCategory) {
  const name = prod.product_name || prod.name || prod.title || `Product ${index + 1}`;
  const id =
    prod.id ||
    `${storeDocId}_${slugify(name)}_${index}`;

  return mapProduct(id, prod, parentCategory);
}

function dedupeProducts(items) {
  const byIdentity = new Map();

  for (const item of items) {
    const identityKey = `${slugify(item.name)}|${item.image}`;
    const existing = byIdentity.get(identityKey);

    if (!existing) {
      byIdentity.set(identityKey, item);
      continue;
    }

    // Prefer flat Firestore doc ids over nested composite ids.
    const existingIsNested = existing.id.includes("_");
    const itemIsNested = item.id.includes("_");
    if (existingIsNested && !itemIsNested) {
      byIdentity.set(identityKey, item);
    }
  }

  const byId = new Map();
  for (const item of byIdentity.values()) {
    let id = item.id;
    let suffix = 1;
    while (byId.has(id)) {
      id = `${item.id}__${suffix}`;
      suffix += 1;
    }
    byId.set(id, { ...item, id });
  }

  return Array.from(byId.values());
}

function parseStoreDocuments(snapshot) {
  const items = [];

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const nested = Array.isArray(data.products) ? data.products : [];

    if (nested.length > 0) {
      const parentCategory = data.category || docSnap.id;
      nested.forEach((prod, index) => {
        if (prod.is_active === false) return;
        items.push(mapPackProduct(docSnap.id, prod, index, parentCategory));
      });
      return;
    }

    if (!isActive(data)) return;

    const hasFlatFields =
      data.product_name ||
      data.name ||
      data.title ||
      data.description ||
      data.image_url ||
      data.imageUrl;

    if (!hasFlatFields) return;

    items.push(mapProduct(docSnap.id, data));
  });

  return dedupeProducts(items);
}

function parseProductsCollection(snapshot) {
  const items = [];

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    if (!isActive(data)) return;
    items.push(mapProduct(docSnap.id, data));
  });

  return dedupeProducts(items);
}

export function isFirebaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN &&
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
      process.env.NEXT_PUBLIC_FIREBASE_APP_ID
  );
}

export async function fetchShopProductsFromFirestore() {
  console.log('Fetching shop products from Firestore...');
  if (!isFirebaseConfigured()) {
    throw new Error(
      "Firebase is not configured on this server. Add NEXT_PUBLIC_FIREBASE_* variables to your hosting platform and redeploy."
    );
  }

  try {
    const storeSnap = await getDocs(collection(db, "store"));
    console.log(storeSnap,'storeSnap')
    const fromStore = parseStoreDocuments(storeSnap);
    if (fromStore.length > 0) return fromStore;

    const productsSnap = await getDocs(collection(db, "products"));
    return parseProductsCollection(productsSnap);
  } catch (error) {
 console.error(error,'Error')
    const code = error?.code || "";
    if (code === "permission-denied") {
      throw new Error(
        "Cannot read products from Firestore. Update security rules to allow public read on the store collection (see Firebase Console → Firestore → Rules)."
      );
    }
    console.error("Failed to fetch shop products from Firestore:", error);
    throw new Error(error?.message || "Failed to load products from Firebase.");
  }
}

export function getCategoriesFromProducts(products) {
  const fromData = [
    ...new Set(products.map((p) => p.category).filter(Boolean)),
  ].sort((a, b) => a.localeCompare(b));

  return fromData.length > 0 ? fromData : DEFAULT_CATEGORIES;
}

export async function fetchShopProductById(id) {
  if (!id) return null;

  const all = await fetchShopProductsFromFirestore();
  const found = all.find((p) => p.id === id);
  if (found) return found;

  try {
    for (const col of ["store", "products"]) {
      const snap = await getDoc(doc(db, col, id));
      if (snap.exists() && isActive(snap.data())) {
        return mapProduct(snap.id, snap.data());
      }
    }
  } catch (error) {
    console.error(`Failed to fetch shop product "${id}":`, error);
  }

  return null;
}

export function formatPrice(amount) {
  const n = parsePrice(amount);
  return n % 1 === 0 ? `$${n}` : `$${n.toFixed(2)}`;
}

/** Sort shop products — matches mobile: featured first by default, then popularity or A–Z. */
export function sortShopProducts(products, sortOption) {
  const indexed = products.map((product, index) => ({ product, index }));

  if (sortOption === "Popularity") {
    return [...indexed]
      .sort((a, b) => (b.product.rating ?? 0) - (a.product.rating ?? 0))
      .map(({ product }) => product);
  }

  if (sortOption === "Name: A to Z") {
    return [...indexed]
      .sort((a, b) => a.product.name.localeCompare(b.product.name))
      .map(({ product }) => product);
  }

  // Default Order: featured items first (by featuredOrder), then original catalog order.
  const featured = indexed.filter(({ product }) => product.featured);
  const rest = indexed.filter(({ product }) => !product.featured);

  featured.sort((a, b) => {
    const aOrder = a.product.featuredOrder ?? Number.MAX_SAFE_INTEGER;
    const bOrder = b.product.featuredOrder ?? Number.MAX_SAFE_INTEGER;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return a.index - b.index;
  });

  return [...featured, ...rest].map(({ product }) => product);
}
