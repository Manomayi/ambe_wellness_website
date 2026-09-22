"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import WebLayoutWrapper from '@/components/common/WebLayoutWrapper';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  addDoc,
  updateDoc,
  onSnapshot
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import {
  ShoppingCartIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  MinusIcon,
  AdjustmentsHorizontalIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CheckIcon,
  XMarkIcon,
  HeartIcon as HeartIconOutline
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import ProductCard from '@/components/user/store/ProductCard';
import ProductDetailsModal from '@/components/user/store/ProductDetailsModal';
import FilterModal from '@/components/user/store/FilterModal';

export default function UserStorePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState([]);
  const [cartCount, setCartCount] = useState(0);

  // Product Details Modal
  const [selectedProductForDetails, setSelectedProductForDetails] = useState(null);

  // Categories & Subcategories - directly from Firestore, matching Flutter
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [expandedCategoryId, setExpandedCategoryId] = useState(null);

  // Sorting
  const [sortOption, setSortOption] = useState('Popularity'); // 'Popularity' | 'NameAtoZ' | 'None'
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Wishlist
  const [wishlistIds, setWishlistIds] = useState(new Set());

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
        if (error?.code === 'permission-denied') return;
        console.error('Error listening to cart:', error);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Listen to Wishlist
  useEffect(() => {
    if (!user) {
      setWishlistIds(new Set());
      return;
    }

    const unsubWishlist = onSnapshot(
      collection(db, 'users', user.uid, 'wishlist'),
      (snapshot) => {
        setWishlistIds(new Set(snapshot.docs.map(doc => doc.id)));
      },
      (error) => {
        if (error?.code === 'permission-denied') return;
        console.error('Error listening to wishlist:', error);
      }
    );

    return () => unsubWishlist();
  }, [user]);

  // Listen to Categories directly from Firestore (1:1 with Flutter user_store_page.dart)
  useEffect(() => {
    const unsubCategories = onSnapshot(
      collection(db, 'categories'),
      (snapshot) => {
        const firestoreCats = snapshot.docs
          .map((doc) => {
            const data = doc.data();
            const rawSubs = data.subcategories;
            const subs = Array.isArray(rawSubs)
              ? rawSubs.map((s) => String(s || '').trim()).filter(Boolean)
              : [];
            return {
              id: doc.id,
              name: data.name || '',
              subcategories: subs
            };
          })
          .filter((c) => c.name.length > 0);

        setCategories(firestoreCats);
      },
      (error) => {
        if (error?.code !== 'permission-denied') {
          console.error('Error listening to categories:', error);
        }
      }
    );

    return () => unsubCategories();
  }, []);

  // Fetch Products
  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      const items = [];

      // 1. Try 'store' collection first (matching Flutter mobile app)
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

      // 2. If store was empty, check products collection
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
      setLoading(false);
    } catch (error) {
      if (error?.code !== 'permission-denied') {
        console.error('Error fetching products:', error);
      }
      setLoading(false);
    }
  }

  // Wishlist toggle handler
  async function handleToggleWishlist(product) {
    if (!user) {
      router.push('/login');
      return;
    }

    const isFav = wishlistIds.has(product.id);
    const newSet = new Set(wishlistIds);
    if (isFav) {
      newSet.delete(product.id);
    } else {
      newSet.add(product.id);
    }
    setWishlistIds(newSet);

    try {
      const docRef = doc(db, 'users', user.uid, 'wishlist', product.id);
      if (isFav) {
        await deleteDoc(docRef);
      } else {
        await setDoc(docRef, {
          productId: product.id,
          productName: product.name,
          addedAt: new Date().toISOString()
        });
      }
    } catch (e) {
      if (e?.code !== 'permission-denied') {
        console.error('Error updating wishlist:', e);
      }
    }
  }

  // Active expanded category document
  const activeExpandedCategory = useMemo(() => {
    if (!expandedCategoryId) return null;
    return categories.find(c => c.id === expandedCategoryId) || null;
  }, [categories, expandedCategoryId]);

  // Filter & Sort
  const filteredAndSortedProducts = useMemo(() => {
    const searchLower = search.toLowerCase().trim();

    const filtered = products.filter(p => {
      if (p.isActive === false) return false;

      // Search match
      const matchesSearch =
        !searchLower ||
        (p.name && p.name.toLowerCase().includes(searchLower)) ||
        (p.description && p.description.toLowerCase().includes(searchLower));

      // Category match
      let matchesCategory = true;
      if (selectedCategory && selectedCategory !== 'All') {
        const sel = selectedCategory.toLowerCase().trim();
        const cat = (p.category || '').toLowerCase().trim();
        const sub = (p.subcategory || '').toLowerCase().trim();
        matchesCategory = cat === sel || sub === sel || cat.includes(sel) || sub.includes(sel);
      }

      return matchesSearch && matchesCategory;
    });

    return [...filtered].sort((a, b) => {
      if (sortOption === 'Popularity') {
        const bySales = (b.salesCount || 0) - (a.salesCount || 0);
        if (bySales !== 0) return bySales;
        const byRating = (b.rating || 0) - (a.rating || 0);
        if (byRating !== 0) return byRating;
        const byReviews = (b.reviewCount || 0) - (a.reviewCount || 0);
        if (byReviews !== 0) return byReviews;
        return (a.name || '').localeCompare(b.name || '');
      }
      if (sortOption === 'NameAtoZ') {
        return (a.name || '').localeCompare(b.name || '');
      }
      // 'None': default catalog order
      return 0;
    });
  }, [products, search, selectedCategory, sortOption]);

  if (loading) {
    return (
      <ProtectedRoute userType="user">
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFD3AC]" />
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute userType="user">
      <WebLayoutWrapper>
        <div className="space-y-6 pb-28">
          {/* Page Header */}
          <div className="flex items-center justify-between gap-4 pt-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Store
            </h1>
            <div className="flex items-center gap-2.5">
              {/* Wishlist / Favorites Button */}
              <button
                onClick={() => router.push('/user/wishlist')}
                className="relative p-2.5 rounded-full bg-white/10 hover:bg-white/15 text-[#FFD3AC] transition flex items-center justify-center cursor-pointer"
                aria-label="View Wishlist"
                title="Wishlist"
              >
                <HeartIconSolid className="h-6 w-6 text-[#FFD3AC]" />
                {wishlistIds.size > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#FFD3AC] text-[#1E1E1E] w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center shadow-md">
                    {wishlistIds.size}
                  </span>
                )}
              </button>

              {/* Shopping Cart Button */}
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
          </div>

          {/* Search Bar - White rounded pill matching Flutter */}
          <div className="bg-white rounded-full flex items-center px-4 py-3 shadow-md">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 shrink-0 mr-3" />
            <input
              type="text"
              placeholder="Search for anything..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-transparent text-gray-900 placeholder:text-gray-400 text-sm focus:outline-none"
            />
          </div>

          {/* Filter Bar with Tune Button, All Pill, and Category Pills */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-none">
              {/* Tune / Filter button - circular dark icon button matching Flutter */}
              <button
                onClick={() => setShowFilterModal(true)}
                className="w-11 h-11 rounded-full bg-[#262626] hover:bg-[#333333] border border-white/10 flex items-center justify-center shrink-0 text-white transition cursor-pointer shadow-sm"
                aria-label="Sort options"
                title="Sort options"
              >
                <AdjustmentsHorizontalIcon className="w-5 h-5" />
              </button>

              {/* 'All' category pill */}
              <button
                onClick={() => {
                  setSelectedCategory('All');
                  setExpandedCategoryId(null);
                }}
                className={`px-6 py-2.5 rounded-full text-sm font-semibold transition shrink-0 cursor-pointer shadow-sm ${
                  selectedCategory === 'All'
                    ? 'bg-[#FFD3AC] text-[#1E1E1E]'
                    : 'bg-[#262626] text-white hover:bg-[#333333] border border-white/10'
                }`}
              >
                All
              </button>

              {/* Dynamic Category Pills (Shop By Needs, Shop to Categories, etc.) */}
              {categories.map((cat) => {
                const subs = cat.subcategories || [];
                const hasSubs = subs.length > 0;
                const isOpen = expandedCategoryId === cat.id;
                const subSelected = hasSubs && subs.includes(selectedCategory);
                const isHighlighted = isOpen || subSelected || selectedCategory === cat.name;

                return (
                  <button
                    key={cat.id || cat.name}
                    onClick={() => {
                      if (!hasSubs) {
                        setSelectedCategory(cat.name);
                        setExpandedCategoryId(null);
                        return;
                      }
                      setExpandedCategoryId(isOpen ? null : cat.id);
                    }}
                    className={`px-6 py-2.5 rounded-full text-sm font-semibold transition shrink-0 cursor-pointer flex items-center gap-2 shadow-sm ${
                      isHighlighted
                        ? 'bg-[#FFD3AC] text-[#1E1E1E]'
                        : 'bg-[#262626] text-white hover:bg-[#333333] border border-white/10'
                    }`}
                  >
                    <span>{cat.name}</span>
                    {hasSubs && (
                      isOpen ? (
                        <ChevronUpIcon className="w-4 h-4 stroke-[2.5]" />
                      ) : (
                        <ChevronDownIcon className="w-4 h-4 stroke-[2.5]" />
                      )
                    )}
                  </button>
                );
              })}
            </div>

            {/* Expanded Subcategory Pills Wrap Row */}
            {activeExpandedCategory && activeExpandedCategory.subcategories.length > 0 && (
              <div className="flex flex-wrap gap-2.5 pt-1">
                {activeExpandedCategory.subcategories.map((sub) => {
                  const isSelected = selectedCategory === sub;
                  return (
                    <button
                      key={sub}
                      onClick={() => setSelectedCategory(sub)}
                      className={`px-5 py-2 rounded-full text-xs font-semibold transition cursor-pointer shadow-sm ${
                        isSelected
                          ? 'bg-[#FFD3AC] text-[#1E1E1E]'
                          : 'bg-[#2D2D30] text-white hover:bg-[#353538] border border-white/10'
                      }`}
                    >
                      {sub}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Products Grid */}
          {filteredAndSortedProducts.length === 0 ? (
            <div className="text-center py-16 bg-[#2D2D30]/85 border border-white/10 rounded-2xl backdrop-blur-md">
              <p className="text-white/60 text-sm">No products match your filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
              {filteredAndSortedProducts.map((product, index) => (
                <ProductCard
                  key={`${product.id}-${index}`}
                  product={product}
                  isWishlisted={wishlistIds.has(product.id)}
                  onToggleWishlist={() => handleToggleWishlist(product)}
                  onOpenDetails={() => setSelectedProductForDetails(product)}
                />
              ))}
            </div>
          )}

          {/* Sort By Modal - matching Flutter filter_modal.dart 1:1 */}
          <FilterModal
            isOpen={showFilterModal}
            currentSortOption={sortOption}
            onApply={setSortOption}
            onClose={() => setShowFilterModal(false)}
          />

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