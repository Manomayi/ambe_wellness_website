"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { doc, writeBatch, serverTimestamp, setDoc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "@/lib/firebase/config";
import { useAuth } from "@/contexts/AuthContext";
import {
  XMarkIcon,
  CheckIcon,
  InformationCircleIcon,
  ClockIcon,
  CheckCircleIcon
} from "@heroicons/react/24/outline";

export const MEDICAL_CONDITIONS_LIST = [
  "Allergies to food/mold/drugs",
  "Anemia (Iron deficiency / Sickle cell / others)",
  "IBS / Crohn’s disease / IBD",
  "HIV exposure",
  "Arthritis / Gout / Rheumatic",
  "Ulcer (Duodenal / Peptic)",
  "COPD / Asthma / Sarcoidosis / Cystic fibrosis",
  "Cholelithiasis / Jaundice",
  "Pneumonia / TB of lungs or bone",
  "Thyroid disorders",
  "Autoimmune diseases",
  "Stroke / Cerebrovascular accident",
  "Hypertension / Hypotension",
  "Psychiatric conditions",
  "Cancer of any organ",
  "Mononucleosis",
  "CAD / Angina / Valvular heart disease",
  "Herpes / Gonorrhea",
  "Hypercholesterolemia",
  "Tinnitus / ENT conditions",
  "Dental conditions",
  "Nephrotic syndrome / Cystitis",
  "Diabetes (Type 1 or Type 2)",
  "Adhesive capsulitis / Brachial neuralgia",
  "Epilepsy / Seizures",
  "Multiple sclerosis / Parkinsons / Alzheimers",
  "Kidney disease (CKD / AKD)",
  "ALS",
  "Migraine",
  "Dementia",
  "Cataract / Glaucoma",
  "Paraplegia / Hemiplegia / Ataxia",
  "Hepatitis A/B/C / Fatty liver",
];

export const ACTIVITY_QUESTIONS = [
  {
    id: "exercise",
    question: "Do you currently engage in any exercise or physical activity?",
    options: ["Yes", "No", "Never"]
  },
  {
    id: "yoga",
    question: "Have you ever done yoga postures before?",
    options: ["Yes", "No", "Never"]
  }
];

