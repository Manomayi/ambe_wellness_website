'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { onAuthStateChanged } from 'firebase/auth'
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  getDocs,
  startAfter,
  limit,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { auth, db } from '@/lib/firebase/config'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { PaperAirplaneIcon } from '@heroicons/react/24/solid'

export default function MessageUserClient() {
  const router = useRouter()
  const params = useSearchParams()
  const chatId = params.get('chatId')
  const userName = params.get('userName')
  const userPhotoUrl = params.get('userPhotoUrl')

  const [user, setUser] = useState(null)
  const [messages, setMessages] = useState([])
  const [lastVisible, setLastVisible] = useState(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)

  const containerRef = useRef(null)
  const endRef = useRef(null)
  const BATCH = 10

  // 1) Auth + initial batch
  useEffect(() => {
    if (!chatId) return
    const unsubAuth = onAuthStateChanged(auth, u => {
      if (!u) return router.push('/login')
      setUser(u)

      const col = collection(db, 'chats', chatId, 'messages')
      const q0 = query(col, orderBy('timestamp', 'desc'), limit(BATCH))
      const unsubSnap = onSnapshot(q0, snap => {
        const docs = snap.docs
        if (!docs.length) return
        const batch = docs.map(d => ({ id: d.id, ...d.data() })).reverse()
        setMessages(batch)
        setLastVisible(docs[docs.length - 1])
        setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'auto' }), 50)
      })
      return () => unsubSnap()
    })
    return () => unsubAuth()
  }, [chatId, router])

  // 2) Load older
  const loadMore = useCallback(async () => {
    if (loadingMore || !user || !chatId || !lastVisible) return
    setLoadingMore(true)
    const col = collection(db, 'chats', chatId, 'messages')
    const qN = query(col, orderBy('timestamp', 'desc'), startAfter(lastVisible), limit(BATCH))
    const snap = await getDocs(qN)
    if (snap.docs.length) {
      const older = snap.docs.map(d => ({ id: d.id, ...d.data() })).reverse()
      setMessages(prev => [...older, ...prev])
      setLastVisible(snap.docs[snap.docs.length - 1])
    }
    setLoadingMore(false)
  }, [user, chatId, lastVisible, loadingMore])

  // 3) scroll handler
  const onScroll = () => {
    const el = containerRef.current
    if (el && el.scrollTop < 100) loadMore()
  }

  // 4) send
  const handleSend = async () => {
    if (!text.trim() || !user || !chatId) return
    setSending(true)
    const col = collection(db, 'chats', chatId, 'messages')
    await addDoc(col, { sender_uid: user.uid, text: text.trim(), timestamp: serverTimestamp() })
    setText('')
    setSending(false)
  }

  if (!chatId) return null

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="flex items-center p-4 bg-white shadow">
        <button onClick={() => router.back()} className="p-2 rounded-full hover:bg-gray-100">
          <ArrowLeftIcon className="h-6 w-6 text-gray-600" />
        </button>
        {userPhotoUrl && (
          <img src={userPhotoUrl} alt={userName||''}
               className="h-10 w-10 rounded-full mx-3 object-cover" />
        )}
        <h1 className="text-lg font-medium text-gray-800">{userName}</h1>
      </div>

      {/* Messages */}
      <div ref={containerRef}
           className="flex-1 overflow-y-auto p-4"
           onScroll={onScroll}>
        {loadingMore && (
          <div className="flex justify-center mb-2">
            <svg className="animate-spin h-6 w-6 text-gray-500" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
              <path fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
          </div>
        )}
        {messages.map(msg => {
          const isUser = msg.sender_uid === user?.uid
          const time = msg.timestamp?.toDate?.().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }) || ''
          return (
            <div key={msg.id} className={`mb-2 flex ${isUser?'justify-end':'justify-start'}`}>
              <div className={`max-w-xs p-3 rounded-lg ${
                isUser?'bg-green-600 text-white':'bg-gray-300 text-gray-800'
              }`}>
                <p className="break-words">{msg.text}</p>
                <p className="text-xs mt-1 text-gray-200 text-right">{time}</p>
              </div>
            </div>
          )
        })}
        <div ref={endRef}/>
      </div>

      {/* Input */}
      <div className="p-4 bg-white flex items-center">
        <textarea rows={1}
                  value={text}
                  onChange={e => setText(e.target.value)}
                  className="flex-1 resize-none p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
                  placeholder="Type a message…"/>
        <button onClick={handleSend} disabled={sending}
                className={`ml-3 p-3 rounded-full text-white shadow ${
                  sending?'bg-gray-400':'bg-green-600 hover:bg-green-700'
                }`}>
          <PaperAirplaneIcon className="h-5 w-5 transform rotate-90"/>
        </button>
      </div>
    </div>
  )
}