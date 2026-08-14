"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ProductCard from "@/components/shop/ProductCard";
import { fetchShopProductsFromFirestore, getCategoriesFromProducts, sortShopProducts } from "@/lib/shop/firestore-products";
import { useFavorites } from "@/lib/shop/favorites";
import { CONSULT_HREF } from "@/lib/site-config";

const ALL = "All Products";
const MOST_POPULAR = "Most Popular";
const FAVORITES = "Favorites";
const SORTS = ["Popularity", "Default Order", "Name: A to Z"];

export default function ShopClient({ products: initialProducts = [] }) {
  const { favorites } = useFavorites();
  const [products, setProducts] = useState(initialProducts);
  const [loading, setLoading] = useState(initialProducts.length === 0);
  const [activeFilter, setActiveFilter] = useState(MOST_POPULAR);
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

  const filters = useMemo(() => {
    const rawCategories = getCategoriesFromProducts(catalog);
    const setWithoutSpecial = rawCategories.filter(
      (c) => c !== ALL && c !== MOST_POPULAR && c !== FAVORITES
    );
    return [MOST_POPULAR, FAVORITES, ALL, ...setWithoutSpecial];
  }, [catalog]);

  const visible = useMemo(() => {
    let list = catalog;

    if (activeFilter === FAVORITES) {
      list = catalog.filter((p) => favorites.includes(p.id));
      return sortShopProducts(list, sort);
    }

    if (activeFilter === MOST_POPULAR) {
      return sortShopProducts(list, "Popularity");
    }

    if (activeFilter !== ALL) {
      list = catalog.filter((p) => p.category === activeFilter || p.subcategory === activeFilter);
    }

    return sortShopProducts(list, sort);
  }, [catalog, activeFilter, sort, favorites]);

  // Reset loading state when navigating back to the page from Stripe checkout (BFCache / back button)
  useEffect(() => {
    function resetLoading() {
      setLoadingId(null);
    }

    window.addEventListener("pageshow", resetLoading);
    window.addEventListener("focus", resetLoading);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        resetLoading();
      }
    });

    return () => {
      window.removeEventListener("pageshow", resetLoading);
      window.removeEventListener("focus", resetLoading);
    };
  }, []);

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
      // Safety timeout to reset loading state if user returns or navigation cancels
      setTimeout(() => {
        setLoadingId(null);
      }, 3000);
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
            {filters.map((f) => {
              const label =
                f === FAVORITES && favorites.length > 0
                  ? `Favorites (${favorites.length})`
                  : f;
              return (
                <button
                  key={f}
                  type="button"
                  className={`shop-filter-pill${f === activeFilter ? " active" : ""}`}
                  onClick={() => setActiveFilter(f)}
                  disabled={loading}
                >
                  {label}
                </button>
              );
            })}
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
                Book a free consultation and your integrative doctor will build a personalized
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

          {!loading && catalog.length > 0 && activeFilter === FAVORITES && visible.length === 0 && (
            <div className="text-center py-16">
              <div className="text-3xl mb-3" style={{ color: "#C2691C" }}>♡</div>
              <p className="text-base font-medium mb-1" style={{ color: "#353535" }}>
                No favorites saved yet
              </p>
              <p className="text-sm" style={{ color: "#6b6862" }}>
                Click the heart icon on any product card to save it to your favorites list.
              </p>
            </div>
          )}

          {!loading && catalog.length > 0 && activeFilter !== FAVORITES && visible.length === 0 && (
            <p className="text-center text-sm mt-10" style={{ color: "#6b6862" }}>
              No products in this category yet.
            </p>
          )}
        </div>
      </div>
    </>
  );
}
