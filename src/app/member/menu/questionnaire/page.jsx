'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { auth, db } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import {
  doc,
  writeBatch,
  setDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore'

const questions = [
  "Body size?",
  "Body weight?",
  "Weight change?",
  "Skin type?",
  "Skin texture?",
  "Hair?",
  "Hair color?",
  "Teeth?",
  "Nose?",
  "Eyes?",
  "Eye color?",
  "Nails?",
  "Lip?",
  "Lip color?",
  "Chin?",
  "Cheeks?",
  "Neck?",
  "Chest?",
  "Belly?",
  "Bellybutton?",
  "Hips?",
  "Joints?",
  "Taste preference?",
  "Thirst?",
  "Digestion?",
  "When there is indigestion?",
  "Elimination?",
  "Physical activity?",
  "Mental activity?",
  "Personality?",
  "Emotional response when stressed?",
  "Faith or beliefs?",
  "Intellectual response?",
  "Memory?",
  "Career, life preference?",
  "Environment?",
  "Sleep?",
  "Dreams?",
  "Speech?",
  "Financial?",
  "Cravings?",
  "Pain?",
  "Seasonal allergies?",
  "Food sensitivity?",
  "Sweating?",
  "Muscle reactivity?",
  "Bone and joints?",
  "Circulation?"
]

const options = [
  ["Thin build","Medium build","Large build"],
  ["Low","Medium","Heavy Side"],
  ["Trouble gaining","Can gain but lose quickly","Gains weight easily, hard to lose"],
  ["Thin, dry","Smooth combination skin","Thick, oily"],
  ["Cold, roughness, light color","Warm, reddish, freckles","Cool, pale"],
  ["Dry, brittle, scarce, knotted","Straight, oily, prone to hair loss","Thick, curly, oily, wavy"],
  ["Brown, black","Blond, gray, red","Dark black, dark brown"],
  ["Big, roomy, stick out, thin gums","Medium size, soft, tender gums","Healthy, white, strong gums"],
  ["Uneven shape, deviated septum","Long, pointed, red nose tip","Short, rounded, button nose"],
  ["Small, sunken, dry, active, frequent blinking","Sharp, sensitive to light","Big, calm"],
  ["Black, brown","Bright gray, green, yellow / red","Blue"],
  ["Dry, rough, easily broken","Sharp, flexible, long, reddish tint","Thick, smooth, shiny surface"],
  ["Dry, cracked","Often inflamed","Smooth, large"],
  ["Black or brown tint","Red or yellowish","Pale"],
  ["Thin and angular","Tapered","Rounded, big"],
  ["Sunken, lines or wrinkles","Flat and smooth","Big or round"],
  ["Long, thin","Medium","Wide"],
  ["Small, flat","Moderate","Broad chested"],
  ["Small, flat","Moderate","Large, defined"],
  ["Small, irregular","Oval, superficial","Big, deep, round"],
  ["Small or thin","Moderate","Big"],
  ["Cracking noise","Moderate","Large, lubricated"],
  ["Bitter, pungent, astringent","Sweet, bitter, astringent","Sweet, sour, salty"],
  ["Variable","Need water regularly","Sparse need for water"],
  ["Irregular","Quick","Slow"],
  ["Tendency to constipation, forms gas","Causes burning, heartburn, reflux","Forms mucous"],
  ["Dry","Loose","Thick, sluggish"],
  ["Always active","Moderate","Slow, measured"],
  ["Always active","Moderate","Calm"],
  ["Vivacious, talkative, social, outgoing","Likes to be in control, intense, ambitious","Reserved, laid back, concerned"],
  ["Anxiety, fear","Anger, jealousy","Greedy, possessive, withdrawn"],
  ["Variable","Dedicated/strong","Consistent"],
  ["Quick, not detailed","Accurate, timely","Paced but exact"],
  ["Good short term, quick to forget","Medium but accurate","Slow to remember but then sustained"],
  ["Creative arts, designing","Science or engineering","Management, human relations, caregiving"],
  ["Easily feels cold","Intolerant of heat","Uncomfortable in humidity"],
  ["Short, broken up","Moderate and sound","Deep and long"],
  ["Multiple and quick, fearful","Fiery, often about conflicts","Slow, romantic"],
  ["Rapid, hither thither","Precise, articulate","Slow, monotonous"],
  ["Buy on impulse","Spends money on luxuries","Good at saving money"],
  ["Fried hot sharp dry meat or spicy","Sweets, cooling foods & drinks","Wine or alcohol"],
  ["Shifting, tearing","Excruciating with breathlessness, fear & tachycardia","Sucking pain with fever, nausea & irritability"],
  ["Breathlessness wheezing runny nose","Hives watery eyes rash","Itching eyes irritation"],
  ["Leftovers","Dry fruits raw hot spicy","Sour fermented dairy"],
  ["Scanty/no sweat","Excess profuse","Cold/clammy"],
  ["Twitching cramping weakness numbness","Spasms bruising tenderness","Tumors cysts weakness"],
  ["Painful popping cracking stiffness","Scoliosis inflamed tender arthritis","Swollen rigid painful"],
  ["Cold poor anemia","Hypertension varicosities","Edema fluid retention lymp stasis"]
]

