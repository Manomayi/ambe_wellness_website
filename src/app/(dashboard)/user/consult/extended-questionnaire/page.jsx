"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import ExtendedQuestionnaireModal from "@/components/user/ExtendedQuestionnaireModal";

export default function ExtendedQuestionnairePage() {
  const router = useRouter();
  const { profile, loading } = useAuth();

  useEffect(() => {
    if (!loading && profile?.is_extended_questionnaire_completed) {
      router.replace("/user/home");
    }
  }, [profile, loading, router]);

  if (!loading && profile?.is_extended_questionnaire_completed) {
    return null;
  }

  const handleDone = (targetPath) => {
    if (targetPath) {
      router.replace(targetPath);
      return;
    }
    const hasDoctor = Boolean(profile?.doctor?.uid || profile?.doctor_uid);
    if (profile?.is_consultation_set) {
      router.replace("/user/consult");
    } else if (hasDoctor) {
      router.replace("/user/consult/schedule");
    } else {
      router.replace("/user/consult");
    }
  };

  return (
    <ProtectedRoute userType="user">
      <ExtendedQuestionnaireModal
        fromBooking={true}
        onComplete={handleDone}
        onSkip={handleDone}
        onClose={() => router.push("/user/home")}
      />
    </ProtectedRoute>
  );
}
