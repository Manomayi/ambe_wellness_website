"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { doc, writeBatch, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/contexts/AuthContext";
import { matchUserWithDoctor } from "@/lib/doctorMatching";
import { 
  ArrowLeftIcon, 
  ArrowRightIcon, 
  CheckIcon, 
  XMarkIcon,
  ShieldCheckIcon,
  SparklesIcon
} from "@heroicons/react/24/outline";

export const DOSHA_QUESTIONS = [
  {
    question: "Body size",
    options: ["Thin build", "Medium build", "Large build"]
  },
  {
    question: "Body weight",
    options: ["Low", "Medium", "Heavy Side"]
  },
  {
    question: "Weight change",
    options: ["Trouble gaining", "Can gain but lose quickly", "Gains weight easily, hard to lose"]
  },
  {
    question: "Skin type",
    options: ["Thin, dry", "Smooth combination skin", "Thick, oily"]
  },
  {
    question: "Skin texture",
    options: ["Cold, roughness, light color", "Warm, reddish, freckles", "Cool, pale"]
  },
  {
    question: "Hair",
    options: ["Dry, brittle, scarce, gets, knotted", "Straight, oily, prone to hair loss", "Thick, curly, oily, wavy, luxuriant"]
  },
  {
    question: "Hair color",
    options: ["Brown, black", "Blond, gray, red", "Dark black, dark brown"]
  },
  {
    question: "Teeth",
    options: ["Big, roomy, stick out, thin gums", "Medium size, soft, tender gums", "Healthy, white, strong gums"]
  },
  {
    question: "Nose",
    options: ["Uneven shape, deviated septum", "Long, pointed, red nose tip", "Short, rounded, button nose"]
  },
  {
    question: "Eyes",
    options: ["Small, sunken, dry, active, frequent blinking", "Sharp, sensitive to light", "Big, calm"]
  },
  {
    question: "Eye color",
    options: ["Black, brown", "Bright gray, green, yellow / red", "Blue"]
  },
  {
    question: "Nails",
    options: ["Dry, rough, easily broken", "Sharp, flexible, long, reddish tint", "Thick, smooth, shiny surface"]
  },
  {
    question: "Lip",
    options: ["Dry, cracked", "Often inflamed", "Smooth, large"]
  },
  {
    question: "Lip color",
    options: ["Black or brown tint", "Red or yellowish", "Pale"]
  },
  {
    question: "Chin",
    options: ["Thin and angular", "Tapered", "Rounded, big"]
  },
  {
    question: "Cheeks",
    options: ["Sunken, lines or wrinkles", "Flat and smooth", "Big or round"]
  },
  {
    question: "Neck",
    options: ["Long, thin", "Medium", "Wide"]
  },
  {
    question: "Chest",
    options: ["Small, flat", "Moderate", "Broad chested"]
  },
  {
    question: "Belly",
    options: ["Small, flat", "Moderate", "Large, defined"]
  },
  {
    question: "Bellybutton",
    options: ["Small, irregular", "Oval, superficial", "Big, deep, round"]
  },
  {
    question: "Hips",
    options: ["Small or thin", "Moderate", "Big"]
  },
  {
    question: "Joints",
    options: ["Cracking noise", "Moderate", "Large, lubricated"]
  },
  {
    question: "Taste preference",
    options: ["Bitter, pungent, astringent", "Sweet, bitter, astringent", "Sweet, sour, salty"]
  },
  {
    question: "Thirst",
    options: ["Variable", "Need water regularly", "Sparse need for water"]
  },
  {
    question: "Digestion",
    options: ["Irregular", "Quick", "Slow"]
  },
  {
    question: "When there is indigestion",
    options: ["Tendency to constipation, forms gas", "Causes burning, heartburn, reflux", "Forms mucous"]
  },
  {
    question: "Elimination",
    options: ["Dry", "Loose", "Thick, sluggish"]
  },
  {
    question: "Physical activity",
    options: ["Always active", "Moderate", "Slow, measured"]
  },
  {
    question: "Mental activity",
    options: ["Always active", "Moderate", "Calm"]
  },
  {
    question: "Personality",
    options: ["Vivacious, talkative, social, outgoing", "Likes to be in control, intense, ambitious", "Reserved, laid back, concerned"]
  },
  {
    question: "Emotional response when stressed",
    options: ["Anxiety, fear", "Anger, jealousy", "Greedy, possessive, withdrawn"]
  },
  {
    question: "Faith or beliefs",
    options: ["Variable", "Dedicated/strong", "Consistent"]
  },
  {
    question: "Intellectual response",
    options: ["Quick, not detailed", "Accurate, timely", "Paced but exact"]
  },
  {
    question: "Memory",
    options: ["Good short term, quick to forget", "Medium but accurate", "Slow to remember but then sustained"]
  },
  {
    question: "Career, life preference",
    options: ["Creative arts, designing", "Science or engineering", "Management, human relations, caregiving"]
  },
  {
    question: "Environment",
    options: ["Easily feels cold", "Intolerant of heat", "Uncomfortable in humidity"]
  },
  {
    question: "Sleep",
    options: ["Short, broken up", "Moderate and sound", "Deep and long"]
  },
  {
    question: "Dreams",
    options: ["Multiple and quick, fearful", "Fiery, often about conflicts", "Slow, romantic"]
  },
  {
    question: "Speech",
    options: ["Rapid, hither thither", "Precise, articulate", "Slow, monotonous"]
  },
  {
    question: "Financial",
    options: ["Buy on impulse", "Spends money on luxuries", "Good at saving money"]
  },
  {
    question: "Cravings",
    options: ["Fried food, hot, sharp, dry, meat or other protein & spicy food", "Sweets, cooling foods & drinks", "Wine or alcohol"]
  },
  {
    question: "Pain",
    options: ["Shifting, tearing", "Excruciating with breathlessness, fear and tachycardia", "Sucking pain with fever, nausea and irritability"]
  },
  {
    question: "Seasonal allergies",
    options: ["Breathlessness, wheezing, constricted breathing, runny nose, congestion", "Hives, watery eyes, rash, inflammation", "Itching eyes, irritation"]
  },
  {
    question: "Food sensitivity",
    options: ["Leftovers", "Dry fruits, raw food, hot spicy foods", "Sour foods, fermented foods, dairy products"]
  },
  {
    question: "Sweating",
    options: ["Scanty or no sweat", "Excess, profuse with body odor", "Cold/clammy"]
  },
  {
    question: "Muscle reactivity",
    options: ["Twitching, cramping, weakness, numbness, tingling", "Spasms, bruising, tenderness to touch, sore, excess heat", "Tumors, cysts, growths, generalized weakness"]
  },
  {
    question: "Bone and joints",
    options: ["Painful, popping, cracking, stiffness, loose", "Scoliosis, inflamed, hot / feverish, tender, inflammatory arthritis", "Swollen, rigid, painful with lack of mobility, swelling, stiffness, and deformities"]
  },
  {
    question: "Circulation",
    options: ["Cold, poor, anemia", "Hypertension, varicosities", "Edema, fluid retention, and lymphatic stasis"]
  },
  {
    question: "Which area are you looking to improve",
    options: [
      { label: "General Health", key: "general_health" },
      { label: "Women's Health", key: "womens_health" },
      { label: "Men's Health", key: "mens_health" },
      { label: "Muscular Skeletal", key: "muscular_skeletal" },
      { label: "Heart Health", key: "heart_health" },
      { label: "Skin & Hair Health", key: "skin_hair_health" },
      { label: "Mental/Emotional Health", key: "mental_emotional_health" },
      { label: "Digestive & Metabolic", key: "digestive_metabolic" },
      { label: "Oncology", key: "oncology" },
      { label: "Disabilities", key: "disabilities" },
      { label: "Behavioral", key: "behavorial" }
    ]
  }
];

