"use client";

import { useRouter } from "next/navigation";
import UserQuestionnaireModal from "@/components/user/UserQuestionnaireModal";
import BackButton from "@/components/common/BackButton";

export default function QuestionnairePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen">
      <UserQuestionnaireModal
        onComplete={(redirectUrl) => {
          if (redirectUrl) {
            router.push(redirectUrl);
          } else {
            router.push("/user/home");
          }
        }}
      />
    </div>
  );
}
