"use client";

import { usePathname } from "next/navigation";
import UserNav from "@/components/navigation/UserNav";
import UserBottomNav from "@/components/navigation/UserBottomNav";
import BackgroundVideo from "@/components/common/BackgroundVideo";

export default function UserLayout({ children }) {
  const pathname = usePathname();
  const isQuestionnaireFullscreen =
    pathname?.startsWith("/user/menu/questionnaire") ||
    pathname?.startsWith("/user/consult/extended-questionnaire");

  if (isQuestionnaireFullscreen) {
    return (
      <div className="relative min-h-screen bg-[#1E1E1E] text-white font-sans antialiased">
        {children}
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#1E1E1E] text-white font-sans antialiased flex flex-col selection:bg-[#FFD3AC] selection:text-[#1E1E1E]">
      {/* Background Video matching Flutter App */}
      <BackgroundVideo opacity={0.3} />

      {/* Top Header */}
      <UserNav />

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 w-full pb-24 md:pb-12">
        <div className="max-w-4xl mx-auto px-3 sm:px-6 md:px-8 py-4 sm:py-6">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation (Flutter NavigationBar) */}
      <div className="md:hidden">
        <UserBottomNav />
      </div>
    </div>
  );
}
