"use client";

import { Fragment, useMemo, useState } from "react";
import Link from "next/link";
import ProductCard from "@/components/shop/ProductCard";
import { CATEGORIES } from "@/lib/shop/products";
import { CONSULT_HREF } from "@/lib/site-config";

const ALL = "All Products";
const SORTS = ["Featured", "Price: Low to High", "Price: High to Low", "Newest"];

export default function ShopClient({ products }) {
  const [activeFilter, setActiveFilter] = useState(ALL);
  const [sort, setSort] = useState(SORTS[0]);
  const [loadingId, setLoadingId] = useState(null);
  const [error, setError] = useState("");

  const catalog = useMemo(
    () =>
      products.map((product, index) => ({
        ...product,
        id:
          product.id ??
          product.stripePriceId
            ?.replace(/^price_/, "")
            .replace(/_PLACEHOLDER$/, "") ??
          `product-${index}`,
      })),
    [products]
  );

  const filters = useMemo(() => [ALL, ...CATEGORIES], []);

  const visible = useMemo(() => {
    const list =
      activeFilter === ALL
        ? catalog
        : catalog.filter((p) => p.category === activeFilter);

    const sorted = [...list];
    if (sort === "Price: Low to High") sorted.sort((a, b) => a.price - b.price);
    else if (sort === "Price: High to Low") sorted.sort((a, b) => b.price - a.price);
    else if (sort === "Newest")
      sorted.sort(
        (a, b) =>
          (/new/i.test(b.badge || "") ? 1 : 0) - (/new/i.test(a.badge || "") ? 1 : 0)
      );
    return sorted;
  }, [catalog, activeFilter, sort]);

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
      window.location.href = data.url;
    } catch (e) {
      setError(e.message);
      setLoadingId(null);
    }
  }

  return (
    <>
      <div className="shop-filter-bar">
        <div className="shop-wrap">
          <div className="shop-filter-inner">
            {filters.map((f) => (
              <button
                key={f}
                type="button"
                className={`shop-filter-pill${f === activeFilter ? " active" : ""}`}
                onClick={() => setActiveFilter(f)}
              >
                {f}
              </button>
            ))}
            <div className="shop-filter-sort">
              <span>Sort by</span>
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                {SORTS.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="shop-main">
        <div className="shop-wrap">
          <div className="shop-featured-banner">
            <div>
              <div className="shop-eyebrow">Doctor&apos;s Picks</div>
              <h2>
                Not sure where to start? <em>We can help.</em>
              </h2>
              <p>
                Book a free consultation and your Ayurvedic doctor will build a personalized
                remedy protocol for your specific constitution — no guesswork.
              </p>
            </div>
            <Link href={CONSULT_HREF} className="shop-btn">
              Book Free Consult
            </Link>
          </div>

          {error && (
            <p className="text-center text-sm mb-6" style={{ color: "#C2691C" }}>
              {error}
            </p>
          )}

          <div className="shop-products-grid">
            {visible.map((product) => (
              <Fragment key={product.id}>
                <ProductCard
                  product={product}
                  onBuy={handleBuy}
                  loading={loadingId === product.id}
                />
              </Fragment>
            ))}
          </div>

          {visible.length === 0 && (
            <p className="text-center text-sm mt-10" style={{ color: "#6b6862" }}>
              No products in this category yet.
            </p>
          )}
        </div>
      </div>
    </>
  );
}
