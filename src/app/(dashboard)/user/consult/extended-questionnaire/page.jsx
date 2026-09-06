"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import ExtendedQuestionnaireModal from "@/components/user/ExtendedQuestionnaireModal";
import BackButton from "@/components/common/BackButton";

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
      <div className="max-w-4xl mx-auto space-y-6">
        <BackButton href="/user/home" label="Back to Home" forceHref={true} />
        <ExtendedQuestionnaireModal
          standalone={true}
          onComplete={() => router.replace("/user/consult/schedule")}
          onClose={() => router.push("/user/home")}
        />
      </div>
    </ProtectedRoute>
  );
}
