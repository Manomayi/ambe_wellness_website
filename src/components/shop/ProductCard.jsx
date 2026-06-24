"use client";

import { useState } from "react";

const FALLBACK_IMAGE = "/images/icons/herbal.png";

export default function ProductCard({ product, onBuy, loading }) {
  const {
    name,
    category,
    price,
    originalPrice,
    image,
    description,
    credentials = [],
    badge,
  } = product;

  const [wished, setWished] = useState(false);
  const [imgSrc, setImgSrc] = useState(image || FALLBACK_IMAGE);

  const hasDiscount = typeof originalPrice === "number" && originalPrice > price;
  const percentOff = hasDiscount
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;
  const isNew = typeof badge === "string" && /new/i.test(badge);
  const cornerLabel = badge || (hasDiscount ? `${percentOff}% OFF` : null);

  return (
    <article className="shop-product-card">
      <div className="shop-product-img">
        <img
          src={imgSrc}
          alt={name}
          className="shop-product-image"
          onError={() => setImgSrc(FALLBACK_IMAGE)}
        />
        {cornerLabel && (
          <div className={`shop-product-badge${isNew ? " new" : ""}`}>{cornerLabel}</div>
        )}
        <button
          type="button"
          className={`shop-fav-btn${wished ? " active" : ""}`}
          onClick={() => setWished((w) => !w)}
          aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
        >
          {wished ? "♥" : "♡"}
        </button>
      </div>

      <div className="shop-product-info">
        <div className="shop-product-category">{category}</div>
        <h3 className="shop-product-name">{name}</h3>
        <p className="shop-product-desc">{description}</p>

        {credentials.length > 0 && (
          <div className="shop-product-creds">
            {credentials.map((c, i) => (
              <span key={`${c}-${i}`} className="shop-prod-cred">
                {c}
              </span>
            ))}
          </div>
        )}

        <p className="shop-product-dshea">
          * Not evaluated by the FDA. Not intended to diagnose, treat, cure, or prevent disease.
        </p>

        <div className="shop-product-footer">
          <div>
            <div className="shop-price-now">${price}</div>
            {hasDiscount && <div className="shop-price-was">${originalPrice}</div>}
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
      </div>
    </article>
  );
}
