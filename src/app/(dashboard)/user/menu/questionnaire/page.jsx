"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import UserQuestionnaireModal from "@/components/user/UserQuestionnaireModal";

function QuestionnaireContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromHome = searchParams.get("returnToHome") === "true";
  const extendedOnly = searchParams.get("section") === "extended";
  const fromResults =
    searchParams.get("from") === "results" ||
    searchParams.get("fromResults") === "true";

  const handleBackToMenu = () => {
    router.push("/user/menu");
  };

  return (
    <div className="min-h-screen">
      <UserQuestionnaireModal
        fromResults={fromResults}
        fromHome={fromHome}
        extendedOnly={extendedOnly}
        onSkip={(targetPath) => {
          if (fromResults) {
            router.replace("/user/menu/questionnaire/results");
          } else if (targetPath) {
            router.replace(targetPath);
          } else {
            router.replace("/user/consult");
          }
        }}
        onComplete={(redirectUrl) => {
          if (fromResults) {
            router.replace("/user/menu/questionnaire/results");
          } else if (redirectUrl) {
            router.replace(redirectUrl);
          } else {
            router.replace("/user/consult");
          }
        }}
        onClose={() => {
          if (fromResults) {
            router.replace("/user/menu/questionnaire/results");
          } else {
            router.replace("/user/home");
          }
        }}
      />
    </div>
  );
}

export default function QuestionnairePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#1E1E1E]" />}>
      <QuestionnaireContent />
    </Suspense>
  );
}
