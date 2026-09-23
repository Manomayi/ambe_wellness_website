"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { doc, writeBatch, serverTimestamp, setDoc, getDoc, deleteField } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/contexts/AuthContext";
import { matchUserWithDoctor } from "@/lib/doctorMatching";
import {
  CheckIcon,
  InformationCircleIcon,
  ClockIcon,
  SparklesIcon,
  HeartIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  XMarkIcon
} from "@heroicons/react/24/outline";
import BackgroundVideo from "@/components/common/BackgroundVideo";

// ============================================================================
// 1. DOSHA QUESTIONS (48 CONSTITUTIONAL QUESTIONS)
// ============================================================================
export const DOSHA_QUESTIONS = [
  {
    category: "Physical Constitution & Body Frame",
    question: "Body size",
    options: ["Thin build", "Medium build", "Large build"]
  },
  {
    category: "Physical Constitution & Body Frame",
    question: "Body weight",
    options: ["Low", "Medium", "Heavy Side"]
  },
  {
    category: "Physical Constitution & Body Frame",
    question: "Weight change",
    options: ["Trouble gaining", "Can gain but lose quickly", "Gains weight easily, hard to lose"]
  },
  {
    category: "Physical Constitution & Body Frame",
    question: "Skin type",
    options: ["Thin, dry", "Smooth combination skin", "Thick, oily"]
  },
  {
    category: "Physical Constitution & Body Frame",
    question: "Skin texture",
    options: ["Cold, roughness, light color", "Warm, reddish, freckles", "Cool, pale"]
  },
  {
    category: "Physical Constitution & Body Frame",
    question: "Hair",
    options: ["Dry, brittle, scarce, gets, knotted", "Straight, oily, prone to hair loss", "Thick, curly, oily, wavy, luxuriant"]
  },
  {
    category: "Physical Constitution & Body Frame",
    question: "Hair color",
    options: ["Brown, black", "Blond, gray, red", "Dark black, dark brown"]
  },
  {
    category: "Physical Constitution & Body Frame",
    question: "Teeth",
    options: ["Big, roomy, stick out, thin gums", "Medium size, soft, tender gums", "Healthy, white, strong gums"]
  },
  {
    category: "Physical Constitution & Body Frame",
    question: "Nose",
    options: ["Uneven shape, deviated septum", "Long, pointed, red nose tip", "Short, rounded, button nose"]
  },
  {
    category: "Physical Constitution & Body Frame",
    question: "Eyes",
    options: ["Small, sunken, dry, active, frequent blinking", "Sharp, sensitive to light", "Big, calm"]
  },
  {
    category: "Physical Constitution & Body Frame",
    question: "Eye color",
    options: ["Black, brown", "Bright gray, green, yellow / red", "Blue"]
  },
  {
    category: "Physical Constitution & Body Frame",
    question: "Nails",
    options: ["Dry, rough, easily broken", "Sharp, flexible, long, reddish tint", "Thick, smooth, shiny surface"]
  },
  {
    category: "Physical Constitution & Body Frame",
    question: "Lip",
    options: ["Dry, cracked", "Often inflamed", "Smooth, large"]
  },
  {
    category: "Physical Constitution & Body Frame",
    question: "Lip color",
    options: ["Black or brown tint", "Red or yellowish", "Pale"]
  },
  {
    category: "Physical Constitution & Body Frame",
    question: "Chin",
    options: ["Thin and angular", "Tapered", "Rounded, big"]
  },
  {
    category: "Physical Constitution & Body Frame",
    question: "Cheeks",
    options: ["Sunken, lines or wrinkles", "Flat and smooth", "Big or round"]
  },
  {
    category: "Physical Constitution & Body Frame",
    question: "Neck",
    options: ["Long, thin", "Medium", "Wide"]
  },
  {
    category: "Physical Constitution & Body Frame",
    question: "Chest",
    options: ["Small, flat", "Moderate", "Broad chested"]
  },
  {
    category: "Digestion, Metabolism & Elimination",
    question: "Belly",
    options: ["Small, flat", "Moderate", "Large, defined"]
  },
  {
    category: "Digestion, Metabolism & Elimination",
    question: "Bellybutton",
    options: ["Small, irregular", "Oval, superficial", "Big, deep, round"]
  },
  {
    category: "Digestion, Metabolism & Elimination",
    question: "Hips",
    options: ["Small or thin", "Moderate", "Big"]
  },
  {
    category: "Digestion, Metabolism & Elimination",
    question: "Joints",
    options: ["Cracking noise", "Moderate", "Large, lubricated"]
  },
  {
    category: "Digestion, Metabolism & Elimination",
    question: "Taste preference",
    options: ["Bitter, pungent, astringent", "Sweet, bitter, astringent", "Sweet, sour, salty"]
  },
  {
    category: "Digestion, Metabolism & Elimination",
    question: "Thirst",
    options: ["Variable", "Need water regularly", "Sparse need for water"]
  },
  {
    category: "Digestion, Metabolism & Elimination",
    question: "Digestion",
    options: ["Irregular", "Quick", "Slow"]
  },
  {
    category: "Digestion, Metabolism & Elimination",
    question: "When there is indigestion",
    options: ["Tendency to constipation, forms gas", "Causes burning, heartburn, reflux", "Forms mucous"]
  },
  {
    category: "Digestion, Metabolism & Elimination",
    question: "Elimination",
    options: ["Dry", "Loose", "Thick, sluggish"]
  },
  {
    category: "Mind, Temperament & Sleep",
    question: "Physical activity",
    options: ["Always active", "Moderate", "Slow, measured"]
  },
  {
    category: "Mind, Temperament & Sleep",
    question: "Mental activity",
    options: ["Always active", "Moderate", "Calm"]
  },
  {
    category: "Mind, Temperament & Sleep",
    question: "Personality",
    options: ["Vivacious, talkative, social, outgoing", "Likes to be in control, intense, ambitious", "Reserved, laid back, concerned"]
  },
  {
    category: "Mind, Temperament & Sleep",
    question: "Emotional response when stressed",
    options: ["Anxiety, fear", "Anger, jealousy", "Greedy, possessive, withdrawn"]
  },
  {
    category: "Mind, Temperament & Sleep",
    question: "Faith or beliefs",
    options: ["Variable", "Dedicated/strong", "Consistent"]
  },
  {
    category: "Mind, Temperament & Sleep",
    question: "Intellectual response",
    options: ["Quick, not detailed", "Accurate, timely", "Paced but exact"]
  },
  {
    category: "Mind, Temperament & Sleep",
    question: "Memory",
    options: ["Good short term, quick to forget", "Medium but accurate", "Slow to remember but then sustained"]
  },
  {
    category: "Mind, Temperament & Sleep",
    question: "Career, life preference",
    options: ["Creative arts, designing", "Science or engineering", "Management, human relations, caregiving"]
  },
  {
    category: "Mind, Temperament & Sleep",
    question: "Environment",
    options: ["Easily feels cold", "Intolerant of heat", "Uncomfortable in humidity"]
  },
  {
    category: "Mind, Temperament & Sleep",
    question: "Sleep",
    options: ["Short, broken up", "Moderate and sound", "Deep and long"]
  },
  {
    category: "Mind, Temperament & Sleep",
    question: "Dreams",
    options: ["Multiple and quick, fearful", "Fiery, often about conflicts", "Slow, romantic"]
  },
  {
    category: "Mind, Temperament & Sleep",
    question: "Speech",
    options: ["Rapid, hither thither", "Precise, articulate", "Slow, monotonous"]
  },
  {
    category: "Mind, Temperament & Sleep",
    question: "Financial",
    options: ["Buy on impulse", "Spends money on luxuries", "Good at saving money"]
  },
  {
    category: "Mind, Temperament & Sleep",
    question: "Cravings",
    options: ["Fried food, hot, sharp, dry, meat or other protein & spicy food", "Sweets, cooling foods & drinks", "Wine or alcohol"]
  },
  {
    category: "Physical Sensitivities & Vitals",
    question: "Pain",
    options: ["Shifting, tearing", "Excruciating with breathlessness, fear and tachycardia", "Sucking pain with fever, nausea and irritability"]
  },
  {
    category: "Physical Sensitivities & Vitals",
    question: "Seasonal allergies",
    options: ["Breathlessness, wheezing, constricted breathing, runny nose, congestion", "Hives, watery eyes, rash, inflammation", "Itching eyes, irritation"]
  },
  {
    category: "Physical Sensitivities & Vitals",
    question: "Food sensitivity",
    options: ["Leftovers", "Dry fruits, raw food, hot spicy foods", "Sour foods, fermented foods, dairy products"]
  },
  {
    category: "Physical Sensitivities & Vitals",
    question: "Sweating",
    options: ["Scanty or no sweat", "Excess, profuse with body odor", "Cold/clammy"]
  },
  {
    category: "Physical Sensitivities & Vitals",
    question: "Muscle reactivity",
    options: ["Twitching, cramping, weakness, numbness, tingling", "Spasms, bruising, tenderness to touch, sore, excess heat", "Tumors, cysts, growths, generalized weakness"]
  },
  {
    category: "Physical Sensitivities & Vitals",
    question: "Bone and joints",
    options: ["Painful, popping, cracking, stiffness, loose", "Scoliosis, inflamed, hot / feverish, tender, inflammatory arthritis", "Swollen, rigid, painful with lack of mobility, swelling, stiffness, and deformities"]
  },
  {
    category: "Physical Sensitivities & Vitals",
    question: "Circulation",
    options: ["Cold, poor, anemia", "Hypertension, varicosities", "Edema, fluid retention, and lymphatic stasis"]
  }
];

