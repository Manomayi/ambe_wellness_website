'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

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
    'Triphala',
    'Ashwagandha',
    'Ginger',
    'Tulsi (Holy Basil)',
    'Cinnamon and Cardamom'
  ]
};

const vataKaphaLifestyle = {
  'Daily Routine (Dinacharya)': [
    'Establish a regular daily routine to provide stability and structure, helping balance Vata.',
    'Include regular meal times and sleep schedules.'
  ],
  Exercise: [
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
    'Shatavari',
    'Brahmi',
    'Guduchi',
    'Aloe Vera',
    'Coriander and Fennel'
  ]
};

const vataPittaLifestyle = {
  'Daily Routine (Dinacharya)': [
    'Establish a gentle daily routine with consistent meal and sleep times.',
    'Eat in a calm environment.'
  ],
  Exercise: [
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
    'Ashwagandha',
    'Triphala',
    'Ginger',
    'Brahmi',
    'Licorice Root'
  ]
};

const kaphaVataLifestyle = {
  Routine: ['Maintain a consistent daily routine with regular meals and sleep patterns.'],
  Exercise: ['Engage in moderate exercises like yoga, brisk walking, and dancing.'],
  Environment: ['Stay warm and avoid cold, dry, and windy environments.'],
  Activities: ['Practice grounding activities like meditation, deep breathing exercises, and gentle stretching.'],
  Sleep: ['Ensure balanced sleep, avoiding excessive or irregular patterns.']
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
  'Herbal Suggestions': ['Triphala', 'Turmeric', 'Ginger', 'Guggulu', 'Tulsi (Holy Basil)']
};

const kaphaPittaLifestyle = {
  Routine: ['Maintain a balanced routine with activity and relaxation.'],
  Exercise: ['Engage in regular exercise like walking, swimming, and yoga.'],
  Environment: ['Avoid hot, humid conditions; prefer cool, dry places.'],
  Activities: ['Practice calming activities like meditation and spending time in nature.'],
  Sleep: ['Ensure adequate, restful sleep.']
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
  'Herbal Suggestions': ['Ashwagandha', 'Brahmi', 'Licorice Root', 'Shatavari', 'Fennel']
};

const pittaVataLifestyle = {
  Routine: ['Maintain consistent meal and sleep schedules.'],
  Exercise: ['Engage in grounding yoga, tai chi, and walking.'],
  Environment: ['Create a calm, stable environment.'],
  Activities: ['Practice deep breathing, meditation, and gentle stretching.'],
  Sleep: ['Ensure restful and consistent sleep.']
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
  'Herbal Suggestions': ['Triphala', 'Turmeric', 'Ginger', 'Guggulu', 'Tulsi (Holy Basil)']
};

const pittaKaphaLifestyle = {
  Routine: ['Maintain a dynamic routine with regular physical activity.'],
  Exercise: ['Engage in vigorous exercises like running, cycling, and strength training.'],
  Environment: ['Stay active in stimulating environments.'],
  Activities: ['Practice Kapalabhati and Bhastrika breathing.'],
  Sleep: ['Maintain balanced sleep schedule; avoid oversleeping.']
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
  const [error, setError] = useState('');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return router.push('/login');
      try {
        const snap = await getDoc(doc(db, 'users', user.uid, 'questionnaires', 'dosha_questionnaire'));
        setDoshaData(snap.exists() ? snap.data() : null);
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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-4 border-green-600 border-t-transparent" />
      </div>
    );
  }
  if (error) {
    return <p className="text-center text-red-600 mt-8">{error}</p>;
  }
  if (!doshaData) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <p className="text-gray-800">Please complete the questionnaire</p>
        <button
          onClick={() => router.push('/user/menu/questionnaire')}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg shadow"
        >
          Complete Questionnaire
        </button>
      </div>
    );
  }

  const primary = doshaData.dosha_scores.primary;
  const secondary = doshaData.dosha_scores.secondary;
  const combo = mappings[`${primary}_${secondary}`] || mappings['vata_kapha'];

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-bold text-center text-gray-800">
        Your Unique Constitution
      </h1>
      <RecommendationsSection title="Food Recommendations" data={combo.food} />
      <RecommendationsSection title="Lifestyle Suggestions" data={combo.lifestyle} />
    </div>
  );
}

function RecommendationsSection({ title, data }) {
  return (
    <div>
      <h2 className="text-sm uppercase font-semibold text-gray-600 mb-4">{title}</h2>
      <div className="space-y-4">
        {Object.entries(data).map(([sectionTitle, items]) => (
          <div
            key={sectionTitle}
            className="bg-white rounded-lg shadow p-4"
          >
            <h3 className="font-bold text-gray-800 mb-2">{sectionTitle}</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              {items.map((item, idx) => item && <li key={idx}>{item}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
