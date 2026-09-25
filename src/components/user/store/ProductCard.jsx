"use client";

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  collection,
  doc,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import {
  PlusIcon,
  CheckIcon,
  HeartIcon as HeartIconOutline
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';

export default function ProductCard({ product, isWishlisted, onToggleWishlist, onOpenDetails }) {
  const { user } = useAuth();
  const variants = product.variants || [];
  const [selectedVariant, setSelectedVariant] = useState(variants[0]?.id || '');
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const addingRef = useRef(false);

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

    if (addingRef.current) return;
    addingRef.current = true;
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
          shop_id: product.shop_id || product.shopId || null,
          shopId: product.shop_id || product.shopId || null,
          productName: product.name,
          product_name: product.name,
          variantId: varId,
          variantName: varName,
          size: varName,
          has_multiple_sizes: variants.length > 1,
          price: price,
          originalPrice: originalPrice,
          mrp: originalPrice,
          quantity: quantity,
          imageUrl: product.imageUrl,
          addedAt: new Date()
        });
      }

      setQuantity(1);
      setJustAdded(true);
      setTimeout(() => {
        setJustAdded(false);
      }, 1500);
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Failed to add to cart. Please try again.');
    } finally {
      addingRef.current = false;
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

        {/* Wishlist / Favorite Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleWishlist();
          }}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm border border-white/10 flex items-center justify-center transition cursor-pointer z-10"
          aria-label="Toggle Wishlist"
          title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
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
              e.preventDefault();
              e.stopPropagation();
              addToCart();
            }}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 shadow-md cursor-pointer shrink-0 active:scale-90 ${
              justAdded
                ? 'bg-emerald-500 text-white scale-105 shadow-emerald-500/30'
                : 'bg-[#FFD3AC] hover:bg-[#ffe0c4] text-[#1E1E1E]'
            }`}
            style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
            aria-label={justAdded ? 'Added to Cart' : 'Add to Cart'}
            title={justAdded ? 'Added!' : 'Add to Cart'}
          >
            {justAdded ? (
              <CheckIcon className="w-5 h-5 stroke-[2.5]" />
            ) : adding ? (
              <div className="w-4 h-4 border-2 border-[#1E1E1E] border-t-transparent rounded-full animate-spin" />
            ) : (
              <PlusIcon className="w-5 h-5 stroke-[2.5]" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
