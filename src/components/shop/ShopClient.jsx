"use client";
import React, { useMemo, useState } from "react";
import ProductCard from "@/components/shop/ProductCard";
import { CATEGORIES } from "@/lib/shop/products";

const ALL = "All Products";

// Client-side shop: filter pills (pure front-end show/hide) + product grid +
// Buy Now → Stripe Checkout redirect. Products are passed in from the server
// page, which reads them from the catalog module.
export default function ShopClient({ products }) {
  const [activeFilter, setActiveFilter] = useState(ALL);
  const [loadingId, setLoadingId] = useState(null);
  const [error, setError] = useState("");

  const filters = useMemo(() => [ALL, ...CATEGORIES], []);

  const visible = useMemo(() => {
    if (activeFilter === ALL) return products;
    return products.filter((p) => p.category === activeFilter);
  }, [products, activeFilter]);

  async function handleBuy(product) {
    setError("");
    setLoadingId(product.id);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || "Checkout is unavailable right now.");
      }
      // Redirect to Stripe-hosted Checkout.
      window.location.href = data.url;
    } catch (e) {
      setError(e.message);
      setLoadingId(null);
    }
  }

  return (
    <div>
      {/* Filter pills */}
      <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-12">
        {filters.map((f) => {
          const active = f === activeFilter;
          return (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className="px-5 py-2.5 rounded-full text-xs sm:text-sm transition-all duration-200 border cursor-pointer"
              style={
                active
                  ? { backgroundColor: "white", color: "#2E2E2E", borderColor: "#2E2E2E" }
                  : { backgroundColor: "white", color: "#6B6B6B", borderColor: "#E2DDD3" }
              }
            >
              {f}
            </button>
          );
        })}
      </div>

      {error && (
        <p className="text-center text-sm mb-6" style={{ color: "#C2691C" }}>
          {error}
        </p>
      )}

      {/* Product grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {visible.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onBuy={handleBuy}
            loading={loadingId === product.id}
          />
        ))}
      </div>

      {visible.length === 0 && (
        <p className="text-center text-sm mt-10" style={{ color: "#6B6B6B" }}>
          No products in this category yet.
        </p>
      )}
    </div>
  );
}
