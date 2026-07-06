export const RESOURCE_CATEGORIES = [
  "All",
  "Food & Kitchen",
  "Body Care",
  "Herbs & Remedies",
  "Detox & Cleansing",
  "Mental Wellness",
  "Home Environment",
  "Ayurveda Basics",
  "Recipes",
];

/** Primary 6 guides shown in the main grid when "All" is selected */
export const FEATURED_GUIDE_IDS = [
  "clean-body-care",
  "home-apothecary",
  "seasonal-detox",
  "home-environment",
  "anti-inflammatory-foods",
  "mental-wellness",
];

export const RESOURCE_GUIDES = [
  {
    id: "clean-body-care",
    category: "Body Care",
    image: "/images/education/safe_use.png",
    imageAlt: "Clean body care",
    title: "Clean Body Care: What to Use & What to Avoid",
    summary:
      "A doctor-curated guide to non-toxic personal care — from deodorants to skincare, shampoo to sunscreen.",
    downloadTitle: "Clean Body Care Guide",
  },
  {
    id: "home-apothecary",
    category: "Herbs & Remedies",
    image: "/images/education/precision_formula.png",
    imageAlt: "Ayurvedic herbs",
    title: "The Ayurvedic Home Apothecary",
    summary:
      "Ten foundational herbs every household should have — how to use them, when to use them, and what to avoid combining.",
    downloadTitle: "Ayurvedic Home Apothecary",
  },
  {
    id: "seasonal-detox",
    category: "Detox & Cleansing",
    image: "/images/education/lab_work.png",
    imageAlt: "Detox guide",
    title: "Seasonal Detox Protocol: Spring & Fall Reset",
    summary:
      "A gentle, doctor-guided cleanse you can do at home — no fasting required, no extreme protocols.",
    downloadTitle: "Seasonal Detox Protocol",
  },
  {
    id: "home-environment",
    category: "Home Environment",
    image: "/images/education/truth_behind.png",
    imageAlt: "Home environment",
    title: "Detox Your Home: Room by Room",
    summary:
      "Step-by-step plans for removing toxins from your living space — from cleaning products to plastics to EMF reduction.",
    downloadTitle: "Detox Your Home Guide",
  },
  {
    id: "anti-inflammatory-foods",
    category: "Food & Kitchen",
    image: "/images/home/hands.png",
    imageAlt: "Anti-inflammatory foods",
    title: "Anti-Inflammatory Foods: The Master List",
    summary:
      "Organized by dosha, season, and health goal — the definitive Ambé food guide for reducing systemic inflammation.",
    downloadTitle: "Anti-Inflammatory Foods Guide",
  },
  {
    id: "mental-wellness",
    category: "Mental Wellness",
    image: "/images/enterprise/holistic-care-1.png",
    imageAlt: "Mental wellness",
    title: "Brain & Mental Health: An Ayurvedic Guide",
    summary:
      "Based on Dr. Vasant Lad's teachings — a practical framework for supporting cognitive health, mood, and nervous system balance.",
    downloadTitle: "Brain & Mental Health Guide",
  },
  {
    id: "ayurveda-basics",
    category: "Ayurveda Basics",
    image: "/images/enterprise/holistic-care-2.png",
    imageAlt: "Ayurveda basics",
    title: "Ayurveda Foundations: Know Your Constitution",
    summary:
      "Doshas, agni, and daily rhythms — the essentials for understanding how Ayurvedic care is personalized.",
    downloadTitle: "Ayurveda Foundations Guide",
  },
  {
    id: "seasonal-recipes",
    category: "Recipes",
    image: "/images/home/step1.png",
    imageAlt: "Seasonal recipes",
    title: "Seasonal Ayurvedic Recipes",
    summary:
      "Simple, nutrient-dense, healing meals, cooling drinks, and snacks rooted in Ayurvedic tradition.",
    downloadTitle: "Seasonal Recipe Collection",
  },
];

export function filterGuides(guides, category) {
  if (category === "All") {
    return FEATURED_GUIDE_IDS.map((id) => guides.find((g) => g.id === id)).filter(
      Boolean
    );
  }
  return guides.filter((guide) => guide.category === category);
}
