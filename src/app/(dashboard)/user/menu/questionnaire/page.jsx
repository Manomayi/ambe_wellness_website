"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import UserQuestionnaireModal from "@/components/user/UserQuestionnaireModal";

function QuestionnaireContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnToHomeOnSkip = searchParams.get("returnToHome") === "true";
  const fromResults =
    searchParams.get("from") === "results" ||
    searchParams.get("fromResults") === "true";

  const handleBackToMenu = () => {
    router.push("/user/menu");
  };

  return (
    <div className="min-h-screen">
      <UserQuestionnaireModal
        returnToHomeOnSkip={returnToHomeOnSkip}
        onSkip={(targetPath) => {
          if (fromResults) {
            handleBackToMenu();
          } else if (returnToHomeOnSkip) {
            router.push("/user/home");
          } else if (targetPath) {
            router.push(targetPath);
          } else {
            router.push("/user/consult");
          }
        }}
        onComplete={(redirectUrl) => {
          if (redirectUrl) {
            router.push(redirectUrl);
          } else {
            router.push("/user/consult");
          }
        }}
        onClose={() => {
          if (fromResults) {
            handleBackToMenu();
          } else {
            router.push("/user/home");
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
