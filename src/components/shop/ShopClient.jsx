"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ProductCard from "@/components/shop/ProductCard";
import { fetchShopProductsFromFirestore, sortShopProducts } from "@/lib/shop/firestore-products";
import { useFavorites } from "@/lib/shop/favorites";
import { CONSULT_HREF } from "@/lib/site-config";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

const ALL = "All Products";
const MOST_POPULAR = "Most Popular";
const FAVORITES = "Favorites";
const SORTS = ["Popularity", "Default Order", "Name: A to Z"];

export default function ShopClient({ products: initialProducts = [] }) {
  const { favorites } = useFavorites();
  const [products, setProducts] = useState(initialProducts);
  const [loading, setLoading] = useState(initialProducts.length === 0);
  const [categories, setCategories] = useState([]);
  const [expandedCategoryId, setExpandedCategoryId] = useState(null);
  const [activeFilter, setActiveFilter] = useState(MOST_POPULAR);
  const [activeSubcategory, setActiveSubcategory] = useState(null);
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

  // Listen to Firestore categories (1:1 with Flutter app)
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "categories"),
      (snapshot) => {
        const firestoreCats = snapshot.docs
          .map((doc) => {
            const d = doc.data();
            const subs = Array.isArray(d.subcategories)
              ? d.subcategories.map((s) => String(s || "").trim()).filter(Boolean)
              : [];
            return {
              id: doc.id,
              name: d.name || "",
              subcategories: subs
            };
          })
          .filter((c) => c.name.length > 0);

        setCategories(firestoreCats);
      },
      () => {}
    );

    return () => unsub();
  }, []);

  const catalog = useMemo(() => products, [products]);

  const activeExpandedCategory = useMemo(() => {
    if (!expandedCategoryId) return null;
    return categories.find(c => c.id === expandedCategoryId) || null;
  }, [categories, expandedCategoryId]);

  const visible = useMemo(() => {
    let list = catalog;

    if (activeFilter === FAVORITES) {
      list = catalog.filter((p) => favorites.includes(p.id));
      return sortShopProducts(list, sort);
    }

    if (activeFilter === MOST_POPULAR) {
      return sortShopProducts(list, "Popularity");
    }

    if (activeSubcategory) {
      const sub = activeSubcategory.toLowerCase().trim();
      list = catalog.filter((p) => {
        const cat = (p.category || "").toLowerCase().trim();
        const pSub = (p.subcategory || "").toLowerCase().trim();
        return cat === sub || pSub === sub || cat.includes(sub) || pSub.includes(sub);
      });
      return sortShopProducts(list, sort);
    }

    if (activeFilter !== ALL) {
      const filterLower = activeFilter.toLowerCase().trim();
      list = catalog.filter((p) => {
        const cat = (p.category || "").toLowerCase().trim();
        const sub = (p.subcategory || "").toLowerCase().trim();
        return cat === filterLower || sub === filterLower || cat.includes(filterLower) || sub.includes(filterLower);
      });
    }

    return sortShopProducts(list, sort);
  }, [catalog, activeFilter, activeSubcategory, sort, favorites]);

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
            {/* Standard Filters */}
            <button
              type="button"
              className={`shop-filter-pill${activeFilter === MOST_POPULAR && !activeSubcategory ? " active" : ""}`}
              onClick={() => {
                setActiveFilter(MOST_POPULAR);
                setActiveSubcategory(null);
                setExpandedCategoryId(null);
              }}
              disabled={loading}
            >
              {MOST_POPULAR}
            </button>

            <button
              type="button"
              className={`shop-filter-pill${activeFilter === ALL && !activeSubcategory ? " active" : ""}`}
              onClick={() => {
                setActiveFilter(ALL);
                setActiveSubcategory(null);
                setExpandedCategoryId(null);
              }}
              disabled={loading}
            >
              {ALL}
            </button>

            {/* Categories: Shop By Needs, Shop to Categories */}
            {categories.map((cat) => {
              const subs = cat.subcategories || [];
              const hasSubs = subs.length > 0;
              const isOpen = expandedCategoryId === cat.id;
              const isSubSelected = hasSubs && subs.includes(activeSubcategory);
              const isActive = (activeFilter === cat.name && !activeSubcategory) || isSubSelected || isOpen;

              return (
                <button
                  key={cat.id || cat.name}
                  type="button"
                  className={`shop-filter-pill${isActive ? " active" : ""}`}
                  onClick={() => {
                    if (!hasSubs) {
                      setActiveFilter(cat.name);
                      setActiveSubcategory(null);
                      setExpandedCategoryId(null);
                      return;
                    }
                    setExpandedCategoryId(isOpen ? null : cat.id);
                  }}
                  disabled={loading}
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                >
                  <span>{cat.name}</span>
                  {hasSubs && (
                    <span style={{ fontSize: "10px" }}>{isOpen ? "▲" : "▼"}</span>
                  )}
                </button>
              );
            })}

            {/* Favorites Filter */}
            <button
              type="button"
              className={`shop-filter-pill${activeFilter === FAVORITES ? " active" : ""}`}
              onClick={() => {
                setActiveFilter(FAVORITES);
                setActiveSubcategory(null);
                setExpandedCategoryId(null);
              }}
              disabled={loading}
            >
              {favorites.length > 0 ? `Favorites (${favorites.length})` : FAVORITES}
            </button>

            {/* Sort Dropdown */}
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

          {/* Subcategories Row */}
          {activeExpandedCategory && activeExpandedCategory.subcategories.length > 0 && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "8px",
                marginTop: "12px",
                paddingTop: "12px",
                borderTop: "1px solid var(--hairline)"
              }}
            >
              {activeExpandedCategory.subcategories.map((sub) => {
                const isSelected = activeSubcategory === sub;
                return (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setActiveSubcategory(null);
                        setActiveFilter(activeExpandedCategory.name);
                      } else {
                        setActiveSubcategory(sub);
                        setActiveFilter(activeExpandedCategory.name);
                      }
                    }}
                    style={{
                      borderRadius: "100px",
                      padding: "6px 14px",
                      fontSize: "12px",
                      fontWeight: 500,
                      cursor: "pointer",
                      border: "1px solid var(--hairline)",
                      background: isSelected ? "var(--near-black)" : "#f4f1ea",
                      color: isSelected ? "#fff" : "var(--charcoal)",
                      transition: "all 0.15s ease"
                    }}
                  >
                    {sub}
                  </button>
                );
              })}
            </div>
          )}
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
