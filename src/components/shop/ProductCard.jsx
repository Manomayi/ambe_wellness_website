"use client";

import { useState } from "react";
import { formatPrice } from "@/lib/shop/firestore-products";
import ProductDetailSheet from "@/components/shop/ProductDetailSheet";

const FALLBACK_IMAGE = "/images/icons/herbal.png";

export default function ProductCard({ product, onBuy, loading }) {
  const {
    name,
    category,
    subcategory,
    price,
    originalPrice,
    image,
    description,
    credentials = [],
    badge,
    packSize,
  } = product;

  const [wished, setWished] = useState(false);
  const [imgSrc, setImgSrc] = useState(image || FALLBACK_IMAGE);
  const [sheetOpen, setSheetOpen] = useState(false);

  const hasDiscount = typeof originalPrice === "number" && originalPrice > price;
  const percentOff = hasDiscount
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;
  const isNew = typeof badge === "string" && /new/i.test(badge);
  const cornerLabel = badge || (hasDiscount ? `${percentOff}% OFF` : null);

  function openSheet() {
    setSheetOpen(true);
  }

  function onCardKeyDown(e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openSheet();
    }
  }

  return (
    <>
      <article
        className="shop-product-card"
        onClick={openSheet}
        onKeyDown={onCardKeyDown}
        role="button"
        tabIndex={0}
        aria-label={`View details for ${name}`}
      >
        <div className="shop-product-img">
          <img
            src={imgSrc}
            alt={name}
            className="shop-product-image"
            onError={() => setImgSrc(FALLBACK_IMAGE)}
            draggable={false}
          />
          {cornerLabel && (
            <div className={`shop-product-badge${isNew ? " new" : ""}`}>{cornerLabel}</div>
          )}
        </div>

        <button
          type="button"
          className={`shop-fav-btn${wished ? " active" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            setWished((w) => !w);
          }}
          aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
        >
          {wished ? "♥" : "♡"}
        </button>

        <div className="shop-product-info">
          {category && <div className="shop-product-category">{category}</div>}
          <h3 className="shop-product-name">{name}</h3>
          <p className="shop-product-meta">
            {[subcategory, packSize].filter(Boolean).join(" · ")}
          </p>

          <p className="shop-product-desc">
            {description || "Tap to read full product details."}
          </p>

          <div className="shop-product-creds" aria-hidden={credentials.length === 0}>
            {credentials.length > 0
              ? credentials.map((c, i) => (
                  <span key={`${c}-${i}`} className="shop-prod-cred">
                    {c}
                  </span>
                ))
              : null}
          </div>

          <p className="shop-product-dshea">
            * Not evaluated by the FDA. Not intended to diagnose, treat, cure, or prevent disease.
          </p>
        </div>

        <div
          className="shop-product-footer"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          role="presentation"
        >
          <div>
            <div className="shop-price-now">{formatPrice(price)}</div>
            {hasDiscount && <div className="shop-price-was">{formatPrice(originalPrice)}</div>}
          </div>
          <button
            type="button"
            className="shop-buy-btn"
            onClick={() => onBuy?.(product)}
            disabled={loading}
          >
            {loading ? "Redirecting…" : "Buy Now"}
          </button>
        </div>
      </article>

      <ProductDetailSheet
        product={{ ...product, image: imgSrc }}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onBuy={(p) => {
          onBuy?.(p);
          setSheetOpen(false);
        }}
        loading={loading}
      />
    </>
  );
}
