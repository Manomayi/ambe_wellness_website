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
            <button
              onClick={() => router.push('/user/cart')}
              className="relative p-2.5 rounded-full bg-white/10 hover:bg-white/15 text-[#FFD3AC] transition flex items-center justify-center cursor-pointer"
              aria-label="View Cart"
            >
              <ShoppingCartIcon className="h-6 w-6" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#FFD3AC] text-[#1E1E1E] w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center shadow-md">
                  {cartCount}
                </span>
              )}
            </button>
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
          {showFilterModal && (
            <div
              className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
              onClick={() => setShowFilterModal(false)}
            >
              <div
                className="w-full sm:max-w-md bg-[#1E1E1E] border border-white/10 rounded-t-[30px] sm:rounded-3xl p-6 shadow-2xl text-white"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Mobile Drag Bar Handle */}
                <div className="sm:hidden w-12 h-1 bg-neutral-600 rounded-full mx-auto mb-4" />

                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white">Sort By</h2>
                  <button
                    onClick={() => setShowFilterModal(false)}
                    className="p-1 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition cursor-pointer"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-3">
                  {[
                    { value: 'Popularity', label: 'Best Sellers' },
                    { value: 'NameAtoZ', label: 'Name: A to Z' },
                    { value: 'None', label: 'Default Order' }
                  ].map((opt) => {
                    const isSelected = sortOption === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => {
                          setSortOption(opt.value);
                          setShowFilterModal(false);
                        }}
                        className={`w-full flex items-center justify-between p-4 rounded-xl text-left transition cursor-pointer ${
                          isSelected
                            ? 'bg-[#FFD3AC] text-[#1E1E1E] font-semibold'
                            : 'bg-[#2D2D30] text-white hover:bg-[#38383c]'
                        }`}
                      >
                        <span className="text-base">{opt.label}</span>
                        {isSelected && <CheckIcon className="w-5 h-5 stroke-[2.5]" />}
                      </button>
                    );
                  })}
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

