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
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { auth, db, storage } from '@/lib/firebase/config'
import { ArrowLeftIcon, PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { PaperAirplaneIcon } from '@heroicons/react/24/solid'
import AmbeBackButton from '@/components/common/AmbeBackButton'

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
  const [selectedImage, setSelectedImage] = useState(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null)
  const [uploadingImage, setUploadingImage] = useState(null)
  const [convertingHeic, setConvertingHeic] = useState(false)
  const [fullscreenImage, setFullscreenImage] = useState(null)

  const containerRef = useRef(null)
  const endRef = useRef(null)
  const fileInputRef = useRef(null)
  const BATCH = 15

  useEffect(() => {
    if (uploadingImage) {
      endRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [uploadingImage])

  // 1) Auth + initial batch
  useEffect(() => {
    if (!chatId) return
    const unsubAuth = onAuthStateChanged(auth, u => {
      if (!u) return router.push('/login')
      setUser(u)

      const col = collection(db, 'chats', chatId, 'messages')
      const q0 = query(col, orderBy('timestamp', 'desc'), limit(BATCH))
      const unsubSnap = onSnapshot(
        q0,
        snap => {
          const docs = snap.docs
          if (!docs.length) return
          const batch = docs.map(d => ({ id: d.id, ...d.data() })).reverse()
          setMessages(batch)
          setLastVisible(docs[docs.length - 1])
          setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'auto' }), 50)
        },
        err => {
          if (err?.code === 'permission-denied') return
          console.error('Error listening to chat messages:', err)
        }
      )
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

  // 4) image handling
  const convertHeicToJpeg = async (file) => {
    try {
      const heic2any = (await import('heic2any')).default
      const blob = await heic2any({
        blob: file,
        toType: 'image/jpeg',
        quality: 0.85,
      })
      const convertedBlob = Array.isArray(blob) ? blob[0] : blob
      return new File(
        [convertedBlob],
        file.name.replace(/\.[^/.]+$/, "") + ".jpg",
        { type: 'image/jpeg' }
      )
    } catch (err) {
      console.error("HEIC conversion failed:", err)
      return file
    }
  }

  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    const lowerName = file.name.toLowerCase()
    const isHeic = lowerName.endsWith('.heic') || lowerName.endsWith('.heif') || file.type === 'image/heic' || file.type === 'image/heif'
    const isStandardImage = file.type.startsWith('image/') || /\.(jpe?g|png|webp|gif)$/i.test(lowerName)

    if (!isHeic && !isStandardImage) {
      alert('Please select a valid image (JPEG, PNG, WebP, GIF, or HEIC).')
      return
    }

    if (isHeic) {
      setConvertingHeic(true)
      try {
        const converted = await convertHeicToJpeg(file)
        setSelectedImage(converted)
        setImagePreviewUrl(URL.createObjectURL(converted))
      } catch (err) {
        console.error(err)
        alert('Failed to process HEIC image.')
      } finally {
        setConvertingHeic(false)
      }
    } else {
      setSelectedImage(file)
      setImagePreviewUrl(URL.createObjectURL(file))
    }
  }

  const removeSelectedImage = () => {
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl)
    setSelectedImage(null)
    setImagePreviewUrl(null)
  }

  // 5) send
  const handleSend = async () => {
    const trimmed = text.trim()
    if ((!trimmed && !selectedImage) || !user || !chatId || sending) return
    setSending(true)

    const imgToUpload = selectedImage
    const previewToRevoke = imagePreviewUrl

    if (imgToUpload && previewToRevoke) {
      setUploadingImage({ url: previewToRevoke, caption: trimmed })
    }

    setText('')
    setSelectedImage(null)
    setImagePreviewUrl(null)
    setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)

    try {
      let imageUrl = null
      if (imgToUpload) {
        const timestamp = Date.now()
        const cleanFileName = imgToUpload.name.replace(/[^a-zA-Z0-9._-]/g, '_')
        const imgRef = storageRef(storage, `chats/${chatId}/images/${timestamp}_${cleanFileName}`)
        const uploadResult = await uploadBytes(imgRef, imgToUpload, {
          contentType: imgToUpload.type || 'image/jpeg',
        })
        imageUrl = await getDownloadURL(uploadResult.ref)
      }

      const col = collection(db, 'chats', chatId, 'messages')
      const msgData = {
        sender_uid: user.uid,
        text: trimmed,
        timestamp: serverTimestamp(),
      }
      if (imageUrl) {
        msgData.image_url = imageUrl
        msgData.type = 'image'
      } else {
        msgData.type = 'text'
      }

      await addDoc(col, msgData)

      if (previewToRevoke) URL.revokeObjectURL(previewToRevoke)
    } catch (err) {
      console.error('Error sending message:', err)
      setText(trimmed)
      if (imgToUpload) {
        setSelectedImage(imgToUpload)
        setImagePreviewUrl(previewToRevoke)
      }
    } finally {
      setUploadingImage(null)
      setSending(false)
    }
  }

  if (!chatId) return null

  return (
    <div className="flex flex-col h-full bg-transparent overflow-hidden">
      {/* Header */}
      <div className="flex items-center px-4 py-3.5 bg-[#1E1E1E]/90 backdrop-blur-md shadow-md border-b border-white/10 z-10 shrink-0">
        <AmbeBackButton onClick={() => router.back()} />
        {userPhotoUrl && (
          <img src={userPhotoUrl} alt={userName||''}
               className="h-10 w-10 rounded-full mx-3 object-cover border border-[#FFD3AC]/60 bg-black/30" />
        )}
        <h1 className="text-base font-semibold text-white ml-2">{userName}</h1>
      </div>

      {/* Messages */}
      <div ref={containerRef}
           className="flex-1 min-h-0 overflow-y-auto p-4 space-y-2 [scrollbar-width:thin] [scrollbar-color:#3D3D42_transparent]"
           onScroll={onScroll}>
        {loadingMore && (
          <div className="flex justify-center mb-2">
            <svg className="animate-spin h-6 w-6 text-[#FFD3AC]" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
              <path fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
          </div>
        )}
        {messages.map(msg => {
          const isUser = msg.sender_uid === user?.uid
          const time = msg.timestamp?.toDate?.().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }) || ''
          const hasImage = !!msg.image_url;
          const hasText = !!(msg.text && msg.text.trim());
          if (!hasImage && !hasText) return null;

          return (
            <div key={msg.id} className={`mb-2 flex ${isUser?'justify-end':'justify-start'}`}>
              <div className={`max-w-xs sm:max-w-md ${
                hasImage && !hasText ? 'p-1' : hasImage && hasText ? 'p-1' : 'px-4 py-2.5'
              } rounded-2xl ${
                isUser?'bg-[#FFD3AC] text-[#1E1E1E] rounded-br-xs':'bg-[#262626] text-white border border-white/15 rounded-bl-xs'
              }`}>
                {hasImage && !hasText ? (
                  <div className="relative overflow-hidden rounded-xl">
                    <img
                      src={msg.image_url}
                      alt="Chat Attachment"
                      onClick={() => setFullscreenImage(msg.image_url)}
                      className="max-h-64 max-w-[280px] w-full object-cover rounded-xl cursor-pointer hover:opacity-95 transition"
                      loading="lazy"
                    />
                    <div className="absolute inset-x-0 bottom-0 h-9 bg-gradient-to-t from-black/65 to-transparent pointer-events-none" />
                    <span className="absolute bottom-1.5 right-2 text-[10px] font-medium text-white drop-shadow-sm flex items-center gap-1">
                      {time}
                      {isUser && <span className="text-[11px] opacity-90">✓✓</span>}
                    </span>
                  </div>
                ) : (
                  <>
                    {hasImage && (
                      <div className="overflow-hidden rounded-xl">
                        <img
                          src={msg.image_url}
                          alt="Chat Attachment"
                          onClick={() => setFullscreenImage(msg.image_url)}
                          className="max-h-64 max-w-[280px] w-full object-cover rounded-xl cursor-pointer hover:opacity-95 transition"
                          loading="lazy"
                        />
                      </div>
                    )}
                    <div className={hasImage ? 'px-2.5 pt-2 pb-1' : ''}>
                      {hasText && <p className="break-words text-sm leading-relaxed">{msg.text}</p>}
                      <p className={`text-[10px] mt-1 ${isUser ? 'text-black/60' : 'text-white/50'} text-right`}>{time}</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )
        })}

        {/* Optimistic uploading image bubble */}
        {uploadingImage && (
          <div className="mb-2 flex justify-end">
            <div className="max-w-xs sm:max-w-md p-1 rounded-2xl bg-[#FFD3AC] text-[#1E1E1E] rounded-br-xs shadow-lg">
              <div className="relative overflow-hidden rounded-xl">
                <img
                  src={uploadingImage.url}
                  alt="Uploading preview"
                  className="max-h-64 max-w-[280px] w-full object-cover rounded-xl"
                />
                {/* Dark overlay with centered spinner */}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <div className="p-3 bg-black/60 rounded-full flex items-center justify-center shadow-lg">
                    <div className="w-6 h-6 border-[2.5px] border-[#FFD3AC] border-t-transparent rounded-full animate-spin" />
                  </div>
                </div>
                {/* Bottom Sending pill */}
                <div className="absolute bottom-2 right-2 px-2.5 py-1 bg-black/60 backdrop-blur-xs rounded-full flex items-center gap-1.5 shadow-md">
                  <div className="w-2.5 h-2.5 border-[1.5px] border-white border-t-transparent rounded-full animate-spin" />
                  <span className="text-[10px] font-medium text-white tracking-wide">Sending...</span>
                </div>
              </div>
              {uploadingImage.caption && uploadingImage.caption.trim() && (
                <div className="px-2.5 pt-2 pb-1">
                  <p className="break-words text-sm leading-relaxed">{uploadingImage.caption}</p>
                </div>
              )}
            </div>
          </div>
        )}
        <div ref={endRef}/>
      </div>

      {/* Selected Image Preview */}
      {selectedImage && (
        <div className="px-4 py-2 bg-[#1E1E1E]/95 backdrop-blur-md border-t border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <img src={imagePreviewUrl} alt="Preview" className="w-12 h-12 object-cover rounded-xl border border-white/20" />
            <div className="min-w-0">
              <p className="text-xs font-semibold truncate text-white">{selectedImage.name}</p>
              <p className="text-[10px] text-[#FFD3AC]">{(selectedImage.size / 1024).toFixed(0)} KB • Photo attached • Ready to send</p>
            </div>
          </div>
          <button type="button" onClick={removeSelectedImage} className="p-1 text-white/70 hover:text-white cursor-pointer">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
      )}

      {convertingHeic && (
        <div className="px-4 py-2 bg-black/60 backdrop-blur-md text-xs text-[#FFD3AC] border-t border-[#FFD3AC]/30 flex items-center gap-2">
          <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-[#FFD3AC]" />
          Processing Apple photo...
        </div>
      )}

      {/* Input */}
      <div className="flex items-center p-3 sm:p-4 border-t border-white/10 bg-[#1E1E1E]/95 backdrop-blur-md gap-2 shrink-0 sticky bottom-0 z-20">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,.heic,.heif"
          onChange={handleImageSelect}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={sending || convertingHeic}
          className="w-11 h-11 bg-white/10 hover:bg-white/15 border border-white/15 text-[#FFD3AC] rounded-full transition cursor-pointer flex-shrink-0 flex items-center justify-center"
          title="Attach image"
        >
          <PhotoIcon className="w-5 h-5 text-[#FFD3AC]" />
        </button>
        <textarea rows={1}
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSend()
                    }
                  }}
                  className="flex-1 resize-none px-4 py-2.5 text-sm bg-white/10 border border-white/15 rounded-full focus:outline-none focus:ring-2 focus:ring-[#FFD3AC] focus:border-[#FFD3AC] text-white placeholder-white/50"
                  placeholder={selectedImage ? "Add a caption…" : "Type a message…"}/>
        <button onClick={handleSend} disabled={(!text.trim() && !selectedImage) || sending || convertingHeic}
                className={`w-11 h-11 rounded-full transition flex items-center justify-center flex-shrink-0 cursor-pointer ${
                  sending?'bg-white/20 text-white':'bg-[#FFD3AC] text-[#1E1E1E] hover:bg-[#ffe0c4]'
                }`}>
          <PaperAirplaneIcon className="h-5 w-5 ml-0.5"/>
        </button>
      </div>

      {/* Lightbox Modal */}
      {fullscreenImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-xs"
          onClick={() => setFullscreenImage(null)}
        >
          <button
            type="button"
            onClick={() => setFullscreenImage(null)}
            className="absolute top-5 right-5 text-white bg-white/20 hover:bg-white/30 rounded-full p-2.5 transition cursor-pointer"
            aria-label="Close"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
          <img
            src={fullscreenImage}
            alt="Full size"
            className="max-h-[85vh] max-w-[90vw] object-contain rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}