'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import WebLayoutWrapper from '@/components/common/WebLayoutWrapper';
import AmbeBackButton from '@/components/common/AmbeBackButton';
import {
  LockClosedIcon,
  CalendarDaysIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

// ---- Food & Lifestyle Data ----
const vataKaphaFood = {
  Favor: [
    'Warm, Light, and Easily Digestible Foods',
    'Soups, stews, and broths.',
    'Quinoa, millet, and barley.',
    'Carrots, beets, and squash.',
    'Lentils, mung beans, and tofu.',
    'Ginger, turmeric, black pepper, cinnamon, cumin, and mustard seeds.',
    'Ripe fruits such as apples, berries, and cherries.',
    'Small amounts of ghee, sesame oil, and olive oil.'
  ],
  Avoid: [
    'Cold, Heavy, and Oily Foods like ice cream, cheese, and fried items.',
    'Cold beverages and foods.',
    'Excessive sweets and salty snacks.'
  ],
  'Herbal Suggestions': [
    'Triphala - Helps with digestion and detoxification.',
    'Ashwagandha - Stabilizes Vata without increasing Kapha.',
    'Ginger - Excellent for digestion and warming.',
    'Tulsi (Holy Basil) - Supports respiratory health.',
    'Cinnamon and Cardamom - Warming digestive support.'
  ]
};

const vataKaphaLifestyle = {
  'Daily Routine (Dinacharya)': [
    'Establish a regular daily routine to provide stability and structure, helping balance Vata.',
    'Include regular meal times and sleep schedules.'
  ],
  'Exercise': [
    'Engage in regular, moderate exercise to stimulate Kapha and calm Vata, such as yoga, walking, or swimming.',
    'Avoid excessive or overly intense exercise that can increase Vata.'
  ],
  'Meditation and Pranayama': [
    'Practice meditation and deep breathing exercises to calm the mind and balance both doshas.',
    'Techniques like Nadi Shodhana (alternate nostril breathing) can be particularly beneficial.'
  ],
  'Oil Massage (Abhyanga)': [
    'Regular self-massage with warm sesame or sunflower oil to nourish the skin and calm Vata.'
  ],
  'Adequate Rest': [
    'Ensure you get enough rest and avoid overexertion, which can aggravate both Vata and Kapha.'
  ]
};

const vataPittaFood = {
  Favor: [
    'Cooling, Moist, and Nourishing Foods',
    'Fresh fruits and vegetables, especially sweet, juicy, and cooling ones like cucumbers, melons, and leafy greens.',
    'Basmati rice, oats, and quinoa.',
    'Milk, ghee, and soft cheeses, in moderation.',
    'Mung beans and tofu.',
    'Cooling and soothing spices like coriander, cilantro, fennel, cardamom, and turmeric.',
    'Sweet, cooling fruits such as apples, pears, berries, and grapes.',
    'Use moderate amounts of cooling oils like coconut oil and ghee.'
  ],
  Avoid: [
    'Hot, Spicy, and Oily Foods like chilies and excessive garlic.',
    'Fried and greasy foods.',
    'Sour and fermented foods like pickles and vinegar.',
    'Excessive caffeine and alcohol.',
    'Processed snacks and sweets.'
  ],
  'Herbal Suggestions': [
    'Shatavari - Cooling and nourishing.',
    'Brahmi - Calms the nervous system.',
    'Guduchi - Balances immune response.',
    'Aloe Vera - Soothing to digestion.',
    'Coriander and Fennel - Cooling carminatives.'
  ]
};

const vataPittaLifestyle = {
  'Daily Routine (Dinacharya)': [
    'Establish a gentle daily routine with consistent meal and sleep times.',
    'Eat in a calm environment.'
  ],
  'Exercise': [
    'Engage in moderate, calming exercise like yoga, swimming, and walking.',
    'Avoid overly intense activities that increase Pitta.'
  ],
  'Oil Massage (Abhyanga)': [
    'Self-massage with cooling oils like coconut or sunflower oil.'
  ],
  'Hydration and Cooling Practices': [
    'Drink plenty of water and cooling herbal teas.',
    'Use Sheetali pranayama (cooling breath).'
  ],
  'Rest and Environment': [
    'Ensure restful sleep in a cool, calm space.',
    'Avoid excessive heat and sun exposure.'
  ]
};

const kaphaVataFood = {
  Favor: [
    'Warm, Light, and Grounding Foods like soups and stews.',
    'Grains such as oats, rice, quinoa, and barley.',
    'Vegetables like carrots, beets, sweet potatoes, and leafy greens.',
    'Fruits such as berries, apples, and pears.',
    'Limited dairy: warm milk with spices.',
    'Spices like ginger, cinnamon, cumin, and fennel.'
  ],
  Avoid: [
    'Cold, Dry, and Raw Foods.',
    'Heavy and oily foods.',
    'Excessive sweets.'
  ],
  'Herbal Suggestions': [
    'Ashwagandha - Restores vitality and calms Vata.',
    'Triphala - Cleanses digestive tract.',
    'Ginger - Stimulates metabolic fire.',
    'Brahmi - Enhances mental clarity.',
    'Licorice Root - Soothing and grounding.'
  ]
};

const kaphaVataLifestyle = {
  'Routine': ['Maintain a consistent daily routine with regular meals and sleep patterns.'],
  'Exercise': ['Engage in moderate exercises like yoga, brisk walking, and dancing.'],
  'Environment': ['Stay warm and avoid cold, dry, and windy environments.'],
  'Activities': ['Practice grounding activities like meditation, deep breathing exercises, and gentle stretching.'],
  'Sleep': ['Ensure balanced sleep, avoiding excessive or irregular patterns.']
};

const kaphaPittaFood = {
  Favor: [
    'Light, Dry, and Cooling Foods like barley, quinoa, and buckwheat.',
    'Leafy greens, cruciferous vegetables, and legumes.',
    'Fruits such as apples, pears, and berries.',
    "Goat's milk or yogurt in moderation.",
    'Cooling spices like coriander, fennel, turmeric, and mint.'
  ],
  Avoid: [
    'Heavy, Oily, and Fried Foods.',
    'Hot and spicy foods.',
    'Excessive salt and sugary foods.'
  ],
  'Herbal Suggestions': [
    'Triphala - Detoxifies and balances digestion.',
    'Turmeric - Reduces inflammation.',
    'Ginger - Stimulates healthy metabolism.',
    'Guggulu - Cleanses tissues.',
    'Tulsi (Holy Basil) - Clarifies respiratory channels.'
  ]
};

const kaphaPittaLifestyle = {
  'Routine': ['Maintain a balanced routine with activity and relaxation.'],
  'Exercise': ['Engage in regular exercise like walking, swimming, and yoga.'],
  'Environment': ['Avoid hot, humid conditions; prefer cool, dry places.'],
  'Activities': ['Practice calming activities like meditation and spending time in nature.'],
  'Sleep': ['Ensure adequate, restful sleep.']
};

const pittaVataFood = {
  Favor: [
    'Grounding, Cooling, and Nourishing Foods like rice and oats.',
    'Root vegetables such as carrots and sweet potatoes.',
    'Fruits like mangoes, berries, and avocados.',
    'Dairy: warm milk and ghee in moderation.',
    'Spices like ginger, cinnamon, cumin, and fennel.'
  ],
  Avoid: ['Raw, Cold, Dry, and Overly Spicy Foods.'],
  'Herbal Suggestions': [
    'Ashwagandha - Calming adaptogen.',
    'Brahmi - Mind cooler and tonic.',
    'Licorice Root - Cooling demulcent.',
    'Shatavari - Deep nourishment.',
    'Fennel - Gentle cooling carminative.'
  ]
};

const pittaVataLifestyle = {
  'Routine': ['Maintain consistent meal and sleep schedules.'],
  'Exercise': ['Engage in grounding yoga, tai chi, and walking.'],
  'Environment': ['Create a calm, stable environment.'],
  'Activities': ['Practice deep breathing, meditation, and gentle stretching.'],
  'Sleep': ['Ensure restful and consistent sleep.']
};

const pittaKaphaFood = {
  Favor: [
    'Light, Dry, and Cooling Foods like barley and millet.',
    'Leafy greens and legumes.',
    'Fruits such as apples and berries.',
    "Use dairy sparingly; prefer goat's milk or yogurt.",
    'Spices: ginger, black pepper, turmeric, and cumin.'
  ],
  Avoid: ['Heavy, Oily, and Fried Foods.', 'Excessive salt and sugary foods.'],
  'Herbal Suggestions': [
    'Triphala - Digestive detoxifier.',
    'Turmeric - Anti-inflammatory.',
    'Ginger - Supports circulation.',
    'Guggulu - Promotes metabolic balance.',
    'Tulsi (Holy Basil) - Vitalizing and uplifting.'
  ]
};

const pittaKaphaLifestyle = {
  'Routine': ['Maintain a dynamic routine with regular physical activity.'],
  'Exercise': ['Engage in vigorous exercises like running, cycling, and strength training.'],
  'Environment': ['Stay active in stimulating environments.'],
  'Activities': ['Practice Kapalabhati and Bhastrika breathing.'],
  'Sleep': ['Maintain balanced sleep schedule; avoid oversleeping.']
};

const mappings = {
  'vata_kapha': { food: vataKaphaFood, lifestyle: vataKaphaLifestyle },
  'vata_pitta': { food: vataPittaFood, lifestyle: vataPittaLifestyle },
  'kapha_vata': { food: kaphaVataFood, lifestyle: kaphaVataLifestyle },
  'kapha_pitta': { food: kaphaPittaFood, lifestyle: kaphaPittaLifestyle },
  'pitta_vata': { food: pittaVataFood, lifestyle: pittaVataLifestyle },
  'pitta_kapha': { food: pittaKaphaFood, lifestyle: pittaKaphaLifestyle }
};

export default function QuestionnaireResultsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [doshaData, setDoshaData] = useState(null);
  const [isConsultationSet, setIsConsultationSet] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return router.push('/login');
      try {
        const userSnap = await getDoc(doc(db, 'users', user.uid));
        const userData = userSnap.exists() ? userSnap.data() : null;

        if (userData?.is_consultation_set) {
          setIsConsultationSet(true);
        }

        if (!userData?.is_free_questionnaire_completed) {
          setDoshaData(null);
        } else {
          const snap = await getDoc(doc(db, 'users', user.uid, 'questionnaires', 'dosha_questionnaire'));
          setDoshaData(snap.exists() ? snap.data() : null);
        }
      } catch (e) {
        console.error(e);
        setError('Error fetching results');
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, [router]);

  if (loading) {
    return (
      <WebLayoutWrapper>
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <div className="w-12 h-12 border-3 border-[#FFD3AC] border-t-transparent rounded-full animate-spin" />
        </div>
      </WebLayoutWrapper>
    );
  }

  if (error) {
    return (
      <WebLayoutWrapper>
        <div className="flex items-center gap-4 mb-6">
          <AmbeBackButton />
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white tracking-tight">Questionnaire Result</h1>
        </div>
        <p className="text-center text-red-400 mt-8">{error}</p>
      </WebLayoutWrapper>
    );
  }

  if (!doshaData) {
    return (
      <WebLayoutWrapper>
        <div className="flex items-center gap-4 mb-6">
          <AmbeBackButton />
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white tracking-tight">Questionnaire Result</h1>
        </div>
        <div className="flex flex-col items-center justify-center min-h-[340px] text-center space-y-5 bg-[#2D2D30]/85 border border-white/10 rounded-2xl p-8 backdrop-blur-md shadow-xl">
          <div className="w-14 h-14 rounded-full bg-[#FFD3AC]/15 border border-[#FFD3AC]/30 flex items-center justify-center text-[#FFD3AC]">
            <LockClosedIcon className="w-7 h-7" />
          </div>
          <p className="text-base font-medium text-white/90 max-w-sm leading-relaxed">
            Please complete the questionnaire to view your personalized constitution report.
          </p>
          <button
            onClick={() => router.push('/user/menu/questionnaire')}
            className="bg-[#FFD3AC] hover:bg-[#ffe0c4] text-[#1E1E1E] px-8 py-3.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg transition-transform active:scale-95 cursor-pointer"
          >
            COMPLETE QUESTIONNAIRE
          </button>
        </div>
      </WebLayoutWrapper>
    );
  }

  const primary = doshaData.dosha_scores?.primary || 'vata';
  const secondary = doshaData.dosha_scores?.secondary || 'kapha';
  const combo = mappings[`${primary}_${secondary}`] || mappings['vata_kapha'];

  return (
    <WebLayoutWrapper>
      {/* Top Bar with AmbeBackButton */}
      <div className="flex items-center gap-4 mb-6">
        <AmbeBackButton />
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Questionnaire Result
        </h1>
      </div>

      <div className="space-y-6 pb-12">
        {/* Title & Subtitle matching Flutter 1:1 */}
        <div className="text-center space-y-1.5">
          <p className="font-bold text-xs uppercase tracking-widest text-[#FFD3AC]">
            YOUR CONSTITUTION REPORT
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-white">
            Your Personalized Plan
          </h2>
          <p className="text-xs text-white/70">
            Based on your answers — review with your doctor anytime.
          </p>
        </div>

        {/* Dosha Breakdown Badges */}
        <div className="flex items-center justify-center gap-2.5 pt-1">
          <span className="px-4 py-1.5 rounded-full bg-[#FFD3AC]/15 border border-[#FFD3AC]/40 text-[#FFD3AC] text-xs font-bold uppercase tracking-wider">
            Primary: {primary}
          </span>
          <span className="px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/90 text-xs font-bold uppercase tracking-wider">
            Secondary: {secondary}
          </span>
        </div>

        {/* Starting Point Callout Card */}
        <div className="rounded-[20px] border border-[#FFD3AC]/50 bg-[#FFD3AC]/15 p-5 shadow-sm backdrop-blur-sm">
          <div className="flex items-start gap-3">
            <span className="text-[#FFD3AC] text-base leading-none mt-0.5">✦</span>
            <p className="text-xs leading-relaxed">
              <strong className="font-extrabold text-[#FFD3AC]">
                This is a starting point, not a final plan.{' '}
              </strong>
              <span className="text-white/85">
                These results reflect your general constitution — your doctor will refine them based on your specific health history, sensitivities, and any conditions that call for adjustment. This is especially true for tridoshic constitutions, which often respond differently than a single-dosha profile suggests. Always follow your doctor's personalized guidance over any general recommendation here.
              </span>
            </p>
          </div>
        </div>

        {/* Food Recommendations Section */}
        <div className="pt-3">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-[#FFD3AC]/25 flex items-center justify-center text-sm">
              🍽
            </div>
            <h3 className="font-serif text-2xl font-semibold text-white">
              Food Recommendation
            </h3>
          </div>

          {/* Favor Pill */}
          <div className="mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-green-500/50 bg-green-500/10 text-green-400 text-xs font-extrabold">
              <span>✓</span>
              <span>Favor</span>
            </span>
          </div>

          {/* Favor Cards */}
          <div className="space-y-3">
            {combo.food?.Favor?.map((item, idx) => (
              <div
                key={idx}
                className="relative overflow-hidden rounded-2xl bg-[#FFD3AC]/5 border border-[#FFD3AC]/20 p-4 pl-5"
              >
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500 rounded-l-2xl" />
                <p className="text-sm font-medium text-white/90 leading-relaxed">
                  {item}
                </p>
              </div>
            ))}
          </div>

          {/* Avoid Pill */}
          <div className="mt-6 mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-red-500/50 bg-red-500/10 text-red-400 text-xs font-extrabold">
              <span>✕</span>
              <span>Avoid</span>
            </span>
          </div>

          {/* Avoid Cards */}
          <div className="space-y-3">
            {combo.food?.Avoid?.map((item, idx) => (
              <div
                key={idx}
                className="relative overflow-hidden rounded-2xl bg-[#FFD3AC]/5 border border-[#FFD3AC]/20 p-4 pl-5"
              >
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500 rounded-l-2xl" />
                <p className="text-sm font-medium text-white/90 leading-relaxed">
                  {item}
                </p>
              </div>
            ))}
          </div>

          {/* Herbal Suggestions (if present) */}
          {combo.food?.['Herbal Suggestions'] && (
            <div className="mt-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-[#FFD3AC]/25 flex items-center justify-center text-xs text-[#FFD3AC]">
                  ❀
                </div>
                <h3 className="font-serif text-2xl font-semibold text-white">
                  Herbal Suggestions
                </h3>
              </div>
              <div className="space-y-3">
                {combo.food['Herbal Suggestions'].map((item, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl bg-[#FFD3AC]/5 border border-[#FFD3AC]/20 p-4 flex items-start gap-3"
                  >
                    <div className="w-7 h-7 rounded-full bg-[#FFD3AC]/20 flex items-center justify-center text-[#FFD3AC] text-xs flex-shrink-0 mt-0.5">
                      ✦
                    </div>
                    <p className="text-sm font-medium text-[#FFD3AC] leading-relaxed">
                      {item}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Lifestyle Suggestions Section */}
        <div className="pt-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-[#FFD3AC]/25 flex items-center justify-center text-xs text-[#FFD3AC]">
              ☉
            </div>
            <h3 className="font-serif text-2xl font-semibold text-white">
              Lifestyle Suggestions
            </h3>
          </div>

          <div className="space-y-3">
            {Object.entries(combo.lifestyle || {}).map(([sectionTitle, items]) => (
              <div
                key={sectionTitle}
                className="rounded-2xl bg-[#FFD3AC]/5 border border-[#FFD3AC]/20 p-4"
              >
                <h4 className="font-bold text-white text-base mb-2">
                  {sectionTitle}
                </h4>
                <div className="space-y-1.5">
                  {Array.isArray(items) ? (
                    items.map((it, idx) => (
                      <p key={idx} className="text-sm text-white/70 leading-relaxed">
                        {it}
                      </p>
                    ))
                  ) : (
                    <p className="text-sm text-white/70 leading-relaxed">
                      {items}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Schedule Consultation Button */}
        {!isConsultationSet && (
          <div className="pt-6 flex justify-center">
            <button
              onClick={() => router.push('/user/consult')}
              className="inline-flex items-center gap-2.5 bg-[#FFD3AC] hover:bg-[#ffe0c4] text-[#1E1E1E] px-8 py-4 rounded-full font-bold text-sm tracking-wide uppercase shadow-lg transition-transform active:scale-95 cursor-pointer"
            >
              <CalendarDaysIcon className="w-5 h-5 text-[#1E1E1E]" />
              <span>Schedule Consultation</span>
            </button>
          </div>
        )}
      </div>
    </WebLayoutWrapper>
  );
}

