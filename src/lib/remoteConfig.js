import { app } from "@/lib/firebase/config";
import { loadStripe } from "@stripe/stripe-js";
import { useState, useEffect } from "react";

// Default Fallback Keys matching Firebase project ambe-wellness
const ENV_TEST_KEY =
  (process.env.NEXT_PUBLIC_STRIPE_TEST_PUBLISHABLE_KEY?.startsWith("pk_test_") && process.env.NEXT_PUBLIC_STRIPE_TEST_PUBLISHABLE_KEY) ||
  (process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.startsWith("pk_test_") && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) ||
  null;

const ENV_LIVE_KEY =
  (process.env.NEXT_PUBLIC_STRIPE_LIVE_PUBLISHABLE_KEY?.startsWith("pk_live_") && process.env.NEXT_PUBLIC_STRIPE_LIVE_PUBLISHABLE_KEY) ||
  (process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.startsWith("pk_live_") && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) ||
  null;

const FALLBACK_TEST_PUBLISHABLE_KEY =
  ENV_TEST_KEY ||
  "pk_test_51TFo7UFYfVYw61GifAx6LqxD0ok2yrudljWQbPBKwbp4s7IjbUZxD9Nbi0WMmcKtLSdoK185xVpx1jj5flCeStYg006ZxayVkR";

const FALLBACK_LIVE_PUBLISHABLE_KEY =
  ENV_LIVE_KEY ||
  "pk_live_51PygcsJtXe5lZA1x441sD0qxQUpG8zKsczl49Tow4TDsvjjlprbRcnBbQZQz6pzb1esYoUwiCIbAWJI9DD9HW0rR00tOPRKxE8";

let cachedConfig = {
  isTestMode: false,
  testingStripeKey: "",
  liveStripeKey: "",
  effectiveStripePublishableKey: FALLBACK_LIVE_PUBLISHABLE_KEY,
  initialized: false,
};

let stripePromiseCache = new Map();

/**
 * Loads and returns a cached Stripe Promise for the given publishable key.
 */
export function getStripePromise(isTestMode = false, testingStripeKey = "", liveStripeKey = "") {
  let key;

  if (isTestMode) {
    key =
      (testingStripeKey && testingStripeKey.trim().startsWith("pk_test_"))
        ? testingStripeKey.trim()
        : FALLBACK_TEST_PUBLISHABLE_KEY;
  } else {
    // In live mode, use Remote Config live_stripe_key if set with pk_live_, else fallback
    key =
      (liveStripeKey && liveStripeKey.trim().startsWith("pk_live_"))
        ? liveStripeKey.trim()
        : FALLBACK_LIVE_PUBLISHABLE_KEY;
  }

  if (!stripePromiseCache.has(key)) {
    stripePromiseCache.set(key, loadStripe(key));
  }
  return stripePromiseCache.get(key);
}

/**
 * Initializes Firebase Remote Config in the browser and fetches the latest parameters.
 */
export async function fetchRemotePaymentConfig() {
  if (typeof window === "undefined") {
    return cachedConfig;
  }

  try {
    const { getRemoteConfig, fetchAndActivate, getBoolean, getString } =
      await import("firebase/remote-config");

    const remoteConfig = getRemoteConfig(app);

    // Minimize cache interval for rapid responsiveness
    remoteConfig.settings.minimumFetchIntervalMillis =
      process.env.NODE_ENV === "development" ? 0 : 60000;
    remoteConfig.settings.fetchTimeoutMillis = 10000;

    remoteConfig.defaultConfig = {
      isTestMode: false,
      testing_stripe_key: "",
      live_stripe_key: "",
    };

    await fetchAndActivate(remoteConfig);

    const isTestMode = getBoolean(remoteConfig, "isTestMode");
    const testingStripeKey = getString(remoteConfig, "testing_stripe_key").trim();
    const liveStripeKey = getString(remoteConfig, "live_stripe_key").trim();

    const effectiveStripePublishableKey = isTestMode
      ? (testingStripeKey.startsWith("pk_test_") ? testingStripeKey : FALLBACK_TEST_PUBLISHABLE_KEY)
      : (liveStripeKey.startsWith("pk_live_") ? liveStripeKey : FALLBACK_LIVE_PUBLISHABLE_KEY);

    cachedConfig = {
      isTestMode,
      testingStripeKey,
      liveStripeKey,
      effectiveStripePublishableKey,
      initialized: true,
    };

    return cachedConfig;
  } catch (err) {
    console.warn("[RemoteConfig] Fetch failed or not supported in this environment:", err);
    cachedConfig = {
      ...cachedConfig,
      initialized: true,
    };
    return cachedConfig;
  }
}

/**
 * React Hook for pages to subscribe to the active payment configuration.
 */
export function useRemotePaymentConfig() {
  const [config, setConfig] = useState(cachedConfig);
  const [loading, setLoading] = useState(!cachedConfig.initialized);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const latest = await fetchRemotePaymentConfig();
        if (isMounted) {
          setConfig(latest);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) setLoading(false);
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, []);

  const stripePromise = getStripePromise(config.isTestMode, config.testingStripeKey, config.liveStripeKey);

  return {
    isTestMode: config.isTestMode,
    testingStripeKey: config.testingStripeKey,
    liveStripeKey: config.liveStripeKey,
    effectiveStripePublishableKey: config.effectiveStripePublishableKey,
    stripePromise,
    loading,
  };
}
