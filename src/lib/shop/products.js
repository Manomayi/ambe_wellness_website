// Ambé Shop — product catalog.
//
// This module is the single source of truth the /shop page renders from, so
// products are never hard-coded into JSX. Today it returns a static catalog;
// swap `getProducts()` for a Firestore / app-backend fetch (same source the
// app uses) and the page picks up changes automatically — the card layout reads
// the shape below regardless of where the data comes from.
//
// Each product carries the fields the design reference calls for:
//   id, name, category, price, originalPrice, image, description,
//   badge          (optional override, e.g. "NEW" — otherwise the % off shows),
//   credentials[]  (GMP Certified, Wildcrafted, …),
//   stripePriceId  (REUSE the existing Stripe Price IDs from the app — the
//                   placeholders below must be replaced with the real ones).

// Filter pill order is fixed by the reference. "All Products" is handled in UI.
export const CATEGORIES = [
  "Digestion",
  "Immunity",
  "Stress & Sleep",
  "Hormones",
  "Detox & Cleanse",
  "Joints & Mobility",
];

// NOTE: `stripePriceId` values below are placeholders. Replace each with the
// real Price ID already created in the app's Stripe account before going live.
const CATALOG = [
  {
    id: "triphala",
    name: "Triphala",
    category: "Digestion",
    price: 18,
    originalPrice: 30,
    image: "/images/icons/herbal.png",
    description:
      "A cornerstone classical Ayurvedic formula of three fruits prepared according to ancient texts. Supports digestive health, gentle detoxification, and regular elimination.",
    credentials: ["GMP Certified", "GMO Free", "Classical Formula"],
    stripePriceId: "price_triphala_PLACEHOLDER",
  },
  {
    id: "ashwagandha-root",
    name: "Ashwagandha Root",
    category: "Stress & Sleep",
    price: 22,
    originalPrice: 36,
    image: "/images/icons/supplements.png",
    description:
      "Time-tested adaptogenic root, wildcrafted and sustainably sourced. Supports resilience to stress, restful sleep, and sustained energy without stimulants.",
    credentials: ["Wildcrafted", "Prop 65 Compliant", "GMP Certified"],
    stripePriceId: "price_ashwagandha_PLACEHOLDER",
  },
  {
    id: "tulsi",
    name: "Tulsi (Holy Basil)",
    category: "Immunity",
    price: 16,
    originalPrice: 26,
    badge: "NEW",
    image: "/images/icons/herbal.png",
    description:
      "Sacred in 5,000-year Ayurvedic tradition, prepared from wildcrafted Holy Basil. Supports immune resilience, respiratory health, and the body's response to environmental stress.",
    credentials: ["Wildcrafted", "GMO Free", "FDA-Registered Facility"],
    stripePriceId: "price_tulsi_PLACEHOLDER",
  },
  {
    id: "boswellia",
    name: "Boswellia (Shallaki)",
    category: "Joints & Mobility",
    price: 24,
    originalPrice: 40,
    image: "/images/icons/musculoskeletal.png",
    description:
      "Ethically wildcrafted Boswellia resin used for centuries to support joint comfort, mobility, and the body's natural inflammatory response. ISO certified sourcing.",
    credentials: ["Wildcrafted", "Prop 65 Compliant", "ISO Certified"],
    stripePriceId: "price_boswellia_PLACEHOLDER",
  },
  {
    id: "shatavari",
    name: "Shatavari",
    category: "Hormones",
    price: 26,
    originalPrice: 44,
    image: "/images/icons/womens_health.png",
    description:
      "A revered classical Ayurvedic women's formula, sustainably wildcrafted. Supports hormonal balance, reproductive health, and vitality across all life stages.",
    credentials: ["Wildcrafted", "Classical Formula", "GMP Certified"],
    stripePriceId: "price_shatavari_PLACEHOLDER",
  },
  {
    id: "neem",
    name: "Neem Leaf Extract",
    category: "Detox & Cleanse",
    price: 20,
    originalPrice: 34,
    image: "/images/icons/healthy-food.png",
    description:
      "One of Ayurveda's most celebrated purifying herbs. Wildcrafted Neem, ethically sourced and third-party tested. Supports skin clarity, blood purification, and natural detoxification pathways.",
    credentials: ["Wildcrafted", "Third-Party Tested", "Prop 65 Compliant"],
    stripePriceId: "price_neem_PLACEHOLDER",
  },
];

/**
 * Returns the product catalog. Async so this can be swapped for a live
 * Firestore / backend fetch without touching the page component.
 */
export async function getProducts() {
  // TODO: replace with the live catalog source the app uses, e.g.:
  //   const snap = await getDocs(collection(db, "products"));
  //   return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return CATALOG;
}

/** Look up a single product by id (used by the checkout API to resolve price). */
export async function getProductById(id) {
  const all = await getProducts();
  return all.find((p) => p.id === id) || null;
}
