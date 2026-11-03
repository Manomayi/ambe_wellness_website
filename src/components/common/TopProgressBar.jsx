"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Sitewide lightweight top navigation progress bar.
 * Gives instant visual feedback the millisecond a user clicks any link,
 * preventing repeated frantic clicking in Safari while the route loads.
 */
export default function TopProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef(null);
  const finishTimerRef = useRef(null);

  // Complete progress whenever the pathname or search parameters change
  useEffect(() => {
    if (visible) {
      setProgress(100);
      if (finishTimerRef.current) clearTimeout(finishTimerRef.current);
      finishTimerRef.current = setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 250);
    }
  }, [pathname, searchParams]);

  // Global click listener to intercept internal link clicks immediately
  useEffect(() => {
    function startProgress() {
      if (finishTimerRef.current) clearTimeout(finishTimerRef.current);
      if (timerRef.current) clearInterval(timerRef.current);

      setVisible(true);
      setProgress(20);

      // Smoothly creep forward while waiting for the route to resolve
      timerRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 85) {
            clearInterval(timerRef.current);
            return prev;
          }
          return prev + Math.random() * 10;
        });
      }, 200);
    }

    function handleClick(e) {
      const target = e.target.closest("a");
      if (!target) return;

      const href = target.getAttribute("href");
      if (!href) return;

      // Ignore anchor jumps, new tabs, tel/mailto, or external domains
      if (
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        target.target === "_blank" ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      ) {
        return;
      }

      // Check if it's an internal link
      try {
        const url = new URL(href, window.location.href);
        if (url.origin === window.location.origin) {
          // If already on the same path with same hash, don't show bar
          if (url.pathname === window.location.pathname && url.search === window.location.search) {
            return;
          }
          startProgress();
        }
      } catch (_) {}
    }

    // Custom event support for imperative router.push()
    function handleCustomStart() {
      startProgress();
    }

    document.addEventListener("click", handleClick, { capture: true });
    window.addEventListener("routeNavigationStart", handleCustomStart);

    return () => {
      document.removeEventListener("click", handleClick, { capture: true });
      window.removeEventListener("routeNavigationStart", handleCustomStart);
      if (timerRef.current) clearInterval(timerRef.current);
      if (finishTimerRef.current) clearTimeout(finishTimerRef.current);
    };
  }, []);

  if (!visible && progress === 0) return null;

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={progress}
      aria-hidden={!visible}
      className="fixed top-0 left-0 right-0 h-[3px] z-[9999] pointer-events-none transition-all duration-200 ease-out"
      style={{
        opacity: visible ? 1 : 0,
        transform: `scaleX(${progress / 100})`,
        transformOrigin: "left center",
        background: "linear-gradient(90deg, #C8996A 0%, #FFD3AC 50%, #C8996A 100%)",
        boxShadow: "0 0 8px rgba(200, 153, 106, 0.7)",
      }}
    />
  );
}