export const LIFESTYLE_HEALTH_QUESTIONS = [
  {
    id: "bowels_consistency",
    question: "Bowels Consistency",
    options: ["Hard", "Soft", "Loose"]
  },
  {
    id: "flatulence",
    question: "Flatulence",
    options: ["Mild (5-10)", "Moderate (10-20)", "Severe (>20)"]
  },
  {
    id: "acid_reflux",
    question: "Acid reflux",
    options: ["Mild", "Moderate", "Severe", "None"]
  },
  {
    id: "tongue",
    question: "Tongue",
    options: ["Coated", "Uncoated", "Can’t say"]
  },
  {
    id: "pale_eyelids",
    question: "Pale inner eyelids (Anemia signs)",
    options: ["Mild", "Moderate", "Severe", "None"]
  },
  {
    id: "yellowing_eyes",
    question: "Yellowing of eyes (Jaundice signs)",
    options: ["Mild", "Moderate", "Severe", "None"]
  },
  {
    id: "addiction_habits",
    question: "Addiction / Habits",
    options: ["Tea / Coffee", "Alcohol / Substance / Smoking", "Others", "None"]
  },
  {
    id: "child_health",
    question: "Health as a child",
    options: ["Healthy", "Unhealthy", "Can’t say"]
  },
  {
    id: "energy_level",
    question: "How would you rate your usual energy level?",
    options: ["High", "Moderate", "Low"]
  },
  {
    id: "bowel_movements",
    question: "Bowel Movements",
    options: ["Once every 2-3 days", "Once daily", "2-3 times per day"]
  },
  {
    id: "bowel_associated",
    question: "Bowel movement associated with",
    options: ["Pain / Gas", "Blood", "Mucous / Foul smell", "None"]
  },
  {
    id: "urinary_problems",
    question: "Do you have any of the following urinary problems?",
    options: [
      "Pain / Burning sensation",
      "Discoloration / Frequent daytime urination",
      "Urination several times at night",
      "Sometimes",
      "None"
    ]
  },
  {
    id: "suppress_urges",
    question: "Do you delay or suppress any of the following urges?",
    options: [
      "Bowel movements / Gas / Urination",
      "Sleep / Yawning / Burping",
      "Breathing / Sneezing / Hunger / Thirst",
      "None"
    ]
  },
  {
    id: "daytime_sleep",
    question: "Do you sleep in the daytime?",
    options: ["Yes", "No", "Sometimes"]
  },
  {
    id: "morning_rising",
    question: "How do you generally feel on rising in the morning?",
    options: ["Fresh and rested", "A little tired", "Very tired"]
  },
  {
    id: "state_of_mind",
    question: "What is your present state of mind and emotions?",
    options: ["Good", "Fair", "Poor"]
  },
  {
    id: "relationships",
    question: "How are your relationships?",
    options: ["Excellent", "Fair", "Poor"]
  },
  {
    id: "social_life",
    question: "How is your social life?",
    options: ["Excellent", "Fair", "Poor"]
  },
  {
    id: "career",
    question: "How is your career?",
    options: ["Love it", "Like it", "Dislike it"]
  },
  {
    id: "purposeful_life",
    question: "How purposeful is your life?",
    options: ["Completely", "Neutral", "Not happy"]
  },
  {
    id: "spiritual_life",
    question: "Rate your spiritual life",
    options: ["Satisfying", "Neutral", "Empty"]
  },
  {
    id: "daily_routine",
    question: "How regular is your daily routine (sleep, meals, exercise)?",
    options: ["Very regular", "Somewhat regular", "Irregular"]
  },
  {
    id: "travel",
    question: "Do you travel a lot?",
    options: ["Yes", "No", "Sometimes"]
  },
  {
    id: "main_meal",
    question: "Which is your main meal?",
    options: ["Breakfast", "Lunch", "Dinner"]
  },
  {
    id: "water_per_day",
    question: "How much water do you drink per day?",
    options: ["1-2 glasses", "4-6 glasses", "7+ glasses"]
  },
  {
    id: "eating_habits",
    question: "Eating habits include",
    options: [
      "Eat with full attention on food",
      "Talk or converse a lot while eating",
      "Eat very fast"
    ]
  },
  {
    id: "diet",
    question: "Describe your diet",
    options: ["Vegan", "Pescatarian", "Non-vegetarian"]
  },
  {
    id: "crave_taste",
    question: "What taste(s) do you like or crave?",
    options: ["Sweet / Bitter", "Salty / Sour", "Hot / Spicy"]
  },
  {
    id: "menstruation",
    question: "Which of the following describes your menstruation? (For Women)",
    options: ["Regular", "Irregular", "Absent"],
    womenOnly: true
  },
  {
    id: "menstrual_days",
    question: "How many days does your menstrual period last? (For Women)",
    options: ["0-4 days", "5-7 days", "7+ days"],
    womenOnly: true
  },
  {
    id: "menstrual_flow",
    question: "How is your menstrual flow? (For Women)",
    options: ["Heavy", "Light", "Normal"],
    womenOnly: true
  },
  {
    id: "menstrual_symptoms",
    question: "Associated symptoms before or during menstruation (For Women)",
    options: [
      "Food Cravings / Cramping / Bloating",
      "Migraine / Mood changes / Tension",
      "Tenderness / Nightmares",
      "None"
    ],
    womenOnly: true
  },
  {
    id: "pain_intercourse",
    question: "Do you experience pain during intercourse? (For Women)",
    options: ["Yes", "No", "Can’t say"],
    womenOnly: true
  },
  {
    id: "sexual_difficulties",
    question: "Do you have any sexual difficulties? (For Women)",
    options: ["Yes", "No", "Can’t say"],
    womenOnly: true
  },
  {
    id: "pregnant_now",
    question: "Are you pregnant now? (For Women)",
    options: ["Yes", "No", "Don’t know"],
    womenOnly: true
  },
  {
    id: "contraceptive",
    question: "Do you take birth control pills, use an IUD, or other contraceptive devices? (For Women)",
    options: ["Yes", "No", "Rarely"],
    womenOnly: true
  },
  {
    id: "energy_afternoon",
    question: "Energy Level: Afternoon",
    options: ["High", "Medium", "Low"]
  },
  {
    id: "energy_night",
    question: "Energy Level: Night",
    options: ["High", "Medium", "Low"]
  }
];

