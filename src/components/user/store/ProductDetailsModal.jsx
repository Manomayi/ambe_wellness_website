"use client";
import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/contexts/AuthContext';
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
  PlusIcon,
  MinusIcon,
  CheckIcon,
  XMarkIcon,
  HeartIcon as HeartIconOutline
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';

export default function ProductDetailsModal({
  product,
  isWishlisted,
  onToggleWishlist,
  onClose,
  isDoctor = false,
  isDoctorRecommendation = false,
  onAddToCart,
  displaySize,
  displayQuantity,
}) {
  const { user, userType } = useAuth();
  const effectiveIsDoctor = Boolean(isDoctor || userType === 'doctor');
  const isDoctorReportView = effectiveIsDoctor && !isDoctorRecommendation;
  const [mounted, setMounted] = useState(false);

  // Normalize product properties
  const productName = product?.name || product?.product_name || product?.productName || 'Ayurvedic Formula';
  const productDescription = product?.description || '';
  const productComposition = product?.composition || '';
  const productBenefits = product?.benefits || '';
  const productCategory = product?.category || '';
  const productSubcategory = product?.subcategory || product?.sub_category || '';

  const rawPacks = Array.isArray(product?.packs) ? product.packs : [];
  const rawVariants = Array.isArray(product?.variants) && product.variants.length > 0
    ? product.variants
    : (rawPacks.length > 0
        ? rawPacks.map((p, idx) => ({
            id: `pack_${idx}_${p.size || 'default'}`,
            name: p.size || 'Standard',
            price: parseFloat(p.price ?? p.trp ?? p.offer_price ?? p.mrp) || 0,
            original_price: parseFloat(p.mrp ?? p.original_price ?? p.price) || 0
          }))
        : [{
            id: 'default',
            name: product?.size || product?.variantName || 'Standard',
            price: parseFloat(product?.price) || 0,
            original_price: parseFloat(product?.original_price ?? product?.mrp ?? product?.price) || 0
          }]);

  const variants = rawVariants;
  const [selectedVariant, setSelectedVariant] = useState(variants[0]?.id || '');
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [addedSuccess, setAddedSuccess] = useState(false);

  // Fallback internal wishlist state if parent doesn't provide handlers
  const [internalWishlist, setInternalWishlist] = useState(false);
  const activeWishlisted = isWishlisted !== undefined ? isWishlisted : internalWishlist;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (variants.length > 0 && !selectedVariant) {
      setSelectedVariant(variants[0].id);
    }
  }, [variants, selectedVariant]);

  // Wishlist subscription if isWishlisted is not externally provided
  useEffect(() => {
    if (effectiveIsDoctor || isWishlisted !== undefined || !user || !product?.id) return;
    const wishDocRef = doc(db, 'users', user.uid, 'wishlist', product.id);
    const unsub = onSnapshot(
      wishDocRef,
      (snap) => {
        setInternalWishlist(snap.exists());
      },
      () => {}
    );
    return () => unsub();
  }, [user, product?.id, isWishlisted, effectiveIsDoctor]);

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
  const effectiveSize =
    displaySize ||
    product?.selectedSize ||
    product?.size ||
    (variants.length > 0 ? variants[0].name : '');
  const effectiveQty =
    displayQuantity ||
    product?.selectedQuantity ||
    product?.quantity ||
    product?.qty ||
    1;
  const unitPrice = selectedVariantData?.price || product?.price || 0;
  const unitOriginalPrice = selectedVariantData?.original_price || product?.original_price || product?.mrp || unitPrice;
  const totalPrice = unitPrice * quantity;
  const totalOriginalPrice = unitOriginalPrice * quantity;
  const discount = unitOriginalPrice > unitPrice ? Math.round(((unitOriginalPrice - unitPrice) / unitOriginalPrice) * 100) : 0;

  const displayImage =
    product?.imageUrl ||
    product?.image_url ||
    product?.image ||
    (Array.isArray(product?.imageUrls) ? product.imageUrls[0] : null);

  async function handleToggleWishlist(e) {
    if (e) e.stopPropagation();
    if (onToggleWishlist) {
      onToggleWishlist();
      return;
    }
    if (!user) {
      alert('Please log in to manage your wishlist.');
      return;
    }
    try {
      const wishRef = doc(db, 'users', user.uid, 'wishlist', product.id);
      if (internalWishlist) {
        await deleteDoc(wishRef);
        setInternalWishlist(false);
      } else {
        await setDoc(wishRef, {
          productId: product.id,
          product_id: product.id,
          productName: productName,
          product_name: productName,
          addedAt: new Date()
        });
        setInternalWishlist(true);
      }
    } catch (err) {
      console.error('Error toggling wishlist:', err);
    }
  }

  async function addToCart() {
    const varName = selectedVariantData?.name || product?.size || 'Standard';

    if (onAddToCart) {
      onAddToCart({
        product,
        size: varName,
        quantity,
      });
      setAddedSuccess(true);
      setTimeout(() => {
        setAddedSuccess(false);
        if (onClose) onClose();
      }, 700);
      return;
    }

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
          shop_id: product.shop_id || product.shopId || null,
          shopId: product.shop_id || product.shopId || null,
          productName: productName,
          product_name: productName,
          variantId: varId,
          variantName: varName,
          size: varName,
          has_multiple_sizes: variants.length > 1,
          price: unitPrice,
          originalPrice: unitOriginalPrice,
          mrp: unitOriginalPrice,
          quantity: quantity,
          imageUrl: displayImage,
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

  // Parse subcategories into array of tags
  const subcategoryList = useMemo(() => {
    if (!productSubcategory) return [];
    return productSubcategory
      .split(/;|,/)
      .map(s => s.trim())
      .filter(Boolean);
  }, [productSubcategory]);

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-0 sm:p-4 md:p-6"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-[#1E1E1E] border border-white/15 rounded-t-[28px] sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90dvh] sm:max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Close and Wishlist */}
        <div className="shrink-0 flex items-center justify-between px-5 sm:px-6 py-4 border-b border-white/10 bg-[#1E1E1E]/95 backdrop-blur-sm sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <div className="sm:hidden w-8 h-1 bg-neutral-600 rounded-full mr-2" />
            <span className="text-xs font-semibold text-white/50 tracking-wider uppercase">
              Product Details
            </span>
          </div>
          <div className="flex items-center gap-2">
            {!effectiveIsDoctor && (
              <button
                type="button"
                onClick={handleToggleWishlist}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition cursor-pointer"
                aria-label="Toggle Wishlist"
                title={activeWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
              >
                {activeWishlisted ? (
                  <HeartIconSolid className="w-5 h-5 text-[#FFD3AC]" />
                ) : (
                  <HeartIconOutline className="w-5 h-5 text-white" />
                )}
              </button>
            )}
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
        <div className={`overflow-y-auto min-h-0 flex-1 p-5 sm:p-6 space-y-6 ${effectiveIsDoctor ? 'pb-8 sm:pb-10' : ''}`}>
          {/* Product Image Area */}
          <div className="w-full bg-white rounded-2xl p-6 flex items-center justify-center min-h-[220px] sm:min-h-[260px] relative shadow-inner">
            {displayImage ? (
              <img
                src={displayImage}
                alt={productName}
                className="max-h-52 sm:max-h-60 object-contain"
              />
            ) : (
              <div className="text-center py-10">
                <span className="text-6xl mb-3 block">🌿</span>
                <span className="text-sm font-semibold text-neutral-800">{productName}</span>
              </div>
            )}

            {discount > 0 && !effectiveIsDoctor && (
              <span className="absolute top-4 left-4 bg-[#FFD3AC] text-[#1E1E1E] text-xs font-extrabold px-3 py-1 rounded-full shadow-md">
                {discount}% OFF
              </span>
            )}
          </div>

          {/* Product Title & Category Badges */}
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white leading-snug">
              {productName}
            </h2>

            <div className="flex flex-wrap items-center gap-2 mt-3">
              {productCategory && (
                <span className="text-xs px-3 py-1 rounded-full bg-[#FFD3AC]/15 text-[#FFD3AC] font-medium border border-[#FFD3AC]/30">
                  {productCategory}
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

          {/* Size / Pack Section: Display-only for Doctor Report view, interactive for User and Doctor Recommendation */}
          {isDoctorReportView ? (
            <div className="bg-[#2D2D30] border border-white/10 rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-4">
              {effectiveSize && (
                <div className="flex-1">
                  <span className="text-[11px] uppercase tracking-wider text-[#FFD3AC] font-bold block mb-1">
                    Size
                  </span>
                  <span className="text-sm sm:text-base font-semibold text-white">
                    {effectiveSize}
                  </span>
                </div>
              )}
              {effectiveQty > 0 && (
                <div className={effectiveSize ? "border-l border-white/10 pl-5 sm:pl-6" : ""}>
                  <span className="text-[11px] uppercase tracking-wider text-[#FFD3AC] font-bold block mb-1">
                    Prescribed Quantity
                  </span>
                  <span className="text-sm sm:text-base font-semibold text-white">
                    {effectiveQty}
                  </span>
                </div>
              )}
            </div>
          ) : (
            variants.length > 1 && (
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
                        {!effectiveIsDoctor && v.price ? ` - $${v.price}` : ''}
                      </button>
                    );
                  })}
                </div>
              </div>
            )
          )}

          {/* Quantity Selector (interactive for users and doctor recommendations, hidden for doctor report view) */}
          {!isDoctorReportView && (
            <div className="flex items-center justify-between py-2 border-y border-white/10">
              <span className="text-sm font-semibold text-white">Quantity</span>
              <div className="flex items-center bg-[#2D2D30] border border-white/15 rounded-xl overflow-hidden shadow-inner">
                <button
                  type="button"
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  className="w-10 h-10 flex items-center justify-center text-white hover:bg-white/10 transition disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer active:scale-75"
                  style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
                  aria-label="Decrease quantity"
                >
                  <MinusIcon className="w-4 h-4 stroke-[2.5]" />
                </button>
                <span className="w-10 text-center text-sm font-bold text-white select-none">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(q => q + 1)}
                  className="w-10 h-10 flex items-center justify-center text-white hover:bg-white/10 transition cursor-pointer active:scale-75"
                  style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
                  aria-label="Increase quantity"
                >
                  <PlusIcon className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            </div>
          )}

          {/* Description */}
          {productDescription && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider text-white/80">
                Description
              </h3>
              <p className="text-sm text-white/75 leading-relaxed whitespace-pre-line">
                {productDescription}
              </p>
            </div>
          )}

          {/* FDA Disclaimer Note */}
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
          {productComposition && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider text-white/80">
                Composition
              </h3>
              <p className="text-sm text-white/75 leading-relaxed whitespace-pre-line">
                {productComposition}
              </p>
            </div>
          )}

          {/* Benefits */}
          {productBenefits && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider text-white/80">
                Benefits
              </h3>
              <p className="text-sm text-white/75 leading-relaxed whitespace-pre-line">
                {productBenefits}
              </p>
            </div>
          )}
        </div>

        {/* Sticky Bottom Bar with Total Price & Action Button (hidden for doctor report view) */}
        {!isDoctorReportView && (
          <div className="shrink-0 p-4 sm:p-5 pb-6 sm:pb-5 bg-[#1E1E1E] border-t border-white/10 flex items-center justify-between gap-4 sticky bottom-0 z-20 shadow-2xl safe-area-pb">
            {!effectiveIsDoctor && (
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
            )}

            <button
              type="button"
              onClick={addToCart}
              disabled={adding}
              className={`${
                effectiveIsDoctor ? 'w-full' : 'flex-1 max-w-xs'
              } py-3.5 px-6 rounded-full bg-[#FFD3AC] hover:bg-[#ffe0c4] active:scale-[0.98] text-[#1E1E1E] font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition shadow-lg cursor-pointer disabled:opacity-85`}
              style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
            >
              {addedSuccess ? (
                <>
                  <CheckIcon className="w-5 h-5 stroke-[2.5] text-[#1E1E1E]" />
                  <span>{effectiveIsDoctor ? 'Added to Recommendations!' : 'Added to Cart!'}</span>
                </>
              ) : adding ? (
                <>
                  <div className="w-5 h-5 border-2 border-[#1E1E1E] border-t-transparent rounded-full animate-spin" />
                  <span>Adding...</span>
                </>
              ) : (
                <>
                  <ShoppingCartIcon className="w-5 h-5 stroke-[2]" />
                  <span>
                    {effectiveIsDoctor
                      ? 'ADD TO RECOMMENDATIONS'
                      : 'ADD TO CART'}
                  </span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