function ProductCard({ product, isWishlisted, onToggleWishlist, onOpenDetails }) {
  const { user } = useAuth();
  const variants = product.variants || [];
  const [selectedVariant, setSelectedVariant] = useState(variants[0]?.id || '');
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (variants.length > 0 && !selectedVariant) {
      setSelectedVariant(variants[0].id);
    }
  }, [variants, selectedVariant]);

  const selectedVariantData = variants.find(v => v.id === selectedVariant) || variants[0];
  const price = selectedVariantData?.price || product.price || 0;
  const originalPrice = selectedVariantData?.original_price || product.original_price || price;
  const discount = originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;

  async function addToCart() {
    if (!user) {
      alert('Please log in to add items to your cart.');
      return;
    }

    if (variants.length > 0 && !selectedVariant && !selectedVariantData) {
      alert('Please select a variant');
      return;
    }

    setAdding(true);
    try {
      const cartRef = collection(db, 'users', user.uid, 'cart');
      const varId = selectedVariant || selectedVariantData?.id || 'default';
      const varName = selectedVariantData?.name || 'Standard';

      const q = query(
        cartRef,
        where('productId', '==', product.id),
        where('variantId', '==', varId)
      );

      const snap = await getDocs(q);

      if (!snap.empty) {
        const docRef = snap.docs[0].ref;
        const currentQty = snap.docs[0].data().quantity || 1;
        await updateDoc(docRef, {
          quantity: currentQty + quantity,
          price: price,
          updatedAt: new Date()
        });
      } else {
        await addDoc(cartRef, {
          productId: product.id,
          product_id: product.id,
          productName: product.name,
          product_name: product.name,
          variantId: varId,
          variantName: varName,
          size: varName,
          price: price,
          originalPrice: originalPrice,
          mrp: originalPrice,
          quantity: quantity,
          imageUrl: product.imageUrl,
          addedAt: new Date()
        });
      }

      setQuantity(1);
      alert(`${product.name} added to cart!`);
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Failed to add to cart. Please try again.');
    } finally {
      setAdding(false);
    }
  }

  return (
    <div
      onClick={onOpenDetails}
      className="bg-black/50 border border-white/15 rounded-[20px] overflow-hidden hover:border-[#FFD3AC]/50 transition flex flex-col justify-between shadow-xl backdrop-blur-md cursor-pointer group"
    >
      {/* Product Image Area */}
      <div className="w-full bg-gradient-to-b from-neutral-800 to-neutral-700 relative flex items-center justify-center p-6 h-48 sm:h-52 overflow-hidden">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="max-w-full max-h-full object-contain transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="text-center px-4">
            <span className="text-4xl mb-2 block">🌿</span>
            <span className="text-xs font-semibold text-[#FFD3AC] line-clamp-2">{product.name}</span>
          </div>
        )}

        {/* Discount Badge */}
        {discount > 0 && (
          <span className="absolute top-3 left-3 bg-[#FFD3AC] text-[#1E1E1E] text-[10px] font-bold px-2.5 py-1 rounded-full shadow-md">
            {discount}% OFF
          </span>
        )}

        {/* Wishlist / Favorite Button matching Flutter */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleWishlist();
          }}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm border border-white/10 flex items-center justify-center transition cursor-pointer z-10"
          aria-label="Toggle Wishlist"
        >
          {isWishlisted ? (
            <HeartIconSolid className="w-5 h-5 text-[#FFD3AC]" />
          ) : (
            <HeartIconOutline className="w-5 h-5 text-white" />
          )}
        </button>
      </div>

      {/* Product Info */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <h3 className="font-bold text-sm sm:text-base text-white line-clamp-2 leading-snug mb-1 group-hover:text-[#FFD3AC] transition-colors">
            {product.name}
          </h3>

          {/* Variant Selection */}
          {variants.length > 1 && (
            <div className="mt-2" onClick={(e) => e.stopPropagation()}>
              <select
                value={selectedVariant}
                onChange={e => setSelectedVariant(e.target.value)}
                className="w-full p-2 border border-white/15 bg-[#2D2D30] rounded-xl focus:outline-none focus:border-[#FFD3AC] text-xs text-white font-medium cursor-pointer"
              >
                {variants.map((variant, vIdx) => (
                  <option
                    key={`${variant.id || 'variant'}-${vIdx}`}
                    value={variant.id}
                    className="bg-[#1E1E1E] text-white"
                  >
                    {variant.name} - ${variant.price}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Bottom Price & Add to Cart Row */}
        <div className="flex items-center justify-between pt-2 border-t border-white/10">
          <div>
            <div className="text-lg font-bold text-white leading-none">
              ${price.toFixed(2)}
            </div>
            {originalPrice > price && (
              <span className="text-xs text-white/50 line-through">
                ${originalPrice.toFixed(2)}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              addToCart();
            }}
            disabled={adding}
            className="w-10 h-10 rounded-full bg-[#FFD3AC] hover:bg-[#ffe0c4] text-[#1E1E1E] flex items-center justify-center transition shadow-md cursor-pointer disabled:opacity-50 shrink-0"
            aria-label="Add to Cart"
          >
            <PlusIcon className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>
      </div>
    </div>
  );
}

function ProductDetailsModal({ product, isWishlisted, onToggleWishlist, onClose }) {
  const { user } = useAuth();
  const variants = product.variants || [];
  const [selectedVariant, setSelectedVariant] = useState(variants[0]?.id || '');
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [addedSuccess, setAddedSuccess] = useState(false);

  useEffect(() => {
    if (variants.length > 0 && !selectedVariant) {
      setSelectedVariant(variants[0].id);
    }
  }, [variants, selectedVariant]);

  // Lock body scroll when modal is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const selectedVariantData = variants.find(v => v.id === selectedVariant) || variants[0];
  const unitPrice = selectedVariantData?.price || product.price || 0;
  const unitOriginalPrice = selectedVariantData?.original_price || product.original_price || unitPrice;
  const totalPrice = unitPrice * quantity;
  const totalOriginalPrice = unitOriginalPrice * quantity;
  const discount = unitOriginalPrice > unitPrice ? Math.round(((unitOriginalPrice - unitPrice) / unitOriginalPrice) * 100) : 0;

  async function addToCart() {
    if (!user) {
      alert('Please log in to add items to your cart.');
      return;
    }

    if (variants.length > 0 && !selectedVariant && !selectedVariantData) {
      alert('Please select a size');
      return;
    }

    setAdding(true);
    try {
      const cartRef = collection(db, 'users', user.uid, 'cart');
      const varId = selectedVariant || selectedVariantData?.id || 'default';
      const varName = selectedVariantData?.name || 'Standard';

      const q = query(
        cartRef,
        where('productId', '==', product.id),
        where('variantId', '==', varId)
      );

      const snap = await getDocs(q);

      if (!snap.empty) {
        const docRef = snap.docs[0].ref;
        const currentQty = snap.docs[0].data().quantity || 1;
        await updateDoc(docRef, {
          quantity: currentQty + quantity,
          price: unitPrice,
          updatedAt: new Date()
        });
      } else {
        await addDoc(cartRef, {
          productId: product.id,
          product_id: product.id,
          productName: product.name,
          product_name: product.name,
          variantId: varId,
          variantName: varName,
          size: varName,
          price: unitPrice,
          originalPrice: unitOriginalPrice,
          mrp: unitOriginalPrice,
          quantity: quantity,
          imageUrl: product.imageUrl,
          addedAt: new Date()
        });
      }

      setAddedSuccess(true);
      setTimeout(() => {
        setAddedSuccess(false);
      }, 2500);
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Failed to add to cart. Please try again.');
    } finally {
      setAdding(false);
    }
  }

  // Parse subcategories into array of tags if string with semicolons or commas
  const subcategoryList = useMemo(() => {
    if (!product.subcategory) return [];
    return product.subcategory
      .split(/;|,/)
      .map(s => s.trim())
      .filter(Boolean);
  }, [product.subcategory]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-md p-0 sm:p-4 md:p-6"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-[#1E1E1E] border border-white/15 rounded-t-[28px] sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Close and Wishlist */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-white/10 bg-[#1E1E1E]/95 backdrop-blur-sm sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <div className="sm:hidden w-8 h-1 bg-neutral-600 rounded-full mr-2" />
            <span className="text-xs font-semibold text-white/50 tracking-wider uppercase">
              Product Details
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onToggleWishlist}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition cursor-pointer"
              aria-label="Toggle Wishlist"
            >
              {isWishlisted ? (
                <HeartIconSolid className="w-5 h-5 text-[#FFD3AC]" />
              ) : (
                <HeartIconOutline className="w-5 h-5 text-white" />
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition cursor-pointer text-white/70 hover:text-white"
              aria-label="Close"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Modal Content */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-6 flex-1">
          {/* Product Image Area */}
          <div className="w-full bg-white rounded-2xl p-6 flex items-center justify-center min-h-[240px] sm:min-h-[280px] relative shadow-inner">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="max-h-56 sm:max-h-64 object-contain"
              />
            ) : (
              <div className="text-center py-10">
                <span className="text-6xl mb-3 block">🌿</span>
                <span className="text-sm font-semibold text-neutral-800">{product.name}</span>
              </div>
            )}

            {discount > 0 && (
              <span className="absolute top-4 left-4 bg-[#FFD3AC] text-[#1E1E1E] text-xs font-extrabold px-3 py-1 rounded-full shadow-md">
                {discount}% OFF
              </span>
            )}
          </div>

          {/* Product Title & Category Badges */}
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white leading-snug">
              {product.name}
            </h2>

            <div className="flex flex-wrap items-center gap-2 mt-3">
              {product.category && (
                <span className="text-xs px-3 py-1 rounded-full bg-[#FFD3AC]/15 text-[#FFD3AC] font-medium border border-[#FFD3AC]/30">
                  {product.category}
                </span>
              )}
              {subcategoryList.map((sub, sIdx) => (
                <span
                  key={sIdx}
                  className="text-xs px-3 py-1 rounded-full bg-white/5 text-white/80 font-medium border border-white/10"
                >
                  {sub}
                </span>
              ))}
            </div>
          </div>

          {/* Size / Pack Selection */}
          {variants.length > 1 && (
            <div className="space-y-3">
              <label className="text-sm font-semibold text-white block">
                Select Size
              </label>
              <div className="flex flex-wrap gap-2.5">
                {variants.map((v, vIdx) => {
                  const isSelected = (selectedVariant === v.id) || (!selectedVariant && vIdx === 0);
                  return (
                    <button
                      key={v.id || vIdx}
                      type="button"
                      onClick={() => setSelectedVariant(v.id)}
                      className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer border ${
                        isSelected
                          ? 'bg-[#FFD3AC] text-[#1E1E1E] border-[#FFD3AC] shadow-md scale-[1.02]'
                          : 'bg-[#2D2D30] text-white/90 border-white/10 hover:border-white/30 hover:bg-[#38383c]'
                      }`}
                    >
                      {v.name}
                      {v.price ? ` - $${v.price}` : ''}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity Selector */}
          <div className="flex items-center justify-between py-2 border-y border-white/10">
            <span className="text-sm font-semibold text-white">Quantity</span>
            <div className="flex items-center bg-[#2D2D30] border border-white/15 rounded-xl overflow-hidden shadow-inner">
              <button
                type="button"
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                className="w-10 h-10 flex items-center justify-center text-white hover:bg-white/10 transition disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer"
                aria-label="Decrease quantity"
              >
                <MinusIcon className="w-4 h-4 stroke-[2.5]" />
              </button>
              <span className="w-10 text-center text-sm font-bold text-white">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity(q => q + 1)}
                className="w-10 h-10 flex items-center justify-center text-white hover:bg-white/10 transition cursor-pointer"
                aria-label="Increase quantity"
              >
                <PlusIcon className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </div>

          {/* Description */}
          {product.description && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider text-white/80">
                Description
              </h3>
              <p className="text-sm text-white/75 leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </div>
          )}

          {/* FDA Disclaimer Note matching Flutter FdaDisclaimerNote */}
          <div className="w-full bg-[#2D2D30]/80 rounded-xl border border-white/10 overflow-hidden shadow-md">
            <div className="w-10 h-1 bg-[#FFD3AC] ml-4 mt-0 rounded-b" />
            <div className="p-4 pt-3 space-y-1.5">
              <h4 className="text-[11px] font-bold text-[#FFD3AC] tracking-wider uppercase">
                FDA Disclaimer
              </h4>
              <p className="text-xs text-white/60 leading-relaxed">
                These statements have not been evaluated by the Food and Drug Administration. This product is not intended to diagnose, treat, cure, or prevent any disease.
              </p>
            </div>
          </div>

          {/* Composition */}
          {product.composition && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider text-white/80">
                Composition
              </h3>
              <p className="text-sm text-white/75 leading-relaxed whitespace-pre-line">
                {product.composition}
              </p>
            </div>
          )}

          {/* Benefits */}
          {product.benefits && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider text-white/80">
                Benefits
              </h3>
              <p className="text-sm text-white/75 leading-relaxed whitespace-pre-line">
                {product.benefits}
              </p>
            </div>
          )}
        </div>

        {/* Sticky Bottom Bar with Total Price & Add to Cart */}
        <div className="p-4 sm:p-5 bg-[#1E1E1E] border-t border-white/10 flex items-center justify-between gap-4 sticky bottom-0 z-20 shadow-2xl">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-white/50 block font-medium">
              Total Price
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-white">
                ${totalPrice.toFixed(2)}
              </span>
              {totalOriginalPrice > totalPrice && (
                <span className="text-xs text-white/40 line-through">
                  ${totalOriginalPrice.toFixed(2)}
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={addToCart}
            disabled={adding}
            className="flex-1 max-w-xs py-3.5 px-6 rounded-full bg-[#FFD3AC] hover:bg-[#ffe0c4] text-[#1E1E1E] font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition shadow-lg cursor-pointer disabled:opacity-50"
          >
            {addedSuccess ? (
              <>
                <CheckIcon className="w-5 h-5 stroke-[2.5] text-[#1E1E1E]" />
                <span>Added to Cart!</span>
              </>
            ) : (
              <>
                <ShoppingCartIcon className="w-5 h-5 stroke-[2]" />
                <span>{adding ? 'Adding...' : 'Add to Cart'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}