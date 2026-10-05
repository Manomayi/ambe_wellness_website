"use client";

import { usePathname } from "next/navigation";
import UserNav from "@/components/navigation/UserNav";
import UserBottomNav from "@/components/navigation/UserBottomNav";
import BackgroundVideo from "@/components/common/BackgroundVideo";

export default function UserLayout({ children }) {
  const pathname = usePathname();
  const isQuestionnaireFullscreen =
    (pathname?.startsWith("/user/menu/questionnaire") &&
      !pathname?.startsWith("/user/menu/questionnaire/results")) ||
    pathname?.startsWith("/user/consult/extended-questionnaire") ||
    pathname?.startsWith("/user/begin-wellness-profile");

  const isChatPage = pathname?.startsWith("/user/consult/message_doctor");

  if (isQuestionnaireFullscreen) {
    return (
      <div className="relative min-h-screen bg-[#1E1E1E] text-white font-sans antialiased">
        {children}
      </div>
    );
  }

  return (
    <div
      className={`relative bg-[#1E1E1E] text-white font-sans antialiased flex flex-col selection:bg-[#FFD3AC] selection:text-[#1E1E1E] ${
        isChatPage ? "h-dvh h-[100dvh] overflow-hidden" : "min-h-[100dvh]"
      }`}
    >
      {/* Background Video matching Flutter App */}
      <BackgroundVideo opacity={0.3} />

      {/* Top Header */}
      <UserNav />

      {/* Main Content Area */}
      <main
        className={`relative z-10 flex-1 min-h-0 w-full ${
          isChatPage
            ? "h-full overflow-hidden pb-0 flex flex-col"
            : "pb-24 md:pb-12"
        }`}
      >
        <div
          className={
            isChatPage
              ? "h-full flex-1 min-h-0 w-full max-w-5xl mx-auto p-0 flex flex-col overflow-hidden"
              : "max-w-4xl mx-auto px-3 sm:px-6 md:px-8 py-4 sm:py-6"
          }
        >
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation (Flutter NavigationBar) */}
      {!isChatPage && (
        <div className="md:hidden">
          <UserBottomNav />
        </div>
      )}
    </div>
  );
}
