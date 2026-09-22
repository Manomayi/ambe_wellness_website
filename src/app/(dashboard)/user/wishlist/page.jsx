"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import WebLayoutWrapper from '@/components/common/WebLayoutWrapper';
import AmbeBackButton from '@/components/common/AmbeBackButton';
import ProductCard from '@/components/user/store/ProductCard';
import ProductDetailsModal from '@/components/user/store/ProductDetailsModal';
import {
  collection,
  doc,
  getDocs,
  deleteDoc,
  onSnapshot
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import {
  ShoppingCartIcon,
  HeartIcon as HeartIconOutline
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';

export default function UserWishlistPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [wishlistIds, setWishlistIds] = useState(new Set());
  const [cartCount, setCartCount] = useState(0);
  const [selectedProductForDetails, setSelectedProductForDetails] = useState(null);

  // Listen to Cart Count
  useEffect(() => {
    if (!user) return;

    const cartQuery = collection(db, 'users', user.uid, 'cart');
    const unsubscribe = onSnapshot(
      cartQuery,
      (snapshot) => {
        const count = snapshot.docs.reduce((total, doc) => {
          return total + (doc.data().quantity || 0);
        }, 0);
        setCartCount(count);
      },
      (error) => {
        if (error?.code !== 'permission-denied') {
          console.error('Error listening to cart:', error);
        }
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Listen to Wishlist real-time
  useEffect(() => {
    if (!user) {
      setWishlistIds(new Set());
      setLoading(false);
      return;
    }

    const unsubWishlist = onSnapshot(
      collection(db, 'users', user.uid, 'wishlist'),
      (snapshot) => {
        const ids = new Set(snapshot.docs.map(doc => doc.id));
        setWishlistIds(ids);
      },
      (error) => {
        if (error?.code !== 'permission-denied') {
          console.error('Error listening to wishlist:', error);
        }
      }
    );

    return () => unsubWishlist();
  }, [user]);

  // Fetch all store products to match with wishlist
  useEffect(() => {
    async function loadProducts() {
      try {
        const items = [];

        // 1. Try 'store' collection first
        const storeSnap = await getDocs(collection(db, 'store')).catch(() => null);
        if (storeSnap && !storeSnap.empty) {
          storeSnap.forEach((docSnap) => {
            const data = docSnap.data();
            if (data.is_active === false) return;

            const rawProducts = Array.isArray(data.products) ? data.products : [];
            if (rawProducts.length > 0) {
              rawProducts.forEach((prod, prodIdx) => {
                if (prod.is_active === false) return;
                const rawName = prod.product_name || prod.name || `product_${prodIdx}`;
                const uniqueId = `${docSnap.id}_${rawName}`;
                const packs = Array.isArray(prod.packs) ? prod.packs : [];
                const variants = packs.map((pack, idx) => {
                  const packPrice = parseFloat(pack.price ?? pack.trp ?? pack.offer_price ?? pack.mrp) || 0;
                  const packMrp = parseFloat(pack.mrp ?? pack.original_price ?? packPrice) || packPrice;
                  return {
                    id: `pack_${prodIdx}_${idx}_${pack.size || 'default'}`,
                    name: pack.size || 'Standard',
                    price: packPrice,
                    original_price: packMrp
                  };
                });

                const defaultPrice = variants[0]?.price ?? parseFloat(prod.price ?? prod.offer_price ?? prod.mrp) ?? 0;
                const defaultOriginalPrice =
                  variants[0]?.original_price ?? parseFloat(prod.original_price ?? prod.mrp ?? defaultPrice) ?? defaultPrice;

                items.push({
                  id: uniqueId,
                  name: rawName,
                  product_name: rawName,
                  shop_id: docSnap.id,
                  shopId: docSnap.id,
                  variants,
                  price: defaultPrice,
                  original_price: defaultOriginalPrice,
                  category: prod.category || data.category || '',
                  subcategory: prod.subcategory || prod.sub_category || '',
                  imageUrl: prod.image_url || prod.imageUrl || (Array.isArray(prod.image_urls) ? prod.image_urls[0] : null) || null,
                  imageUrls: Array.isArray(prod.image_urls) ? prod.image_urls : (prod.image_url ? [prod.image_url] : (prod.imageUrl ? [prod.imageUrl] : [])),
                  description: prod.description || '',
                  composition: prod.composition || '',
                  benefits: prod.benefits || '',
                  salesCount: Number(prod.sales_count ?? prod.salesCount) || 0,
                  rating: Number(prod.rating ?? prod.avg_rating) || 0,
                  reviewCount: Number(prod.review_count ?? prod.reviewCount) || 0,
                  isActive: prod.is_active !== false
                });
              });
            } else if (data.product_name || data.name) {
              const rawName = data.product_name || data.name;
              const packs = Array.isArray(data.packs) ? data.packs : [];
              const variants = packs.map((pack, idx) => {
                const packPrice = parseFloat(pack.price ?? pack.trp ?? pack.offer_price ?? pack.mrp) || 0;
                const packMrp = parseFloat(pack.mrp ?? pack.original_price ?? packPrice) || packPrice;
                return {
                  id: `pack_${idx}_${pack.size || 'default'}`,
                  name: pack.size || 'Standard',
                  price: packPrice,
                  original_price: packMrp
                };
              });
              const defaultPrice = variants[0]?.price ?? parseFloat(data.price ?? data.offer_price ?? data.mrp) ?? 0;
              const defaultOriginalPrice =
                variants[0]?.original_price ?? parseFloat(data.original_price ?? data.mrp ?? defaultPrice) ?? defaultPrice;

              items.push({
                id: docSnap.id,
                name: rawName,
                product_name: rawName,
                shop_id: docSnap.id,
                shopId: docSnap.id,
                variants,
                price: defaultPrice,
                original_price: defaultOriginalPrice,
                category: data.category || '',
                subcategory: data.subcategory || data.sub_category || '',
                imageUrl: data.image_url || data.imageUrl || (Array.isArray(data.image_urls) ? data.image_urls[0] : null) || null,
                imageUrls: Array.isArray(data.image_urls) ? data.image_urls : (data.image_url ? [data.image_url] : (data.imageUrl ? [data.imageUrl] : [])),
                description: data.description || '',
                composition: data.composition || '',
                benefits: data.benefits || '',
                salesCount: Number(data.sales_count ?? data.salesCount) || 0,
                rating: Number(data.rating ?? data.avg_rating) || 0,
                reviewCount: Number(data.review_count ?? data.reviewCount) || 0,
                isActive: data.is_active !== false
              });
            }
          });
        }

        // 2. Check products collection fallback
        if (items.length === 0) {
          const productsSnap = await getDocs(collection(db, 'products')).catch(() => null);
          if (productsSnap && !productsSnap.empty) {
            productsSnap.forEach((docSnap, docIdx) => {
              const data = docSnap.data();
              if (data.is_active === false) return;
              const rawName = data.name || data.product_name || `product_${docIdx}`;
              const packs = Array.isArray(data.packs) ? data.packs : [];
              const variants = packs.map((pack, idx) => {
                const packPrice = parseFloat(pack.price ?? pack.trp ?? pack.offer_price ?? pack.mrp) || 0;
                const packMrp = parseFloat(pack.mrp ?? pack.original_price ?? packPrice) || packPrice;
                return {
                  id: `pack_${docIdx}_${idx}_${pack.size || 'default'}`,
                  name: pack.size || 'Standard',
                  price: packPrice,
                  original_price: packMrp
                };
              });
              const defaultPrice = variants[0]?.price ?? parseFloat(data.price ?? data.offer_price ?? data.mrp) ?? 0;
              const defaultOriginalPrice =
                variants[0]?.original_price ?? parseFloat(data.original_price ?? data.mrp ?? defaultPrice) ?? defaultPrice;

              items.push({
                id: docSnap.id,
                name: rawName,
                product_name: rawName,
                variants: variants.length > 0 ? variants : (data.variants || []),
                price: defaultPrice,
                original_price: defaultOriginalPrice,
                category: data.category || '',
                subcategory: data.subcategory || data.sub_category || '',
                imageUrl: data.image_url || data.imageUrl || (Array.isArray(data.image_urls) ? data.image_urls[0] : null) || null,
                imageUrls: Array.isArray(data.image_urls) ? data.image_urls : (data.image_url ? [data.image_url] : (data.imageUrl ? [data.imageUrl] : [])),
                description: data.description || '',
                composition: data.composition || '',
                benefits: data.benefits || '',
                salesCount: Number(data.sales_count ?? data.salesCount) || 0,
                rating: Number(data.rating ?? data.avg_rating) || 0,
                reviewCount: Number(data.review_count ?? data.reviewCount) || 0,
                isActive: data.is_active !== false
              });
            });
          }
        }

        setProducts(items);
      } catch (err) {
        console.error('Error loading products for wishlist:', err);
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, []);

  // Filter to wishlisted products
  const wishlistProducts = useMemo(() => {
    return products.filter(p => wishlistIds.has(p.id));
  }, [products, wishlistIds]);

  // Toggle wishlist (remove item)
  async function handleToggleWishlist(product) {
    if (!user) return;

    // Optimistic removal
    const nextSet = new Set(wishlistIds);
    nextSet.delete(product.id);
    setWishlistIds(nextSet);

    try {
      await deleteDoc(doc(db, 'users', user.uid, 'wishlist', product.id));
    } catch (e) {
      console.error('Error removing from wishlist:', e);
    }
  }

  return (
    <ProtectedRoute userType="user">
      <WebLayoutWrapper>
        <div className="space-y-6 pb-36 max-w-7xl mx-auto">
          {/* Header matching Flutter UserWishlistPage */}
          <div className="flex items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-3">
              <AmbeBackButton
                onClick={() => {
                  if (typeof window !== 'undefined' && window.history.length > 1) {
                    router.back();
                  } else {
                    router.push('/user/store');
                  }
                }}
              />
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Wishlist
              </h1>
            </div>

            {/* Cart Button */}
            <button
              onClick={() => router.push('/user/cart')}
              className="relative p-2.5 rounded-full bg-white/10 hover:bg-white/15 text-[#FFD3AC] transition flex items-center justify-center cursor-pointer"
              aria-label="View Cart"
              title="Cart"
            >
              <ShoppingCartIcon className="h-6 w-6" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#FFD3AC] text-[#1E1E1E] w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center shadow-md">
                  {cartCount}
                </span>
              )}
            </button>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFD3AC]" />
            </div>
          ) : wishlistProducts.length === 0 ? (
            /* Empty State matching Flutter UserWishlistPage */
            <div className="bg-[#2D2D30]/60 border border-white/10 rounded-3xl p-12 text-center max-w-md mx-auto space-y-4 my-12">
              <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-neutral-400">
                <HeartIconOutline className="w-10 h-10 stroke-[1.5]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white">
                  Your wishlist is empty
                </h3>
                <p className="text-sm text-neutral-400">
                  Tap the heart icon on products to add them to your wishlist.
                </p>
              </div>
              <div className="pt-2">
                <button
                  onClick={() => router.push('/user/store')}
                  className="px-6 py-3 rounded-full bg-[#FFD3AC] hover:bg-[#ffe0c4] text-[#1E1E1E] font-bold text-sm transition shadow-md cursor-pointer"
                >
                  Continue shopping
                </button>
              </div>
            </div>
          ) : (
            /* Products Grid matching Flutter GridView */
            <div className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {wishlistProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    isWishlisted={true}
                    onToggleWishlist={() => handleToggleWishlist(product)}
                    onOpenDetails={() => setSelectedProductForDetails(product)}
                  />
                ))}
              </div>

              {/* Bottom Actions matching Flutter UserWishlistPage */}
              <div className="fixed bottom-16 md:bottom-6 left-0 right-0 z-40 px-4 max-w-md mx-auto pointer-events-none">
                <div className="pointer-events-auto space-y-2.5 bg-[#1E1E1E]/95 backdrop-blur-md p-4 rounded-2xl border border-white/15 shadow-2xl">
                  <button
                    onClick={() => router.push('/user/cart')}
                    className="w-full py-3 px-6 rounded-full bg-[#FFD3AC] hover:bg-[#ffe0c4] text-[#1E1E1E] font-bold text-sm transition shadow-md cursor-pointer"
                  >
                    Continue to cart
                  </button>
                  <button
                    onClick={() => router.push('/user/store')}
                    className="w-full py-3 px-6 rounded-full bg-white/10 hover:bg-white/15 text-white font-medium text-sm transition cursor-pointer border border-white/10"
                  >
                    Continue shopping
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Product Details Modal */}
          {selectedProductForDetails && (
            <ProductDetailsModal
              product={selectedProductForDetails}
              isWishlisted={wishlistIds.has(selectedProductForDetails.id)}
              onToggleWishlist={() => handleToggleWishlist(selectedProductForDetails)}
              onClose={() => setSelectedProductForDetails(null)}
            />
          )}
        </div>
      </WebLayoutWrapper>
    </ProtectedRoute>
  );
}