// ============================================================================
// 2. HEALTH SPECIALTY OPTIONS (QUESTION 49 / AREA OF FOCUS)
// ============================================================================
export const HEALTH_FIELDS = [
  { label: "General Health", key: "general_health", desc: "Overall vitality, preventive care & wellness" },
  { label: "Women's Health", key: "womens_health", desc: "Hormonal balance, fertility & lifecycle care" },
  { label: "Men's Health", key: "mens_health", desc: "Energy, hormone health & peak performance" },
  { label: "Muscular Skeletal", key: "muscular_skeletal", desc: "Joint mobility, posture & pain relief" },
  { label: "Heart Health", key: "heart_health", desc: "Cardiovascular health, circulation & BP" },
  { label: "Skin & Hair Health", key: "skin_hair_health", desc: "Glow, hair nourishment & natural healing" },
  { label: "Mental/Emotional Health", key: "mental_emotional_health", desc: "Stress management, focus & calm" },
  { label: "Digestive & Metabolic", key: "digestive_metabolic", desc: "Gut flora, bloating & metabolic balance" },
  { label: "Oncology Support", key: "oncology", desc: "Integrative recovery & immune resilience" },
  { label: "Disabilities & Rehabilitation", key: "disabilities", desc: "Specialized holistic adaptive support" },
  { label: "Behavioral Wellness", key: "behavorial", desc: "Habit renewal, lifestyle change & mindfulness" }
];

