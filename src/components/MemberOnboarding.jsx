'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

export default function MemberOnboarding({ onFinish }) {
  const pages = [
    {
      title: 'Welcome to Ambe',
      desc: 'Complete the questionnaire',
    },
    {
      title: 'Stay Informed',
      desc: 'Allow notifications for reminders & tips',
    },
    {
      title: 'Capture Your Journey',
      desc: 'Enable camera to upload photos',
    },
    {
      title: 'Speak Your Mind',
      desc: 'Enable mic to send voice messages',
    },
  ];

  const [index, setIndex] = useState(0);
  const isLast = index === pages.length - 1;

  const handleNext = () => {
    if (isLast) {
      onFinish();
    } else {
      setIndex((i) => i + 1);
    }
  };

  return (
    <div className="fixed inset-0 bg-cover bg-center" style={{
      backgroundImage: "url('/images/background/magnolia_flowers.jpg')"
    }}>
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative z-10 flex flex-col h-full p-6 text-white">
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="flex-1 flex flex-col justify-center"
        >
          <h1 className="text-3xl font-bold mb-4">{pages[index].title}</h1>
          <p className="mb-8">{pages[index].desc}</p>
        </motion.div>
        <button
          onClick={handleNext}
          className="self-end bg-green-500 px-6 py-3 rounded-full font-semibold"
        >
          {isLast ? 'FINISH' : 'NEXT'}
        </button>
        <div className="flex justify-center space-x-2 mt-4">
          {pages.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full ${
                i === index ? 'bg-white' : 'bg-white/50'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}