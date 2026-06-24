import {
  DEFAULT_CATEGORIES,
  fetchShopProductById,
  fetchShopProductsFromFirestore,
  getCategoriesFromProducts,
} from "@/lib/shop/firestore-products";

// Re-export for ShopClient filter pills (derived from live data when possible).
export const CATEGORIES = DEFAULT_CATEGORIES;
export { getCategoriesFromProducts };

/**
 * Returns the product catalog from Firestore `store` (then `products` fallback).
 */
export async function getProducts() {
  return fetchShopProductsFromFirestore();
}

/** Look up a single product by id (used by the checkout API to resolve price). */
export async function getProductById(id) {
  return fetchShopProductById(id);
}
