"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import UserNav from "@/components/navigation/UserNav";
import UserBottomNav from "@/components/navigation/UserBottomNav";
import BackgroundVideo from "@/components/common/BackgroundVideo";
import UserQuestionnaireModal from "@/components/user/UserQuestionnaireModal";
import { useAuth } from "@/contexts/AuthContext";

export default function UserLayout({ children }) {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const pathname = usePathname();
  const [questionnaireDismissed, setQuestionnaireDismissed] = useState(false);

  // If user is loaded and questionnaire is not completed yet AND has no specialty chosen:
  const isQuestionnaireFullscreen =
    pathname?.startsWith("/user/menu/questionnaire") ||
    pathname?.startsWith("/user/consult/extended-questionnaire");
  const isQuestionnairePage =
    isQuestionnaireFullscreen ||
    pathname?.startsWith("/user/delete-account");
  const needsQuestionnaire =
    !questionnaireDismissed &&
    !isQuestionnairePage &&
    !loading &&
    user &&
    profile &&
    profile.is_free_questionnaire_completed !== true &&
    !profile.preferred_health;

  if (isQuestionnaireFullscreen) {
    return (
      <div className="relative min-h-screen bg-[#1E1E1E] text-white font-sans antialiased">
        {children}
      </div>
    );
  }

  if (needsQuestionnaire) {
    return (
      <UserQuestionnaireModal
        onComplete={(redirectUrl) => {
          setQuestionnaireDismissed(true);
          if (redirectUrl) {
            router.push(redirectUrl);
          } else if (pathname === "/user/home") {
            // Already on home
          } else {
            router.push("/user/home");
          }
        }}
      />
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
