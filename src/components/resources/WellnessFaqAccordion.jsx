"use client";

import React, { useState } from "react";

const FAQ_ITEMS = [
  {
    category: "Getting Started",
    question: "What is Ambé Wellness?",
    answer:
      "Ambé Wellness is a holistic tele-wellness platform connecting you with integrative doctors trained in Ayurvedic medicine and modern clinical science — through video consultations, personalized protocols, and ongoing messaging.",
  },
  {
    category: "Getting Started",
    question: "How do I get started?",
    answer:
      "Book a free consult, complete your wellness intake, and get matched with an integrative doctor. From there, you can choose a membership plan or pay as you like for individual consultations.",
  },
  {
    category: "Plans & Pricing",
    question: "How much does membership cost?",
    answer:
      "Membership starts at $50 per month with a 3-month minimum commitment. Everything is included — consultations, medicines, and unlimited messaging with your care team.",
  },
  {
    category: "Plans & Pricing",
    question: "What is Pay As You Like?",
    answer:
      "Pay As You Like lets you book individual consultations without a monthly membership. There is no minimum commitment, and supplements are purchased separately.",
  },
  {
    category: "Products & Remedies",
    question: "Are medicines included in membership?",
    answer:
      "Yes. Your membership includes personalized Ayurvedic remedies and formulations prescribed by your integrative doctor — no hidden fees for the medicines themselves.",
  },
  {
    category: "Products & Remedies",
    question: "Where do your products come from?",
    answer:
      "Ambé remedies are sourced from trusted Ayurvedic suppliers and compounded under doctor supervision. All products include required FDA supplement disclaimers.",
  },
  {
    category: "Your Doctor",
    question: "Who are Ambé practitioners?",
    answer:
      "Ambé practitioners hold BAMS degrees (Bachelor of Ayurvedic Medicine and Surgery) from accredited institutions. They are trained integrative doctors — not generic wellness coaches.",
  },
  {
    category: "Your Doctor",
    question: "Can I message my doctor between visits?",
    answer:
      "Yes. Membership includes unlimited messaging with your integrative doctor and care team throughout the month.",
  },
  {
    category: "Your Wellness Plan",
    question: "How is my plan personalized?",
    answer:
      "Your doctor uses your intake questionnaire, constitutional assessment, lifestyle data, and optional lab biomarkers to build a protocol tailored to your unique mind-body constitution.",
  },
  {
    category: "Your Wellness Plan",
    question: "Do I need lab tests?",
    answer:
      "Labs are optional but recommended for hormone health, metabolic markers, and other areas where biomarkers add clinical precision. Your doctor will advise what is right for you.",
  },
  {
    category: "Privacy & Safety",
    question: "Is my health information secure?",
    answer:
      "Yes. Your wellness information is encrypted in transit and at rest. We do not sell, license, or share your health data with advertisers or unaffiliated third parties.",
  },
  {
    category: "Privacy & Safety",
    question: "Is Ayurveda a licensed medical practice?",
    answer:
      "Ayurveda is not a state-licensed medical practice in the United States. Ambé consultations provide traditional Ayurvedic wellness education and support — not conventional medical diagnosis or treatment.",
  },
  {
    category: "Understanding Ayurveda",
    question: "What is Ayurveda?",
    answer:
      "Ayurveda is one of the world's oldest systems of traditional medicine, originating in India over 5,000 years ago. It focuses on balancing mind, body, and spirit through diet, lifestyle, herbs, and personalized protocols.",
  },
  {
    category: "Understanding Ayurveda",
    question: "How does Ayurveda work with modern science?",
    answer:
      "Ambé integrates time-tested Ayurvedic principles with modern clinical frameworks — including biomarkers, epigenetics, and evidence-based lifestyle medicine — under doctor-supervised protocols.",
  },
  {
    category: "Understanding Ayurveda",
    question: "What is a dosha?",
    answer:
      "In Ayurveda, doshas (Vata, Pitta, Kapha) describe your unique constitutional type. Understanding your dosha helps your integrative doctor personalize diet, remedies, and lifestyle recommendations.",
  },
];

export default function WellnessFaqAccordion() {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <section className="py-12 sm:py-16 md:py-20" style={{ backgroundColor: "#E5E5E5" }}>
      <div className="max-w-3xl mx-auto px-6 sm:px-8">
        <div
          className="text-2xl sm:text-3xl md:text-4xl text-center mb-8 sm:mb-10"
          style={{ color: "#353535", fontFamily: "Richmond" }}
        >
          Q&amp;A
        </div>
        <div className="space-y-3">
          {FAQ_ITEMS.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div key={item.question} className="bg-white rounded-lg overflow-hidden border border-[#E7E2D9]">
                <button
                  type="button"
                  className="w-full flex items-center justify-between gap-4 p-5 text-left"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  aria-expanded={isOpen}
                >
                  <div>
                    <div className="text-xs uppercase tracking-widest mb-1" style={{ color: "#C8996A" }}>
                      {item.category}
                    </div>
                    <div className="font-medium" style={{ color: "#353535" }}>
                      {item.question}
                    </div>
                  </div>
                  <span className="text-xl flex-shrink-0" style={{ color: "#C8996A" }}>
                    {isOpen ? "−" : "+"}
                  </span>
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-sm leading-relaxed" style={{ color: "#535353" }}>
                    {item.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
