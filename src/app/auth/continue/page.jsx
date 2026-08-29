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
        <div className="min-h-screen bg-[#F4F1EA] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#C2691C] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ContinueHandler />
    </Suspense>
  );
}
