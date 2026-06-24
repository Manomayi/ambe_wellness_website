"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ProductCard from "@/components/shop/ProductCard";
import { fetchShopProductsFromFirestore, getCategoriesFromProducts, sortShopProducts } from "@/lib/shop/firestore-products";
import { CONSULT_HREF } from "@/lib/site-config";

const ALL = "All Products";
const SORTS = ["Default Order", "Popularity", "Name: A to Z"];

export default function ShopClient({ products: initialProducts = [] }) {
  const [products, setProducts] = useState(initialProducts);
  const [loading, setLoading] = useState(initialProducts.length === 0);
  const [activeFilter, setActiveFilter] = useState(ALL);
  const [sort, setSort] = useState(SORTS[0]);
  const [loadingId, setLoadingId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const items = await fetchShopProductsFromFirestore();
        if (!cancelled) setProducts(items);
      } catch (e) {
        if (!cancelled) {
          setError(e.message || "Could not load products.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const catalog = useMemo(() => products, [products]);

  const filters = useMemo(
    () => [ALL, ...getCategoriesFromProducts(catalog)],
    [catalog]
  );

  const visible = useMemo(() => {
    const list =
      activeFilter === ALL
        ? catalog
        : catalog.filter((p) => p.category === activeFilter);

    return sortShopProducts(list, sort);
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
                disabled={loading}
              >
                {f}
              </button>
            ))}
            <div className="shop-filter-sort">
              <span>Sort by</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                disabled={loading}
              >
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

          {loading && (
            <p className="text-center text-sm mt-10" style={{ color: "#6b6862" }}>
              Loading products…
            </p>
          )}

          {!loading && (
            <div className="shop-products-grid">
              {visible.map((product, index) => (
                <ProductCard
                  key={`${product.id}-${index}`}
                  product={product}
                  onBuy={handleBuy}
                  loading={loadingId === product.id}
                />
              ))}
            </div>
          )}

          {!loading && catalog.length === 0 && (
            <p className="text-center text-sm mt-10" style={{ color: "#6b6862" }}>
              No products are available right now. Please check back soon.
            </p>
          )}

          {!loading && catalog.length > 0 && visible.length === 0 && (
            <p className="text-center text-sm mt-10" style={{ color: "#6b6862" }}>
              No products in this category yet.
            </p>
          )}
        </div>
      </div>
    </>
  );
}
