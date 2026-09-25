import { doc, getDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

/**
 * Normalizes raw Firestore product data into a standardized product object
 * compatible with ProductDetailsModal.
 */
export function normalizeProduct(id, data = {}) {
  const name = data.product_name || data.name || data.title || 'Ayurvedic Formula';
  const rawPacks = Array.isArray(data.packs) ? data.packs : [];
  const rawVariants = Array.isArray(data.variants) ? data.variants : [];

  let variants = [];
  if (rawVariants.length > 0) {
    variants = rawVariants;
  } else if (rawPacks.length > 0) {
    variants = rawPacks.map((pack, idx) => {
      const packPrice = parseFloat(pack.price ?? pack.trp ?? pack.offer_price ?? pack.mrp) || 0;
      const packMrp = parseFloat(pack.mrp ?? pack.original_price ?? packPrice) || packPrice;
      return {
        id: `pack_${idx}_${pack.size || 'default'}`,
        name: pack.size || 'Standard',
        price: packPrice,
        original_price: packMrp
      };
    });
  } else {
    const singlePrice = parseFloat(data.price) || 0;
    const singleMrp = parseFloat(data.mrp ?? data.original_price ?? singlePrice) || singlePrice;
    variants = [
      {
        id: 'default',
        name: data.size || data.variantName || 'Standard',
        price: singlePrice,
        original_price: singleMrp
      }
    ];
  }

  const defaultPrice = variants[0]?.price ?? parseFloat(data.price) ?? 0;
  const defaultOriginalPrice =
    variants[0]?.original_price ?? parseFloat(data.original_price ?? data.mrp ?? defaultPrice) ?? defaultPrice;

  const rawImageUrls = Array.isArray(data.image_urls)
    ? data.image_urls
    : Array.isArray(data.imageUrls)
    ? data.imageUrls
    : [];

  const rawImage =
    data.image_url ||
    data.imageUrl ||
    data.image ||
    (rawImageUrls.length > 0 ? rawImageUrls[0] : null) ||
    null;

  return {
    id: id || `prod_${Date.now()}`,
    name,
    product_name: name,
    shop_id: data.shop_id || data.shopId || null,
    shopId: data.shop_id || data.shopId || null,
    variants,
    packs: rawPacks,
    price: defaultPrice,
    original_price: defaultOriginalPrice,
    category: data.category || '',
    subcategory: data.subcategory || data.sub_category || '',
    imageUrl: rawImage,
    imageUrls: rawImageUrls.length > 0 ? rawImageUrls : (rawImage ? [rawImage] : []),
    description: data.description || '',
    composition: data.composition || '',
    benefits: data.benefits || '',
    salesCount: Number(data.sales_count ?? data.salesCount) || 0,
    rating: Number(data.rating ?? data.avg_rating) || 0,
    reviewCount: Number(data.review_count ?? data.reviewCount) || 0,
    isActive: data.is_active !== false,
  };
}

/**
 * Loads a product for the ProductDetailsModal by productId or productName.
 * Searches the 'store' collection and nested store product arrays.
 * Falls back to constructing a clean Product object from fallbackData if not found.
 */
export async function fetchProductForModal(productId, productName, fallbackData = {}) {
  const cleanId = (productId || '').trim();
  const cleanName = (productName || fallbackData.product_name || fallbackData.name || '').trim();

  // 1. Try productId if available and valid
  if (cleanId && cleanId !== 'ID_TBD') {
    try {
      const snap = await getDoc(doc(db, 'store', cleanId));
      if (snap.exists() && snap.data()) {
        const d = snap.data();
        if (d.product_name || d.name) {
          return normalizeProduct(snap.id, d);
        }
      }
    } catch (_) {}

    // Check composite id like {shopId}_{productName}
    if (cleanId.includes('_')) {
      const shopDocId = cleanId.split('_')[0];
      try {
        const snap = await getDoc(doc(db, 'store', shopDocId));
        if (snap.exists() && snap.data()) {
          const d = snap.data();
          if (Array.isArray(d.products)) {
            const found = d.products.find(p => {
              const pName = p.product_name || p.name;
              return cleanId.includes(pName) || (cleanName && pName.toLowerCase() === cleanName.toLowerCase());
            });
            if (found) {
              return normalizeProduct(cleanId, { ...found, shop_id: shopDocId });
            }
          }
        }
      } catch (_) {}
    }
  }

  // 2. Query 'store' collection by product_name
  if (cleanName) {
    try {
      const q = query(collection(db, 'store'), where('product_name', '==', cleanName), limit(1));
      const qSnap = await getDocs(q);
      if (!qSnap.empty) {
        return normalizeProduct(qSnap.docs[0].id, qSnap.docs[0].data());
      }
    } catch (_) {}
  }

  // 3. Scan 'store' collection docs for nested products array or name match
  if (cleanName) {
    try {
      const allStore = await getDocs(query(collection(db, 'store'), limit(50)));
      for (const dSnap of allStore.docs) {
        const d = dSnap.data();
        if (Array.isArray(d.products)) {
          const found = d.products.find(
            p => (p.product_name || p.name || '').toLowerCase().trim() === cleanName.toLowerCase().trim()
          );
          if (found) {
            return normalizeProduct(`${dSnap.id}_${found.product_name || found.name}`, {
              ...found,
              shop_id: dSnap.id
            });
          }
        } else if ((d.product_name || d.name || '').toLowerCase().trim() === cleanName.toLowerCase().trim()) {
          return normalizeProduct(dSnap.id, d);
        }
      }
    } catch (_) {}
  }

  // 4. Construct clean fallback from fallbackData
  return normalizeProduct(cleanId || `prod_${Date.now()}`, {
    product_name: cleanName || 'Ayurvedic Formula',
    price: fallbackData.price ?? 0,
    mrp: fallbackData.mrp ?? fallbackData.original_price ?? fallbackData.originalPrice ?? fallbackData.price ?? 0,
    size: fallbackData.size || fallbackData.variantName || 'Standard',
    packs: fallbackData.packs || (fallbackData.size ? [{ size: fallbackData.size, price: fallbackData.price || 0, mrp: fallbackData.mrp || fallbackData.price || 0 }] : []),
    image_url: fallbackData.imageUrl || fallbackData.image_url || fallbackData.image,
    description: fallbackData.description || '',
    composition: fallbackData.composition || '',
    benefits: fallbackData.benefits || '',
    category: fallbackData.category || 'Wellness',
    shop_id: fallbackData.shop_id || fallbackData.shopId || null,
  });
}
