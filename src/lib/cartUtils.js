/**
 * Generates a clean, deterministic document ID for a cart item or product variant.
 * Matches Flutter's UserCartItem.generateItemId logic to prevent duplicates between web and mobile.
 */
export function generateCartItemId(productName = '', size = '', productId = null) {
  if (productId && typeof productId === 'string' && productId.trim() && productId.trim() !== 'ID_TBD') {
    return `${productId.trim()}_${size.replace(/\s+/g, '_')}`;
  }
  const cleanName = String(productName).toLowerCase().trim().replace(/[^a-z0-9]/g, '_');
  const cleanSize = String(size).toLowerCase().trim().replace(/[^a-z0-9]/g, '_');
  return `${cleanName}_${cleanSize}`;
}

/**
 * Returns the effective unit price for a cart item (discounted price if available and positive, else MRP).
 */
export function getItemUnitPrice(item) {
  if (!item) return 0;
  if (item.price != null && !isNaN(Number(item.price)) && Number(item.price) > 0) {
    return Number(item.price);
  }
  return Number(item.mrp) || 0;
}