// ============================================================================
// 3. MEDICAL CONDITIONS LIST (33 CONDITIONS)
// ============================================================================
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

// ============================================================================
// 4. EXTENDED LIFESTYLE & CLINICAL QUESTIONS
// ============================================================================
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

// ============================================================================
// MAIN UNIFIED QUESTIONNAIRE COMPONENT
// ============================================================================
export default function UserQuestionnaireModal({
  onComplete,
  onClose,
  onSkip,
  fromBooking = false,
  returnToHomeOnSkip = false,
}) {
  const router = useRouter();
  const { user, profile } = useAuth();

  const [isSaving, setIsSaving] = useState(false);
  const [showSpecialtyAlert, setShowSpecialtyAlert] = useState(false);

  // 1. Dosha Answers state [0..47] -> option index (0, 1, 2)
  const [doshaAnswers, setDoshaAnswers] = useState(() => {
    if (typeof window !== "undefined" && user?.uid) {
      try {
        const local = localStorage.getItem(`dosha_answers_${user.uid}`);
        if (local) {
          const parsed = JSON.parse(local);
          if (Array.isArray(parsed) && parsed.length >= DOSHA_QUESTIONS.length) {
            return parsed.slice(0, DOSHA_QUESTIONS.length);
          }
        }
      } catch (e) {}
    }
    return Array(DOSHA_QUESTIONS.length).fill(null);
  });

  // 2. Specialty selection state
  const [hasInitialSpecialty, setHasInitialSpecialty] = useState(Boolean(profile?.preferred_health));
  const [selectedHealthField, setSelectedHealthField] = useState(profile?.preferred_health || null);

  useEffect(() => {
    if (profile?.preferred_health) {
      setHasInitialSpecialty(true);
      setSelectedHealthField(profile.preferred_health);
    }
  }, [profile?.preferred_health]);

  // 3. Extended conditions state
  const [selectedConditions, setSelectedConditions] = useState(() => {
    if (typeof window !== "undefined" && user?.uid) {
      try {
        const local = localStorage.getItem(`extended_conditions_${user.uid}`);
        if (local) {
          const arr = JSON.parse(local);
          if (Array.isArray(arr) && !arr.includes("None")) {
            return new Set(arr);
          }
        }
      } catch (e) {}
    }
    return new Set();
  });
  const [noneConditions, setNoneConditions] = useState(() => {
    if (typeof window !== "undefined" && user?.uid) {
      try {
        const local = localStorage.getItem(`extended_conditions_${user.uid}`);
        if (local) {
          const arr = JSON.parse(local);
          if (Array.isArray(arr) && arr.includes("None")) {
            return true;
          }
        }
      } catch (e) {}
    }
    return false;
  });

  // 4. Extended single choice answers state { [id]: optionString }
  const [extendedAnswers, setExtendedAnswers] = useState(() => {
    if (typeof window !== "undefined" && user?.uid) {
      try {
        const local = localStorage.getItem(`extended_answers_${user.uid}`);
        if (local) return JSON.parse(local) || {};
      } catch (e) {}
    }
    return {};
  });

  const specialtyRef = useRef(null);
  const hasLoadedDraftRef = useRef(false);

  // Gender filter for women-only questions
  const filteredLifestyleQuestions = useMemo(() => {
    const isMale = profile?.genderAtBirth?.trim()?.toLowerCase() === "male";
    if (isMale) {
      return LIFESTYLE_HEALTH_QUESTIONS.filter((q) => !q.womenOnly);
    }
    return LIFESTYLE_HEALTH_QUESTIONS;
  }, [profile?.genderAtBirth]);

  const allExtendedSingleQuestions = useMemo(() => {
    return [...ACTIVITY_QUESTIONS, ...filteredLifestyleQuestions];
  }, [filteredLifestyleQuestions]);

  // Load existing draft answers and profile data on mount
  useEffect(() => {
    if (!user) return;
    if (hasLoadedDraftRef.current) return;
    hasLoadedDraftRef.current = true;

    let isMounted = true;

    const loadDraftData = async () => {
      let restoredDosha = null;
      let restoredSpecialty = profile?.preferred_health || null;
      let restoredExtended = {};
      let restoredConditions = new Set();
      let restoredNoneConditions = false;

      // 1. Try local storage first
      try {
        const localDosha = localStorage.getItem(`dosha_answers_${user.uid}`);
        if (localDosha) {
          const parsed = JSON.parse(localDosha);
          if (Array.isArray(parsed) && parsed.length >= DOSHA_QUESTIONS.length) {
            restoredDosha = parsed.slice(0, DOSHA_QUESTIONS.length);
          }
        }
        const localExt = localStorage.getItem(`extended_answers_${user.uid}`);
        if (localExt) {
          restoredExtended = JSON.parse(localExt) || {};
        }
        const localConds = localStorage.getItem(`extended_conditions_${user.uid}`);
        if (localConds) {
          const arr = JSON.parse(localConds);
          if (Array.isArray(arr)) {
            if (arr.includes("None")) {
              restoredNoneConditions = true;
            } else {
              restoredConditions = new Set(arr);
            }
          }
        }
      } catch (e) {
        console.warn("Could not read draft from localStorage:", e);
      }

      // 2. Check profile in memory first, then fallback to Firestore with timeout
      try {
        const profileData = profile || {};
        if (profileData.preferred_health) {
          restoredSpecialty = profileData.preferred_health;
        }

        // Restore Dosha draft answers from profile
        if (!restoredDosha && profileData.dosha_draft_answers && typeof profileData.dosha_draft_answers === "object") {
          const arr = Array(DOSHA_QUESTIONS.length).fill(null);
          Object.entries(profileData.dosha_draft_answers).forEach(([idxStr, val]) => {
            const idx = parseInt(idxStr, 10);
            if (!isNaN(idx) && idx >= 0 && idx < arr.length) {
              arr[idx] = val;
            }
          });
          restoredDosha = arr;
        }

        // Restore Extended draft answers from profile
        if (Object.keys(restoredExtended).length === 0 && profileData.extended_draft_answers) {
          if (profileData.extended_draft_answers.answers) {
            restoredExtended = profileData.extended_draft_answers.answers;
          }
          if (Array.isArray(profileData.extended_draft_answers.conditions)) {
            if (profileData.extended_draft_answers.conditions.includes("None")) {
              restoredNoneConditions = true;
            } else {
              restoredConditions = new Set(profileData.extended_draft_answers.conditions);
            }
          }
        }

        // Quick fallback to Firestore if needed (max 1.5s timeout)
        if (!restoredDosha || Object.keys(restoredExtended).length === 0) {
          const userSnap = await Promise.race([
            getDoc(doc(db, "users", user.uid)),
            new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 1500))
          ]);
          if (userSnap && userSnap.exists()) {
            const data = userSnap.data();
            if (data.preferred_health && !restoredSpecialty) {
              restoredSpecialty = data.preferred_health;
            }
            if (!restoredDosha && data.dosha_draft_answers && typeof data.dosha_draft_answers === "object") {
              const arr = Array(DOSHA_QUESTIONS.length).fill(null);
              Object.entries(data.dosha_draft_answers).forEach(([idxStr, val]) => {
                const idx = parseInt(idxStr, 10);
                if (!isNaN(idx) && idx >= 0 && idx < arr.length) {
                  arr[idx] = val;
                }
              });
              restoredDosha = arr;
            }
            if (Object.keys(restoredExtended).length === 0 && data.extended_draft_answers) {
              if (data.extended_draft_answers.answers) {
                restoredExtended = data.extended_draft_answers.answers;
              }
              if (Array.isArray(data.extended_draft_answers.conditions)) {
                if (data.extended_draft_answers.conditions.includes("None")) {
                  restoredNoneConditions = true;
                } else {
                  restoredConditions = new Set(data.extended_draft_answers.conditions);
                }
              }
            }
          }
        }
      } catch (e) {
        // Non-blocking fallback
      }

      if (!isMounted) return;

      if (restoredDosha) setDoshaAnswers(restoredDosha);
      if (restoredSpecialty) {
        setSelectedHealthField(restoredSpecialty);
        setHasInitialSpecialty(true);
      }
      if (Object.keys(restoredExtended).length > 0) setExtendedAnswers(restoredExtended);
      if (restoredConditions.size > 0) setSelectedConditions(restoredConditions);
      if (restoredNoneConditions) setNoneConditions(true);
    };

    loadDraftData();

    return () => {
      isMounted = false;
    };
  }, [user, profile]);

  // Handlers for Dosha questions
  const handleSelectDosha = (index, optionIndex) => {
    const updated = [...doshaAnswers];
    updated[index] = optionIndex;
    setDoshaAnswers(updated);
    if (user) {
      try {
        localStorage.setItem(`dosha_answers_${user.uid}`, JSON.stringify(updated));
      } catch (e) {}
    }
  };

  // Handlers for Specialty selection
  const handleSelectSpecialty = (key) => {
    setSelectedHealthField(key);
    setShowSpecialtyAlert(false);
  };

  // Handlers for Medical Conditions
  const handleToggleCondition = (cond) => {
    setNoneConditions(false);
    setSelectedConditions((prev) => {
      const next = new Set(prev);
      if (next.has(cond)) {
        next.delete(cond);
      } else {
        next.add(cond);
      }
      if (user) {
        try {
          localStorage.setItem(`extended_conditions_${user.uid}`, JSON.stringify(Array.from(next)));
        } catch (e) {}
      }
      return next;
    });
  };

  const handleToggleNoneConditions = () => {
    setNoneConditions(true);
    setSelectedConditions(new Set());
    if (user) {
      try {
        localStorage.setItem(`extended_conditions_${user.uid}`, JSON.stringify(["None"]));
      } catch (e) {}
    }
  };

  // Handlers for Extended single choice questions
  const handleSelectExtendedSingle = (questionId, option) => {
    setExtendedAnswers((prev) => {
      const next = { ...prev, [questionId]: option };
      if (user) {
        try {
          localStorage.setItem(`extended_answers_${user.uid}`, JSON.stringify(next));
        } catch (e) {}
      }
      return next;
    });
  };

  // Answer stats & counts
  const answeredDoshaCount = doshaAnswers.filter((a) => a !== null && a !== undefined).length;
  const isSpecialtyAnswered = Boolean(selectedHealthField);
  const isConditionsAnswered = selectedConditions.size > 0 || noneConditions;
  const answeredExtendedCount = Object.keys(extendedAnswers).length;
  const totalQuestionsCount = DOSHA_QUESTIONS.length + (hasInitialSpecialty ? 0 : 1) + 1 + allExtendedSingleQuestions.length;
  const totalAnsweredCount = answeredDoshaCount + (!hasInitialSpecialty && isSpecialtyAnswered ? 1 : 0) + (isConditionsAnswered ? 1 : 0) + answeredExtendedCount;
  const percentComplete = Math.min(100, Math.round((totalAnsweredCount / totalQuestionsCount) * 100));

  const areAllDoshaAnswered = answeredDoshaCount === DOSHA_QUESTIONS.length;
  const areAllExtendedAnswered = answeredExtendedCount >= allExtendedSingleQuestions.length && isConditionsAnswered;
  const isFullyCompleted = areAllDoshaAnswered && (hasInitialSpecialty || isSpecialtyAnswered) && areAllExtendedAnswered;

  // Skip handler: jump to specialty if not selected; otherwise save draft and finish
  const handleSkip = async () => {
    if (!hasInitialSpecialty && !selectedHealthField) {
      setShowSpecialtyAlert(true);
      if (specialtyRef.current) {
        specialtyRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    // Specialty is selected! Save draft and finish
    await saveAssessment(false, true);
  };

  // Save & Continue handler for bottom sticky bar
  const handleSaveAndContinue = async () => {
    if (!hasInitialSpecialty && !selectedHealthField) {
      setShowSpecialtyAlert(true);
      if (specialtyRef.current) {
        specialtyRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }
    await saveAssessment(isFullyCompleted);
  };

  // Core save function
  const saveAssessment = async (isCompleted = false, isSkip = false) => {
    if (!user) return;
    setIsSaving(true);

    try {
      const prefHealthKey = selectedHealthField || "general_health";
      const userRef = doc(db, "users", user.uid);
      const batch = writeBatch(db);

      // 1. If user answered all dosha questions: score and write dosha questionnaire doc
      if (areAllDoshaAnswered) {
        let vata = 0, pitta = 0, kapha = 0;
        for (let i = 0; i < 48; i++) {
          const sel = doshaAnswers[i];
          if (sel === 0) vata++;
          else if (sel === 1) pitta++;
          else if (sel === 2) kapha++;
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

        const doshaResults = {};
        for (let i = 0; i < 48; i++) {
          const q = DOSHA_QUESTIONS[i];
          const sel = doshaAnswers[i] ?? 0;
          doshaResults[q.question] = q.options[sel];
        }

        const healthFieldObj = HEALTH_FIELDS.find((hf) => hf.key === prefHealthKey);
        doshaResults["Which area are you looking to improve"] = healthFieldObj?.label || "General Health";

        const questionnaireRef = doc(db, "users", user.uid, "questionnaires", "dosha_questionnaire");
        batch.set(questionnaireRef, {
          results: doshaResults,
          tally: { column_1: vata, column_2: pitta, column_3: kapha },
          dosha_scores: { primary, secondary },
          timestamp: serverTimestamp()
        });
      }

      // 2. Save Extended Questionnaire doc
      const extendedResults = {};
      for (const q of allExtendedSingleQuestions) {
        extendedResults[q.question] = extendedAnswers[q.id] || "Skipped";
      }
      extendedResults["medical_conditions"] = noneConditions
        ? ["None"]
        : selectedConditions.size > 0
        ? Array.from(selectedConditions)
        : ["None"];

      for (const condition of MEDICAL_CONDITIONS_LIST) {
        extendedResults[condition] = noneConditions
          ? "No"
          : selectedConditions.has(condition)
          ? "Yes"
          : "No";
      }

      const extendedDocRef = doc(db, "users", user.uid, "questionnaires", "extended");
      batch.set(extendedDocRef, {
        results: extendedResults,
        timestamp: serverTimestamp()
      });

      // 3. User document updates
      const partialDosha = {};
      doshaAnswers.forEach((ans, idx) => {
        if (ans !== null && ans !== undefined) partialDosha[idx] = ans;
      });

      const userDocUpdate = {
        preferred_health: prefHealthKey,
        is_free_questionnaire_completed: areAllDoshaAnswered,
        is_extended_questionnaire_completed: areAllExtendedAnswered,
        questionnaire_consent: {
          accepted_at: serverTimestamp(),
          disclaimer_version: "1.0"
        }
      };

      if (areAllDoshaAnswered && areAllExtendedAnswered) {
        userDocUpdate.dosha_draft_answers = deleteField();
        userDocUpdate.extended_draft_answers = deleteField();
      } else {
        userDocUpdate.dosha_draft_answers = partialDosha;
        userDocUpdate.extended_draft_answers = {
          answers: extendedAnswers,
          conditions: noneConditions ? ["None"] : Array.from(selectedConditions)
        };
      }

      batch.set(userRef, userDocUpdate, { merge: true });
      await batch.commit();

      // Clear local storage if fully completed
      if (areAllDoshaAnswered && areAllExtendedAnswered) {
        try {
          localStorage.removeItem(`dosha_answers_${user.uid}`);
          localStorage.removeItem(`extended_answers_${user.uid}`);
          localStorage.removeItem(`extended_conditions_${user.uid}`);
        } catch (e) {}
      }

      // 4. Trigger doctor matching ONLY if user does not already have an assigned doctor
      const userSnap = await getDoc(userRef);
      const uData = userSnap.exists() ? userSnap.data() : {};
      let hasAssignedDoctor = Boolean(
        (uData.doctor && uData.doctor.uid) || uData.doctor_uid || uData.doctor_id
      );

      if (!hasAssignedDoctor) {
        try {
          const matchResult = await matchUserWithDoctor(user.uid, prefHealthKey);
          if (matchResult?.matched && matchResult?.doctor) {
            hasAssignedDoctor = true;
          }
        } catch (mErr) {
          console.warn("Doctor matching call:", mErr);
          await setDoc(userRef, {
            needs_doctor_assignment: true,
            preferred_health: prefHealthKey,
          }, { merge: true }).catch(() => {});
        }
      } else {
        console.log(
          "User already has assigned doctor. Preserving assignment and skipping matchUserWithDoctor."
        );
      }

      // 5. Clean redirect: Once matched, proceed directly to booking (/user/consult/schedule)
      let targetPath;
      if (isSkip && returnToHomeOnSkip) {
        targetPath = "/user/home";
      } else if (hasAssignedDoctor || Boolean(profile?.doctor?.uid)) {
        targetPath = "/user/consult/schedule";
      } else {
        targetPath = "/user/consult";
      }

      if (isSkip && onSkip) {
        onSkip(targetPath);
      } else if (onComplete) {
        onComplete(targetPath);
      } else {
        router.push(targetPath);
      }
    } catch (err) {
      console.error("Error saving assessment:", err);
      alert("Failed to save responses. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Group Dosha questions by category
  const categories = [
    "Physical Constitution & Body Frame",
    "Digestion, Metabolism & Elimination",
    "Mind, Temperament & Sleep",
    "Physical Sensitivities & Vitals"
  ];

  return (
    <div className="fixed inset-0 z-50 bg-[#1E1E1E] overflow-y-auto flex flex-col justify-between text-white font-sans">
      <BackgroundVideo opacity={0.25} />

      {/* Sticky Top Header matching Mobile App */}
      <div className="sticky top-0 z-30 bg-[#1B1A18]/95 backdrop-blur-md border-b border-white/10 px-4 sm:px-8 py-3.5 shadow-md">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Image
              src="/images/logos/ambe_logo.png"
              alt="AMBÉ"
              width={100}
              height={30}
              className="w-[85px] sm:w-[105px] h-auto object-contain cursor-pointer"
              priority
              onClick={() => {
                if (onClose) onClose();
                else router.push("/user/home");
              }}
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSkip}
              disabled={isSaving}
              className="text-xs font-bold text-[#FFD3AC] border border-[#FFD3AC]/50 rounded-full px-5 py-1.5 hover:bg-[#FFD3AC]/10 transition cursor-pointer"
            >
              Skip
            </button>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="p-1 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/10 cursor-pointer"
                title="Close"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Progress Bar Row directly below top bar matching Mobile App */}
      <div className="sticky top-[58px] z-20 bg-black/40 backdrop-blur-md border-b border-white/10 px-4 sm:px-8 py-2.5">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <span className="text-xs sm:text-sm font-medium text-white/85">
            {totalAnsweredCount} of {totalQuestionsCount} completed
          </span>
          <div className="flex items-center gap-2.5">
            <div className="w-20 sm:w-28 h-1.5 bg-white/15 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#FFD3AC] transition-all duration-300 rounded-full"
                style={{ width: `${percentComplete}%` }}
              />
            </div>
            <span className="text-xs sm:text-sm font-bold text-[#FFD3AC]">
              {percentComplete}%
            </span>
          </div>
        </div>
      </div>

      {/* Main Form Container */}
      <main className="relative z-10 max-w-4xl w-full mx-auto px-4 sm:px-8 py-6 space-y-8 pb-36">
        {/* Intro Hero Banner matching Mobile App */}
        <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-5 sm:p-7 shadow-sm space-y-3">
          <div>
            <span className="inline-block px-3 py-1 bg-[#FFD3AC]/20 text-[#FFD3AC] text-[11px] font-bold tracking-wider rounded-md uppercase">
              HOLISTIC INTAKE
            </span>
          </div>
          <h1
            className="text-2xl sm:text-3xl font-semibold text-white leading-tight"
            style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif" }}
          >
            Personalized Constitutional Assessment &amp; Health Profile
          </h1>
          <p className="text-xs sm:text-sm text-white/75 leading-relaxed">
            Complete all sections below to receive your personalized constitution report, or choose your health specialty to book your specialist consultation.
          </p>
        </div>

        {/* ================================================================ */}
        {/* SECTION 1: CONSTITUTION & DOSHA ASSESSMENT (48 QUESTIONS)        */}
        {/* ================================================================ */}
        <section className="space-y-6">
          <div className="space-y-1 border-b border-white/10 pb-4">
            <span className="text-xs uppercase tracking-widest font-bold text-[#FFD3AC]">
              PART 1
            </span>
            <h2
              className="text-2xl sm:text-3xl font-medium text-white"
              style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif" }}
            >
              Constitution &amp; Dosha Profile
            </h2>
            <p className="text-xs sm:text-sm text-gray-400">
              Answer these 48 questions based on your lifelong baseline tendencies to determine your unique Vata, Pitta, and Kapha constitution.
            </p>
          </div>

          {categories.map((catName) => {
            const catQuestions = DOSHA_QUESTIONS.map((q, originalIdx) => ({ ...q, originalIdx }))
              .filter((q) => q.category === catName);

            return (
              <div key={catName} className="space-y-3 pt-2">
                <h3 className="text-sm sm:text-base font-bold text-[#FFD3AC] tracking-wide">
                  {catName}
                </h3>
                <div className="space-y-3.5">
                  {catQuestions.map(({ question, options, originalIdx }) => {
                    const selectedOpt = doshaAnswers[originalIdx];
                    const isAnswered = selectedOpt !== null && selectedOpt !== undefined;
                    return (
                      <div
                        key={originalIdx}
                        className={`rounded-2xl p-4 sm:p-5 space-y-3 border transition ${
                          isAnswered
                            ? "bg-white/[0.04] border-[#FFD3AC]/30"
                            : "bg-white/[0.02] border-white/10"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`w-6.5 h-6.5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border ${
                            isAnswered
                              ? "bg-[#FFD3AC]/20 border-[#FFD3AC] text-[#FFD3AC]"
                              : "bg-white/10 border-white/20 text-white/80"
                          }`}>
                            {originalIdx + 1}
                          </span>
                          <h4 className="font-semibold text-white text-[15px] sm:text-base font-sans">
                            {question}
                          </h4>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                          {options.map((optText, optIdx) => {
                            const isSelected = selectedOpt === optIdx;
                            return (
                              <button
                                key={optIdx}
                                type="button"
                                onClick={() => handleSelectDosha(originalIdx, optIdx)}
                                className={`p-3 sm:p-3.5 rounded-xl text-left border transition text-sm sm:text-sm font-medium cursor-pointer flex items-center gap-3 ${
                                  isSelected
                                    ? "border-[#FFD3AC] bg-[#FFD3AC]/20 text-[#FFD3AC] font-semibold shadow-xs"
                                    : "border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:border-white/20 hover:text-white"
                                }`}
                              >
                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                  isSelected ? "border-[#FFD3AC] bg-[#FFD3AC]" : "border-white/30"
                                }`}>
                                  {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-[#1E1E1E]" />}
                                </div>
                                <span className="flex-1">{optText}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </section>

        {/* ================================================================ */}
        {/* SECTION 2: AREA OF FOCUS / SPECIALTY (MANDATORY TO MATCH DOCTOR) */}
        {/* ================================================================ */}
        {!hasInitialSpecialty && (
          <section
            ref={specialtyRef}
            id="specialty-section"
            className={`space-y-4 rounded-3xl p-5 sm:p-7 transition-all ${
              showSpecialtyAlert
                ? "bg-amber-950/20 border-2 border-[#FFD3AC] shadow-lg ring-2 ring-[#FFD3AC]/40"
                : "bg-white/[0.03] border border-white/10 shadow-sm"
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
              <div>
                <span className="text-xs uppercase tracking-widest font-bold text-[#FFD3AC]">
                  PART 2
                </span>
                <h2
                  className="text-2xl sm:text-3xl font-medium text-white mt-1"
                  style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif" }}
                >
                  Area of Focus / Specialty
                </h2>
                <p className="text-xs sm:text-sm text-gray-400 mt-1">
                  Select the clinical specialty you seek. This is required to match you with the right specialist.
                </p>
              </div>
              {selectedHealthField && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full bg-emerald-950 border border-emerald-500/50 text-emerald-300 shrink-0">
                  <CheckIcon className="w-3.5 h-3.5" /> Selected
                </span>
              )}
            </div>

            {showSpecialtyAlert && (
              <div className="bg-amber-950/70 border border-amber-500/50 rounded-2xl p-4 flex items-center gap-3 text-xs font-medium text-amber-200 animate-pulse">
                <ExclamationCircleIcon className="w-5 h-5 shrink-0" />
                <span>Please select your health specialty to continue. This is required to match you with a doctor.</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {HEALTH_FIELDS.map((hf) => {
                const isSelected = selectedHealthField === hf.key;
                return (
                  <button
                    key={hf.key}
                    type="button"
                    onClick={() => handleSelectSpecialty(hf.key)}
                    className={`p-4 rounded-2xl text-left border transition cursor-pointer flex flex-col justify-between space-y-2 ${
                      isSelected
                        ? "border-[#FFD3AC] bg-[#FFD3AC]/20 text-white shadow-sm"
                        : "border-white/10 bg-white/5 text-white/90 hover:bg-white/10 hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className={`font-bold text-base ${isSelected ? "text-[#FFD3AC]" : "text-white"}`}>{hf.label}</span>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center border text-xs ${
                        isSelected ? "bg-[#FFD3AC] border-[#FFD3AC] text-[#1E1E1E]" : "border-white/30 text-transparent"
                      }`}>
                        ✓
                      </div>
                    </div>
                    <p className={`text-xs leading-snug ${isSelected ? "text-white/80" : "text-gray-300"}`}>{hf.desc}</p>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* ================================================================ */}
        {/* SECTION 3: MEDICAL CONDITIONS CHECKLIST (33 CONDITIONS)          */}
        {/* ================================================================ */}
        <section className="space-y-4">
          <div className="border-b border-white/10 pb-4 space-y-1">
            <span className="text-xs uppercase tracking-widest font-bold text-[#FFD3AC]">
              PART {hasInitialSpecialty ? "2" : "3"}
            </span>
            <h2
              className="text-2xl sm:text-3xl font-medium text-white"
              style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif" }}
            >
              Medical History &amp; Existing Conditions
            </h2>
            <p className="text-xs sm:text-sm text-gray-400">
              Select all conditions that apply to you, or choose &ldquo;None of the above&rdquo;.
            </p>
          </div>

          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs">
            <div className="flex flex-wrap gap-2">
              {MEDICAL_CONDITIONS_LIST.map((condition) => {
                const isSelected = selectedConditions.has(condition);
                return (
                  <button
                    key={condition}
                    type="button"
                    onClick={() => handleToggleCondition(condition)}
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-[13.5px] sm:text-sm font-medium transition cursor-pointer text-left border ${
                      isSelected
                        ? "bg-[#FFD3AC]/25 border-[#FFD3AC] text-[#FFD3AC] font-semibold"
                        : "bg-white/5 border-white/10 text-white/80 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded-full flex items-center justify-center border text-[10px] ${
                        isSelected
                          ? "bg-[#FFD3AC] border-[#FFD3AC] text-[#1E1E1E]"
                          : "border-white/30 text-transparent bg-transparent"
                      }`}
                    >
                      ✓
                    </span>
                    <span>{condition}</span>
                  </button>
                );
              })}

              <button
                type="button"
                onClick={handleToggleNoneConditions}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-[13.5px] sm:text-sm font-semibold transition cursor-pointer border ${
                  noneConditions
                    ? "bg-[#FFD3AC]/25 border-[#FFD3AC] text-[#FFD3AC]"
                    : "bg-white/5 border-white/10 text-white/80 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span
                  className={`w-4 h-4 rounded-full flex items-center justify-center border text-[10px] ${
                    noneConditions
                      ? "bg-[#FFD3AC] border-[#FFD3AC] text-[#1E1E1E]"
                      : "border-white/30 text-transparent bg-transparent"
                  }`}
                >
                  ✓
                </span>
                <span>None of the above</span>
              </button>
            </div>
          </div>
        </section>

        {/* ================================================================ */}
        {/* SECTION 4: CLINICAL & LIFESTYLE ASSESSMENT                       */}
        {/* ================================================================ */}
        <section className="space-y-4">
          <div className="border-b border-white/10 pb-4 space-y-1">
            <span className="text-xs uppercase tracking-widest font-bold text-[#FFD3AC]">
              PART {hasInitialSpecialty ? "3" : "4"}
            </span>
            <h2
              className="text-2xl sm:text-3xl font-medium text-white"
              style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif" }}
            >
              Digestion, Lifestyle &amp; Clinical Symptoms
            </h2>
            <p className="text-xs sm:text-sm text-gray-400">
              Share details about your daily routine, digestion, sleep, and physical activity.
            </p>
          </div>

          <div className="space-y-3.5">
            {allExtendedSingleQuestions.map((q, idx) => {
              const selectedOpt = extendedAnswers[q.id];
              const isAnswered = selectedOpt !== undefined && selectedOpt !== null;
              return (
                <div
                  key={q.id}
                  className={`rounded-2xl p-4 sm:p-5 space-y-3 border transition ${
                    isAnswered
                      ? "bg-white/[0.04] border-[#FFD3AC]/30"
                      : "bg-white/[0.02] border-white/10"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-6.5 h-6.5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border ${
                      isAnswered
                        ? "bg-[#FFD3AC]/20 border-[#FFD3AC] text-[#FFD3AC]"
                        : "bg-white/10 border-white/20 text-white/80"
                    }`}>
                      {DOSHA_QUESTIONS.length + idx + 1}
                    </span>
                    <h4 className="font-semibold text-white text-[15px] sm:text-base font-sans">{q.question}</h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                    {q.options.map((optText) => {
                      const isSelected = selectedOpt === optText;
                      return (
                        <button
                          key={optText}
                          type="button"
                          onClick={() => handleSelectExtendedSingle(q.id, optText)}
                          className={`p-3 sm:p-3.5 rounded-xl text-left border transition text-sm sm:text-sm font-medium cursor-pointer flex items-center gap-3 ${
                            isSelected
                              ? "border-[#FFD3AC] bg-[#FFD3AC]/20 text-[#FFD3AC] font-semibold shadow-xs"
                              : "border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:border-white/20 hover:text-white"
                          }`}
                        >
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                            isSelected ? "border-[#FFD3AC] bg-[#FFD3AC]" : "border-white/30"
                          }`}>
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-[#1E1E1E]" />}
                          </div>
                          <span className="flex-1">{optText}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* Sticky Bottom Action Bar matching Mobile App */}
      <div className="sticky bottom-0 z-30 bg-[#1B1A18]/95 backdrop-blur-md border-t border-white/10 px-4 sm:px-8 py-3.5 shadow-2xl">
        <div className="max-w-4xl mx-auto space-y-2 text-center">
          <button
            type="button"
            onClick={handleSaveAndContinue}
            disabled={isSaving}
            className="w-full py-4 bg-[#FFD3AC] hover:bg-[#ffe0c4] text-[#1E1E1E] rounded-full font-bold text-sm tracking-wider uppercase shadow-md transition cursor-pointer disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "SAVE & CONTINUE"}
          </button>
          <p className="text-[11px] sm:text-xs text-white/60">
            There&apos;s no wrong answer — just choose whatever feels most true for you.
          </p>
        </div>
      </div>
    </div>
  );
}