export default function ExtendedQuestionnaireModal({ onComplete, onClose, standalone = false }) {
  const router = useRouter();
  const { user, profile } = useAuth();

  // Multi-select conditions
  const [selectedConditions, setSelectedConditions] = useState(new Set());
  const [noneConditions, setNoneConditions] = useState(false);

  // Single choice answers map { [questionId]: optionString }
  const [answers, setAnswers] = useState({});

  const [isSaving, setIsSaving] = useState(false);
  const [showSkipModal, setShowSkipModal] = useState(false);

  // Gender filter: hide "(For Women)" questions if patient is male
  const filteredLifestyleQuestions = useMemo(() => {
    const isMale = profile?.genderAtBirth?.trim()?.toLowerCase() === "male";
    if (isMale) {
      return LIFESTYLE_HEALTH_QUESTIONS.filter((q) => !q.womenOnly);
    }
    return LIFESTYLE_HEALTH_QUESTIONS;
  }, [profile?.genderAtBirth]);

  const allSingleQuestions = useMemo(() => {
    return [...ACTIVITY_QUESTIONS, ...filteredLifestyleQuestions];
  }, [filteredLifestyleQuestions]);

  // Handle Condition Toggle
  const handleToggleCondition = (condition) => {
    setSelectedConditions((prev) => {
      const next = new Set(prev);
      if (next.has(condition)) {
        next.delete(condition);
      } else {
        next.add(condition);
      }
      return next;
    });
    setNoneConditions(false);
  };

  const handleToggleNoneConditions = () => {
    setNoneConditions(true);
    setSelectedConditions(new Set());
  };

  // Handle Single Choice selection
  const handleSelectOption = (questionId, option) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: option
    }));
  };

  // Save to Firestore
  const persistAndFinish = async (isSkipping = false) => {
    if (!user) return;
    setIsSaving(true);

    try {
      const results = {};

      // 1. Single choice answers
      for (const q of allSingleQuestions) {
        results[q.question] = answers[q.id] || "Skipped";
      }

      // 2. Medical conditions list
      results["medical_conditions"] = noneConditions
        ? ["None"]
        : selectedConditions.size > 0
        ? Array.from(selectedConditions)
        : ["None"];

      for (const condition of MEDICAL_CONDITIONS_LIST) {
        results[condition] = noneConditions
          ? "No"
          : selectedConditions.has(condition)
          ? "Yes"
          : "No";
      }

      const batch = writeBatch(db);

      // Save subcollection questionnaires/extended
      const questionnaireRef = doc(db, "users", user.uid, "questionnaires", "extended");
      batch.set(questionnaireRef, {
        results,
        timestamp: serverTimestamp()
      });

      // Update users doc
      const userRef = doc(db, "users", user.uid);
      batch.update(userRef, {
        is_extended_questionnaire_completed: true,
        extended_questionnaire: results
      });

      await batch.commit();

      // Trigger doctor matching if no doctor assigned
      const resolvedDoctorUid =
        profile?.doctor?.uid ||
        (typeof profile?.doctor === "string" ? profile.doctor : null) ||
        profile?.doctor_uid ||
        profile?.matched_doctor;

      if (!resolvedDoctorUid) {
        try {
          const matchFn = httpsCallable(functions, "matchWithDoctor");
          await matchFn();
        } catch (e) {
          console.warn("matchWithDoctor call in extended questionnaire:", e);
        }
      }

      if (onComplete) {
        onComplete();
      } else {
        router.replace("/user/consult/schedule");
      }
    } catch (error) {
      console.error("Failed to save extended questionnaire:", error);
      alert("We could not save your answers. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSkipConfirm = async () => {
    setShowSkipModal(false);
    await persistAndFinish(true);
  };

  const content = (
    <div className="flex flex-col h-full max-h-[92vh] bg-white text-[#1A1A1A] rounded-3xl overflow-hidden shadow-2xl border border-[#E7E2D9]">
      {/* Header */}
      <div className="p-6 sm:p-8 bg-[#FAF8F5] border-b border-[#E7E2D9] relative">
        <button
          onClick={() => setShowSkipModal(true)}
          disabled={isSaving}
          className="absolute top-6 right-6 p-2 rounded-full text-[#8C827A] hover:text-[#1A1A1A] hover:bg-[#E7E2D9]/40 transition cursor-pointer"
          title="Skip questionnaire"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>

        <div className="max-w-xl mx-auto text-center space-y-3">
          <h2 
            className="text-2xl sm:text-3xl font-medium tracking-tight text-[#1A1A1A]"
            style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif" }}
          >
            Information Gathering
          </h2>
          <p className="text-sm text-[#6B6862] font-normal leading-relaxed">
            For a deeper read of your health history, please fill out the optional questionnaire
          </p>
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#FFF3E8] border border-[#FFD3AC] text-xs font-semibold text-[#C2691C]">
            <ClockIcon className="w-3.5 h-3.5 text-[#C2691C]" />
            <span>Please take 2 mins to complete</span>
          </div>
        </div>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-8 divide-y divide-[#E7E2D9]/60 bg-white">
        {/* 1. General Physical Activity Questions */}
        <div className="space-y-6">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[#C2691C]">
            Physical Activity
          </h3>
          {ACTIVITY_QUESTIONS.map((q, idx) => (
            <div
              key={q.id}
              className="bg-[#FAF8F5] border border-[#E7E2D9] rounded-2xl p-5 sm:p-6 space-y-4 hover:border-[#D1C9BE] transition"
            >
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#FFF3E8] border border-[#FFD3AC] text-[#C2691C] text-xs font-bold flex items-center justify-center">
                  {idx + 1}
                </span>
                <p className="font-medium text-[#1A1A1A] text-base leading-snug">{q.question}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                {q.options.map((opt) => {
                  const isSelected = answers[q.id] === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => handleSelectOption(q.id, opt)}
                      className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-medium transition cursor-pointer ${
                        isSelected
                          ? "bg-[#FFD3AC] border-2 border-[#1A1A1A] text-[#1A1A1A] font-semibold shadow-xs"
                          : "bg-white text-[#353535] hover:bg-[#F4F1EA] hover:border-[#D1C9BE] border border-[#E7E2D9]"
                      }`}
                    >
                      {isSelected && <CheckCircleIcon className="w-4 h-4 text-[#1A1A1A]" />}
                      <span>{opt}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* 2. Medical History & Existing Conditions Card (33 Conditions) */}
        <div className="space-y-4 pt-8">
          <div className="bg-[#FFF3E8] border border-[#FFD3AC] rounded-2xl p-5 sm:p-6 space-y-2">
            <div className="flex items-center gap-2 text-[#C2691C]">
              <InformationCircleIcon className="w-5 h-5" />
              <h3 className="font-bold text-lg text-[#1A1A1A]">
                Medical History & Existing Conditions
              </h3>
            </div>
            <p className="text-sm text-[#6B6862]">
              Select all conditions that apply to you, or choose &lsquo;None of the above&rsquo;.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5 pt-2">
            {MEDICAL_CONDITIONS_LIST.map((condition) => {
              const isSelected = selectedConditions.has(condition);
              return (
                <button
                  key={condition}
                  type="button"
                  onClick={() => handleToggleCondition(condition)}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition cursor-pointer text-left ${
                    isSelected
                      ? "bg-[#FFF3E8] border-2 border-[#1A1A1A] text-[#1A1A1A] font-semibold shadow-xs"
                      : "bg-[#FAF8F5] border border-[#E7E2D9] text-[#353535] hover:bg-[#F4F1EA] hover:border-[#D1C9BE]"
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded flex items-center justify-center border text-[10px] ${
                      isSelected
                        ? "bg-[#1A1A1A] border-[#1A1A1A] text-white"
                        : "border-[#C5BCAD] text-transparent bg-white"
                    }`}
                  >
                    ✓
                  </span>
                  <span>{condition}</span>
                </button>
              );
            })}

            {/* None of the above option */}
            <button
              type="button"
              onClick={handleToggleNoneConditions}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
                noneConditions
                  ? "bg-[#1A1A1A] text-white border-2 border-[#1A1A1A] shadow-md"
                  : "bg-[#FAF8F5] border border-[#E7E2D9] text-[#1A1A1A] hover:bg-[#F4F1EA] hover:border-[#D1C9BE]"
              }`}
            >
              <span
                className={`w-4 h-4 rounded flex items-center justify-center border text-[10px] ${
                  noneConditions
                    ? "bg-white border-white text-[#1A1A1A]"
                    : "border-[#C5BCAD] text-transparent bg-white"
                }`}
              >
                ✓
              </span>
              <span>None of the above</span>
            </button>
          </div>
        </div>

        {/* 3. Lifestyle, Digestion, Routine & General Health Questions */}
        <div className="space-y-6 pt-8">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[#C2691C]">
            Digestion, Lifestyle & Health Indicators
          </h3>
          {filteredLifestyleQuestions.map((q, idx) => (
            <div
              key={q.id}
              className="bg-[#FAF8F5] border border-[#E7E2D9] rounded-2xl p-5 sm:p-6 space-y-4 hover:border-[#D1C9BE] transition"
            >
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#FFF3E8] border border-[#FFD3AC] text-[#C2691C] text-xs font-bold flex items-center justify-center">
                  {idx + 4}
                </span>
                <div>
                  <p className="font-medium text-[#1A1A1A] text-base leading-snug">{q.question}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {q.options.map((opt) => {
                  const isSelected = answers[q.id] === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => handleSelectOption(q.id, opt)}
                      className={`inline-flex items-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-medium transition cursor-pointer ${
                        isSelected
                          ? "bg-[#FFD3AC] border-2 border-[#1A1A1A] text-[#1A1A1A] font-semibold shadow-xs"
                          : "bg-white text-[#353535] hover:bg-[#F4F1EA] hover:border-[#D1C9BE] border border-[#E7E2D9]"
                      }`}
                    >
                      <span
                        className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                          isSelected
                            ? "border-[#1A1A1A] bg-[#1A1A1A]"
                            : "border-[#C5BCAD]"
                        }`}
                      >
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </span>
                      <span>{opt}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sticky Bottom Bar */}
      <div className="p-4 sm:p-6 bg-[#FAF8F5] border-t border-[#E7E2D9] space-y-2">
        <button
          type="button"
          onClick={() => persistAndFinish(false)}
          disabled={isSaving}
          className="w-full bg-[#FFD3AC] hover:bg-[#1A1A1A] text-[#1A1A1A] hover:text-white py-4 px-6 rounded-2xl font-bold text-sm sm:text-base uppercase tracking-wider transition cursor-pointer shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isSaving ? (
            <>
              <div className="w-5 h-5 border-2 border-[#1A1A1A] border-t-transparent rounded-full animate-spin" />
              <span>Saving Health Profile...</span>
            </>
          ) : (
            <span>COMPLETE & SCHEDULE</span>
          )}
        </button>
        <p className="text-center text-xs text-[#8C827A]">
          Questionnaires are automatically saved and you can revisit them anytime.
        </p>
      </div>

      {/* Skip Confirmation Dialog */}
      {showSkipModal && (
        <div className="fixed inset-0 z-60 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-7 max-w-sm w-full shadow-2xl border border-[#E7E2D9] space-y-4 text-center">
            <h3 
              className="text-2xl font-normal text-[#1A1A1A]"
              style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif" }}
            >
              Skip questionnaire?
            </h3>
            <p className="text-xs sm:text-sm text-[#6B6862] leading-relaxed">
              The remaining questions will be skipped and you&apos;ll continue to consultation scheduling. You can update your answers later.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowSkipModal(false)}
                className="flex-1 py-3 rounded-full text-xs font-semibold uppercase tracking-wider bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors cursor-pointer"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={handleSkipConfirm}
                className="flex-1 py-3 rounded-full text-xs font-semibold uppercase tracking-wider bg-[#FFD3AC] text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white transition-colors cursor-pointer"
              >
                SKIP
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (standalone) {
    return <div className="max-w-4xl mx-auto py-6">{content}</div>;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-hidden animate-fadeIn">
      <div className="max-w-4xl w-full h-full max-h-[92vh] flex flex-col">{content}</div>
    </div>
  );
}