export default function QuestionnairePage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [selected, setSelected] = useState(Array(questions.length).fill(null))
  const [loading, setLoading] = useState(false)

  // ensure logged in
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      if (!u) return router.push('/login')
      setUser(u)
    })
    return () => unsub()
  }, [router])

  // auto‐advance on select
  const choose = i => {
    setSelected(sel => {
      const next = [...sel]
      next[currentPage] = i
      return next
    })
    if (currentPage < questions.length - 1) {
      setCurrentPage(p => p + 1)
    }
  }

  const back = () => setCurrentPage(p => Math.max(0, p - 1))

  const submit = async () => {
    setLoading(true)
    // tally
    let v=0,p=0,k=0
    selected.forEach(s => {
      if (s===0) v++ 
      else if (s===1) p++
      else if (s===2) k++
    })
    let primary, secondary
    if (v>=p && v>=k) {
      primary='vata'; secondary = p>=k?'pitta':'kapha'
    } else if (p>=v && p>=k) {
      primary='pitta'; secondary = v>=k?'vata':'kapha'
    } else {
      primary='kapha'; secondary = v>=p?'vata':'pitta'
    }

    // build results map
    const results = {}
    questions.forEach((q, idx) => results[q] = options[idx][ selected[idx] ?? 0 ])

    const tally = { column_1:v, column_2:p, column_3:k }
    const dosha_scores = { primary, secondary }

    try {
      const batch = writeBatch(db)
      const qRef = doc(db, 'patients', user.uid, 'questionnaires', 'dosha_questionnaire')
      batch.set(qRef, {
        results, tally, dosha_scores, timestamp: serverTimestamp()
      })
      const uRef = doc(db, 'patients', user.uid)
      batch.update(uRef, { is_free_questionnaire_completed: true })
      await batch.commit()
      router.push('/member/payment')
    } catch(err) {
      console.error(err)
      alert('Failed to save, please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  return (
    <div className="max-w-xl mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Questionnaire</h1>
      </div>

      <div className="border bg-white rounded-lg p-6 space-y-4">
        <h2 className="text-xl font-semibold text-center">
          {questions[currentPage]}
        </h2>
        <div className="space-y-2">
          {options[currentPage].map((opt,i) => (
            <label key={i} className="flex items-center space-x-2">
              <input
                type="radio"
                name={`q${currentPage}`}
                checked={selected[currentPage]===i}
                onChange={()=>choose(i)}
                className="form-radio text-green-600"
              />
              <span>{opt}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex justify-between">
        {currentPage>0 
          ? <button onClick={back} className="px-4 py-2 bg-gray-200 rounded">Back</button>
          : <div/>
        }
        {currentPage === questions.length-1
          ? <button 
              onClick={submit} 
              disabled={loading} 
              className="px-6 py-2 bg-green-600 text-white rounded disabled:opacity-50"
            >
              {loading?'Saving…':'Complete'}
            </button>
          : null
        }
      </div>
    </div>
  )
}