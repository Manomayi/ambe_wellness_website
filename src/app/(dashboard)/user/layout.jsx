"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import UserNav from "@/components/navigation/UserNav";
import UserQuestionnaireModal from "@/components/user/UserQuestionnaireModal";
import { useAuth } from "@/contexts/AuthContext";

export default function UserLayout({ children }) {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const pathname = usePathname();
  const [questionnaireDismissed, setQuestionnaireDismissed] = useState(false);

  // If user is loaded and questionnaire is not completed yet AND has no specialty chosen:
  const isQuestionnairePage = pathname?.startsWith("/user/menu/questionnaire") || pathname?.startsWith("/user/delete-account");
  const needsQuestionnaire = !questionnaireDismissed && !isQuestionnairePage && !loading && user && profile && profile.is_free_questionnaire_completed !== true && !profile.preferred_health;

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
    <div className="flex flex-col min-h-screen bg-[#FAF8F5] text-[#353535] font-sans antialiased">
      <UserNav currentPath={pathname} />
      <main className="flex-1 w-full px-4 sm:px-6 md:px-8 lg:px-12 py-8 sm:py-10">
        <div className="max-w-5xl mx-auto">
          {children}
        </div>
      </main>
      <footer className="text-center text-[#8C827A] text-xs sm:text-sm py-6 border-t border-[#E7E2D9]/60">
        © {new Date().getFullYear()} Ambé Wellness. All rights reserved.
      </footer>
    </div>
  );
}
