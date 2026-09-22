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

  return (
    <ProtectedRoute userType="user">
      <ExtendedQuestionnaireModal
        onComplete={() => router.replace(profile?.is_consultation_set ? "/user/consult" : "/user/consult/schedule")}
        onClose={() => router.push("/user/home")}
      />
    </ProtectedRoute>
  );
}
