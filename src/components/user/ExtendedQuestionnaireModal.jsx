"use client";

import UserQuestionnaireModal, {
  MEDICAL_CONDITIONS_LIST,
  ACTIVITY_QUESTIONS,
  LIFESTYLE_HEALTH_QUESTIONS,
  DOSHA_QUESTIONS
} from "@/components/user/UserQuestionnaireModal";

export {
  MEDICAL_CONDITIONS_LIST,
  ACTIVITY_QUESTIONS,
  LIFESTYLE_HEALTH_QUESTIONS,
  DOSHA_QUESTIONS
};

export default function ExtendedQuestionnaireModal(props) {
  return <UserQuestionnaireModal {...props} />;
}
