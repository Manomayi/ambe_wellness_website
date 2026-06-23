"use client";
import React, { useState } from "react";
import Image from "next/image";

// Single product card for the /shop grid, styled to the ambe-shop-final
// reference: badge + wishlist heart, cream image well, peach category kicker,
// serif name + price, outlined credential pills, italic FDA line, and an
// understated BUY NOW. Cormorant Garamond serif for the name/price.
const ACCENT = "#C8996A";

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

  const hasDiscount =
    typeof originalPrice === "number" && originalPrice > price;
  const percentOff = hasDiscount
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;
  const cornerLabel = badge || (hasDiscount ? `${percentOff}% Off` : null);

  return (
    <div className="flex flex-col bg-white rounded-2xl border border-[#ECE7DE] p-5 sm:p-6 h-full">
      {/* Top row — badge + wishlist heart */}
      <div className="flex items-start justify-between mb-3">
        <span
          className="text-[11px] font-medium tracking-[0.18em] uppercase"
          style={{ color: "#9A948B" }}
        >
          {cornerLabel}
        </span>
        <button
          type="button"
          onClick={() => setWished((w) => !w)}
          aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
          className="w-9 h-9 rounded-full border border-[#ECE7DE] flex items-center justify-center transition-colors hover:border-[#C8996A] cursor-pointer"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill={wished ? ACCENT : "none"}
            stroke={wished ? ACCENT : "#9A948B"}
            strokeWidth="1.8"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
      </div>

      {/* Image well — cream background */}
      <div
        className="relative flex items-center justify-center rounded-xl mb-5 aspect-square"
        style={{ backgroundColor: "#F4F1EA" }}
      >
        <Image
          src={image}
          alt={name}
          width={200}
          height={200}
          className="object-contain w-28 h-28 sm:w-36 sm:h-36 opacity-90"
        />
      </div>

      {/* Category kicker */}
      <div
        className="text-[11px] font-medium tracking-[0.18em] uppercase mb-2"
        style={{ color: ACCENT }}
      >
        {category}
      </div>

      {/* Name — serif */}
      <h3
        className="text-2xl mb-3"
        style={{ fontFamily: "'Cormorant Garamond', serif", color: "#2E2E2E", fontWeight: 600 }}
      >
        {name}
      </h3>

      <p className="text-sm leading-relaxed mb-4" style={{ color: "#6B6B6B" }}>
        {description}
      </p>

      {/* Credential pills — outlined rounded tags */}
      {credentials.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {credentials.map((c) => (
            <span
              key={c}
              className="text-[11px] px-3 py-1 rounded-full border"
              style={{ borderColor: "#E2DDD3", color: "#5B554D" }}
            >
              {c}
            </span>
          ))}
        </div>
      )}

      {/* FDA disclaimer — italic line (required on every card) */}
      <p className="text-[11px] italic leading-snug mb-4" style={{ color: "#A8A29A" }}>
        * Not evaluated by the FDA. Not intended to diagnose, treat, cure, or
        prevent disease.
      </p>

      {/* Price + Buy Now (pushed to bottom) */}
      <div className="mt-auto pt-4 border-t border-[#EFEAE0] flex items-end justify-between">
        <div className="flex flex-col">
          <span
            className="text-3xl leading-none"
            style={{ fontFamily: "'Cormorant Garamond', serif", color: "#2E2E2E", fontWeight: 600 }}
          >
            ${price}
          </span>
          {hasDiscount && (
            <span
              className="text-sm line-through mt-1"
              style={{ color: "#B5AFA6" }}
            >
              ${originalPrice}
            </span>
          )}
        </div>

        <button
          onClick={() => onBuy?.(product)}
          disabled={loading}
          className="text-xs font-medium tracking-[0.18em] uppercase pb-1 border-b transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          style={{ color: loading ? "#9A948B" : "#2E2E2E", borderColor: "#C8996A" }}
        >
          {loading ? "Redirecting…" : "Buy Now"}
        </button>
      </div>
    </div>
  );
}
