import { Suspense } from "react";
import ContinueHandler from "./ContinueHandler";

export const metadata = {
  title: "Ambé Wellness",
  robots: { index: false, follow: false },
};

export default function AuthContinuePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#1E1E1E] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#FFD3AC] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ContinueHandler />
    </Suspense>
  );
}