export default function UserQuestionnaireModal({ onComplete }) {
  const router = useRouter();
  const { user } = useAuth();

  const [step, setStep] = useState("questions"); // "consent" | "questions"
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState(Array(DOSHA_QUESTIONS.length).fill(null));
  const [selectedHealthField, setSelectedHealthField] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showSkipModal, setShowSkipModal] = useState(false);

  const totalQuestions = DOSHA_QUESTIONS.length;
  const currentQ = DOSHA_QUESTIONS[currentPage];
  const isLastQuestion = currentPage === totalQuestions - 1;

  // Handle Option Select
  const handleSelectOption = (optionIndex, optionData = null) => {
    const updated = [...selectedAnswers];
    updated[currentPage] = optionIndex;
    setSelectedAnswers(updated);

    if (isLastQuestion && optionData) {
      setSelectedHealthField(optionData.key);
    }

    // Auto-advance if not last question
    if (currentPage < totalQuestions - 1) {
      setTimeout(() => {
        setCurrentPage((p) => p + 1);
      }, 180);
    }
  };

  const handleNext = () => {
    if (currentPage < totalQuestions - 1) {
      setCurrentPage((p) => p + 1);
    }
  };

  const handleBack = () => {
    if (currentPage > 0) {
      setCurrentPage((p) => p - 1);
    }
  };

  // Scoring & Save
  const saveAndComplete = async (isSkipping = false) => {
    if (!user) return;
    setIsSaving(true);

    try {
      let vata = 0, pitta = 0, kapha = 0;
      
      // Calculate scores for first 48 questions (indices 0..47)
      for (let i = 0; i < 48; i++) {
        const sel = selectedAnswers[i];
        if (sel === 0) vata++;
        else if (sel === 1) pitta++;
        else if (sel === 2) kapha++;
        else {
          // default/fallback
          vata++;
        }
      }

      let primary, secondary;
      if (vata >= pitta && vata >= kapha) {
        primary = "vata";
        secondary = pitta >= kapha ? "pitta" : "kapha";
      } else if (pitta >= vata && pitta >= kapha) {
        primary = "pitta";
        secondary = vata >= kapha ? "vata" : "kapha";
      } else {
        primary = "kapha";
        secondary = vata >= pitta ? "vata" : "pitta";
      }

      // Map answers
      const results = {};
      for (let i = 0; i < 48; i++) {
        const q = DOSHA_QUESTIONS[i];
        const sel = selectedAnswers[i] ?? 0;
        results[q.question] = q.options[sel];
      }

      const prefHealthKey = selectedHealthField || "general_health";
      const q49 = DOSHA_QUESTIONS[48];
      const sel49 = selectedAnswers[48] ?? 0;
      results[q49.question] = q49.options[sel49]?.label || q49.options[sel49] || "General Health";

      const batch = writeBatch(db);
      
      // 1. Questionnaire doc
      const questionnaireRef = doc(db, "users", user.uid, "questionnaires", "dosha_questionnaire");
      batch.set(questionnaireRef, {
        results,
        tally: {
          column_1: vata,
          column_2: pitta,
          column_3: kapha
        },
        dosha_scores: {
          primary,
          secondary
        },
        timestamp: serverTimestamp()
      });

      // 2. User doc
      const userRef = doc(db, "users", user.uid);
      batch.update(userRef, {
        is_free_questionnaire_completed: true,
        preferred_health: prefHealthKey,
        questionnaire_consent: {
          accepted_at: serverTimestamp(),
          disclaimer_version: "1.0"
        }
      });

      await batch.commit();

      // 3. Trigger doctor matching by specialty
      try {
        await matchUserWithDoctor(user.uid, prefHealthKey);
      } catch (mErr) {
        console.warn("Doctor matching during questionnaire complete:", mErr);
      }

      if (onComplete) {
        onComplete();
      }
    } catch (err) {
      console.error("Error saving questionnaire:", err);
      alert("Failed to save responses. Please try again.");
    } finally {
      setIsSaving(false);
      setShowSkipModal(false);
    }
  };

  // 2. QUESTIONS VIEW
  return (
    <div className="fixed inset-0 z-50 bg-[#FAF8F5] overflow-y-auto flex flex-col justify-between p-4 sm:p-8">
      {/* Top Header */}
      <div className="max-w-2xl w-full mx-auto flex items-center justify-between py-2">
        <div className="flex items-center gap-3">
          <span 
            className="text-2xl font-normal text-[#1A1A1A]"
            style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif" }}
          >
            AMBÉ®
          </span>
          <span className="text-xs uppercase tracking-widest font-medium text-[#C2691C] hidden sm:inline">
            Intake Assessment
          </span>
        </div>

        <button
          onClick={() => setShowSkipModal(true)}
          className="text-xs font-semibold uppercase tracking-wider text-[#8C827A] hover:text-[#1A1A1A] transition-colors py-1.5 px-3 rounded-full hover:bg-white border border-transparent hover:border-[#E7E2D9]"
        >
          Skip Assessment
        </button>
      </div>

      {/* Main Content Area */}
      <div className="max-w-xl w-full mx-auto my-auto py-6">
        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center text-xs font-medium text-[#6B6862] mb-2 uppercase tracking-wider">
            <span>Question {currentPage + 1} of {totalQuestions}</span>
            <span>{Math.round(((currentPage + 1) / totalQuestions) * 100)}%</span>
          </div>
          <div className="w-full h-1.5 bg-[#E7E2D9] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#C2691C] transition-all duration-300 rounded-full"
              style={{ width: `${((currentPage + 1) / totalQuestions) * 100}%` }}
            />
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white p-7 sm:p-10 rounded-3xl shadow-xl border border-[#E7E2D9] space-y-6">
          <div className="text-center space-y-2">
            <span className="text-[11px] font-bold tracking-widest uppercase text-[#C2691C]">
              {isLastQuestion ? "Area of Focus" : "Constitution & Dosha Profile"}
            </span>
            <h2
              className="text-2xl sm:text-3xl font-medium text-[#1A1A1A]"
              style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif" }}
            >
              {currentQ.question}
            </h2>
          </div>

          {/* Options */}
          <div className="space-y-3 pt-2">
            {isLastQuestion ? (
              // Question 49: Health Fields grid
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {currentQ.options.map((opt, i) => {
                  const isSelected = selectedAnswers[currentPage] === i;
                  return (
                    <button
                      key={opt.key}
                      onClick={() => handleSelectOption(i, opt)}
                      type="button"
                      className={`p-3.5 rounded-2xl text-left border transition-all text-xs font-medium cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? "border-[#1A1A1A] bg-[#FFD3AC] text-[#1A1A1A] shadow-sm font-semibold"
                          : "border-[#E7E2D9] bg-[#FAF8F5] text-[#353535] hover:bg-[#F4F1EA] hover:border-[#D1C9BE]"
                      }`}
                    >
                      <span>{opt.label}</span>
                      {isSelected && <CheckIcon className="w-4 h-4 text-[#1A1A1A]" />}
                    </button>
                  );
                })}
              </div>
            ) : (
              // Standard 3 Dosha options
              currentQ.options.map((opt, i) => {
                const isSelected = selectedAnswers[currentPage] === i;
                return (
                  <button
                    key={i}
                    onClick={() => handleSelectOption(i)}
                    type="button"
                    className={`w-full p-4 rounded-2xl text-left border transition-all text-sm cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? "border-[#1A1A1A] bg-[#FFD3AC] text-[#1A1A1A] shadow-sm font-medium"
                        : "border-[#E7E2D9] bg-[#FAF8F5] text-[#353535] hover:bg-[#F4F1EA] hover:border-[#D1C9BE]"
                    }`}
                  >
                    <span>{opt}</span>
                    {isSelected && <CheckIcon className="w-4 h-4 text-[#1A1A1A] shrink-0 ml-3" />}
                  </button>
                );
              })
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center pt-4 border-t border-[#F4F1EA]">
            {currentPage > 0 ? (
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center text-xs font-semibold uppercase tracking-wider text-[#6B6862] hover:text-[#1A1A1A] transition-colors cursor-pointer"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-1.5" />
                Previous
              </button>
            ) : (
              <div />
            )}

            {isLastQuestion ? (
              <button
                type="button"
                onClick={() => saveAndComplete(false)}
                disabled={isSaving || selectedAnswers[currentPage] === null}
                className="flex items-center px-8 py-3.5 rounded-full text-xs font-medium uppercase tracking-[0.14em] transition-all bg-[#FFD3AC] text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white shadow-md disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSaving ? "Submitting..." : "Complete Assessment"}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                disabled={selectedAnswers[currentPage] === null}
                className="flex items-center px-7 py-3 rounded-full text-xs font-medium uppercase tracking-[0.14em] transition-all bg-[#FFD3AC] text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white shadow-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Next
                <ArrowRightIcon className="h-4 w-4 ml-1.5" />
              </button>
            )}
          </div>
        </div>

        {/* Reassurance footer note */}
        <p className="text-center text-xs text-[#8C827A] mt-4">
          Your answers are private and will be reviewed with your doctor during your video consultation.
        </p>
      </div>

      {/* Bottom spacer */}
      <div className="py-2" />

      {/* Skip Confirmation Modal */}
      {showSkipModal && (
        <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-7 max-w-sm w-full shadow-2xl border border-[#E7E2D9] space-y-4 text-center">
            <h3 
              className="text-2xl font-normal text-[#1A1A1A]"
              style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif" }}
            >
              Skip assessment?
            </h3>
            <p className="text-xs text-[#6B6862] leading-relaxed">
              The remaining questions will be saved with defaults and you will continue to your dashboard. You can update your answers anytime.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowSkipModal(false)}
                className="flex-1 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => saveAndComplete(true)}
                disabled={isSaving}
                className="flex-1 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-[#FFD3AC] text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white transition-colors"
              >
                {isSaving ? "Saving..." : "Skip"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
