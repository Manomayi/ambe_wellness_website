"use client";

import { useEffect, useState } from "react";
import { doc, setDoc, deleteDoc, getDocs, collection } from "firebase/firestore";
import { db, auth } from "@/lib/firebase/config";

const STORAGE_KEY = "ambe_shop_favorites";

export function getLocalFavorites() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function setLocalFavorites(ids) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    window.dispatchEvent(new Event("ambe-favorites-updated"));
  } catch (e) {
    console.error("Failed to save favorites to localStorage:", e);
  }
}

export async function toggleFavorite(productId) {
  if (!productId) return false;
  const current = getLocalFavorites();
  const exists = current.includes(productId);
  const updated = exists ? current.filter((id) => id !== productId) : [...current, productId];
  setLocalFavorites(updated);

  // If user is authenticated in Firebase, sync to Firestore
  const user = auth.currentUser;
  if (user?.uid) {
    try {
      const favRef = doc(db, "users", user.uid, "favorites", productId);
      if (exists) {
        await deleteDoc(favRef);
      } else {
        await setDoc(favRef, {
          productId,
          createdAt: new Date().toISOString(),
        });
      }
    } catch (e) {
      console.log("Could not sync favorite to Firestore:", e);
    }
  }

  return !exists;
}

export function useFavorites() {
  const [favorites, setFavorites] = useState(getLocalFavorites);

  useEffect(() => {
    function handleUpdate() {
      setFavorites(getLocalFavorites());
    }

    window.addEventListener("ambe-favorites-updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);

    // Initial sync with Firestore if user is logged in
    const user = auth.currentUser;
    if (user?.uid) {
      getDocs(collection(db, "users", user.uid, "favorites"))
        .then((snap) => {
          if (!snap.empty) {
            const firestoreIds = snap.docs.map((d) => d.id);
            const merged = Array.from(new Set([...getLocalFavorites(), ...firestoreIds]));
            setLocalFavorites(merged);
            setFavorites(merged);
          }
        })
        .catch(() => {});
    }

    return () => {
      window.removeEventListener("ambe-favorites-updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const isFavorite = (productId) => favorites.includes(productId);

  return {
    favorites,
    isFavorite,
    toggle: toggleFavorite,
  };
}
