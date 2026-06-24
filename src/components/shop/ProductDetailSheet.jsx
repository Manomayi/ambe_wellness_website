"use client";

import { useEffect } from "react";
import { formatPrice } from "@/lib/shop/firestore-products";

export default function ProductDetailSheet({ product, open, onClose, onBuy, loading }) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === "Escape") onClose?.();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !product) return null;

  const {
    name,
    category,
    subcategory,
    price,
    originalPrice,
    image,
    description,
    credentials = [],
    packSize,
    productLink,
  } = product;

  const hasDiscount = originalPrice > price;

  return (
    <div className="shop-sheet-root" role="presentation" onClick={onClose}>
      <div
        className="shop-sheet-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="shop-sheet-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shop-sheet-handle" aria-hidden="true" />

        <div className="shop-sheet-image-wrap">
          <img src={image} alt={name} className="shop-sheet-image" />
        </div>

        <div className="shop-sheet-body">
          <p className="shop-product-category">{category}</p>
          {subcategory && <p className="shop-sheet-subcategory">{subcategory}</p>}
          <h2 id="shop-sheet-title" className="shop-sheet-title">
            {name}
          </h2>
          {packSize && <p className="shop-sheet-size">{packSize}</p>}

          <p className="shop-sheet-description">{description}</p>

          {credentials.length > 0 && (
            <div className="shop-product-creds shop-sheet-creds">
              {credentials.map((c, i) => (
                <span key={`${c}-${i}`} className="shop-prod-cred">
                  {c}
                </span>
              ))}
            </div>
          )}

          <p className="shop-product-dshea shop-sheet-dshea">
            * Not evaluated by the FDA. Not intended to diagnose, treat, cure, or prevent disease.
          </p>
        </div>

        <div className="shop-sheet-footer">
          <div>
            <div className="shop-price-now">{formatPrice(price)}</div>
            {hasDiscount && (
              <div className="shop-price-was">{formatPrice(originalPrice)}</div>
            )}
          </div>
          <div className="shop-sheet-actions">
            {productLink && (
              <a
                href={productLink}
                target="_blank"
                rel="noopener noreferrer"
                className="shop-sheet-link-btn"
              >
                View Product
              </a>
            )}
            <button
              type="button"
              className="shop-sheet-buy-btn"
              onClick={() => onBuy?.(product)}
              disabled={loading}
            >
              {loading ? "Redirecting…" : "Buy Now"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
