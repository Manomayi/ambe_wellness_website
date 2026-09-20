"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase/config";
import { onAuthStateChanged, updateProfile } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import AmbeBackButton from "@/components/common/AmbeBackButton";
import AmbeButton from "@/components/common/AmbeButton";
import AmbeTextField from "@/components/common/AmbeTextField";

export default function EditNamePage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }
      try {
        const docRef = doc(db, "users", user.uid);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          if (data.first_name) setFirstName(data.first_name);
          if (data.last_name) setLastName(data.last_name);
        } else if (user.displayName) {
          const parts = user.displayName.split(" ");
          setFirstName(parts[0] || "");
          setLastName(parts.slice(1).join(" ") || "");
        }
      } catch (e) {
        console.error("Failed to load profile:", e);
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!firstName.trim() || !lastName.trim()) {
      setError("Both first name and last name are required.");
      return;
    }
    setUpdating(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("No user");
      const fullName = `${firstName.trim()} ${lastName.trim()}`;
      await updateProfile(user, { displayName: fullName });

      const docRef = doc(db, "users", user.uid);
      await setDoc(
        docRef,
        {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          name: fullName,
        },
        { merge: true }
      );
      router.back();
    } catch (e) {
      console.error(e);
      setError("Failed to update name. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin h-8 w-8 border-2 border-[#FFD3AC] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      {/* Top Bar */}
      <div className="flex items-center gap-4 pt-1">
        <AmbeBackButton onClick={() => router.back()} />
        <h1 className="text-white text-xl font-bold font-sans flex-1">
          Edit Name
        </h1>
      </div>

      {/* Form Container */}
      <form onSubmit={handleSubmit} className="space-y-4 pt-4">
        {error && (
          <div className="bg-red-950/70 border border-red-500/50 rounded-2xl p-3 text-center">
            <p className="text-xs text-red-300 font-sans">{error}</p>
          </div>
        )}

        <div className="space-y-1">
          <label className="block text-xs uppercase tracking-wider font-semibold text-gray-400 px-4">
            First Name
          </label>
          <AmbeTextField
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="First Name"
            required
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs uppercase tracking-wider font-semibold text-gray-400 px-4">
            Last Name
          </label>
          <AmbeTextField
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Last Name"
            required
          />
        </div>

        <div className="pt-6 flex justify-center">
          <AmbeButton type="submit" loading={updating} className="w-full">
            SAVE CHANGES
          </AmbeButton>
        </div>
      </form>
    </div>
  );
}
