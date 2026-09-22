import { functions } from "@/lib/firebase/config";
import { httpsCallable } from "firebase/functions";

// In-memory cache for tax calculations
const taxCache = new Map();

/**
 * Calculates tax dynamically via Firebase Cloud Function (Stripe Tax or Admin Static Tax).
 *
 * @param {Object} params
 * @param {Object} params.address - Delivery address { streetNumber, streetName, city, state, zipCode, country }
 * @param {Array} params.items - Cart items [{ id, name, price, quantity }]
 * @param {number} params.subtotal - Subtotal amount in dollars
 * @param {number} [params.shippingAmount=10] - Shipping cost in dollars
 * @param {boolean} [params.isTestMode=false]
 * @returns {Promise<{ mode: string, taxAmount: number, taxAmountCents: number, taxRate: number, taxRatePercent: number, taxBreakdown: Array, calculationId: string|null }>}
 */
export async function calculateOrderTax({
  address,
  items = [],
  subtotal = 0,
  shippingAmount = 0,
  isTestMode = false,
}) {
  if (subtotal <= 0) {
    return {
      mode: "dynamic",
      taxAmount: 0,
      taxAmountCents: 0,
      taxRate: 0,
      taxRatePercent: 0,
      taxBreakdown: [],
      calculationId: null,
    };
  }

  const state = address?.state || "";
  const zip = address?.zipCode || address?.postalCode || "";
  const cacheKey = `${state}|${zip}|${subtotal.toFixed(2)}|${shippingAmount.toFixed(2)}|${isTestMode}`;

  if (taxCache.has(cacheKey)) {
    return taxCache.get(cacheKey);
  }

  try {
    const calculateOrderTaxFn = httpsCallable(functions, "calculateOrderTax");
    const result = await calculateOrderTaxFn({
      address,
      items,
      subtotal,
      shippingAmount,
      isTestMode: Boolean(isTestMode),
    });

    const data = result.data || {};
    const taxResult = {
      mode: data.mode || "dynamic",
      taxAmount: typeof data.taxAmount === "number" ? data.taxAmount : 0,
      taxAmountCents: typeof data.taxAmountCents === "number" ? data.taxAmountCents : 0,
      taxRate: typeof data.taxRate === "number" ? data.taxRate : 0,
      taxRatePercent: typeof data.taxRatePercent === "number" ? data.taxRatePercent : 0,
      taxBreakdown: Array.isArray(data.taxBreakdown) ? data.taxBreakdown : [],
      calculationId: data.calculationId || null,
      warning: data.warning || null,
    };

    taxCache.set(cacheKey, taxResult);
    return taxResult;
  } catch (error) {
    console.warn("[taxService] Failed to calculate tax, using fallback:", error);
    const fallbackAmount = Number(((subtotal * 10) / 100).toFixed(2));
    return {
      mode: "fallback",
      taxAmount: fallbackAmount,
      taxAmountCents: Math.round(fallbackAmount * 100),
      taxRate: 0.1,
      taxRatePercent: 10,
      taxBreakdown: [],
      calculationId: null,
      warning: error.message,
    };
  }
}
