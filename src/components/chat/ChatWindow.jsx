"use client";

import { useState, useEffect, useRef } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  setDoc,
  updateDoc, 
  doc, 
  serverTimestamp, 
  writeBatch, 
  increment 
} from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase/config';
import { useAuth } from '@/contexts/AuthContext';
import { PaperAirplaneIcon } from '@heroicons/react/24/solid';
import { PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function ChatWindow({ 
  chatId, 
  recipientName, 
  recipientId,
  canSendMessage,
  isDoctor,
  hideHeader = false 
}) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(null);
  const [convertingHeic, setConvertingHeic] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!chatId || !user) return;

    // Subscribe to messages
    const messagesQuery = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('timestamp', 'asc')
    );
    
    const unsubscribe = onSnapshot(
      messagesQuery,
      (snapshot) => {
        const msgs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setMessages(msgs);
        scrollToBottom();
        
        // Mark messages as read
        if (msgs.length > 0) {
          markMessagesAsRead(msgs);
        }
      },
      (err) => {
        if (err?.code === 'permission-denied') return;
        console.error('Error listening to chat messages:', err);
      }
    );
    
    return () => unsubscribe();
  }, [chatId, user]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (uploadingImage) {
      scrollToBottom();
    }
  }, [uploadingImage]);

  const markMessagesAsRead = async (messagesToMark) => {
    try {
      if (isDoctor && user?.uid && chatId) {
        const chatRef = doc(db, 'doctors', user.uid, 'chats', chatId);
        await setDoc(chatRef, { 
          unread_count: 0,
          last_message_read_by_doctor: true 
        }, { merge: true });
      } else if (!isDoctor && user?.uid && chatId) {
        const chatRef = doc(db, 'users', user.uid, 'chats', chatId);
        await setDoc(chatRef, { 
          unread_count: 0,
          last_message_read_by_user: true 
        }, { merge: true });
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const convertHeicToJpeg = async (file) => {
    try {
      const heic2any = (await import('heic2any')).default;
      const blob = await heic2any({
        blob: file,
        toType: 'image/jpeg',
        quality: 0.85,
      });
      const convertedBlob = Array.isArray(blob) ? blob[0] : blob;
      return new File(
        [convertedBlob],
        file.name.replace(/\.[^/.]+$/, "") + ".jpg",
        { type: 'image/jpeg' }
      );
    } catch (err) {
      console.error("HEIC conversion failed:", err);
      return file;
    }
  };

  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so the same file can be re-selected if removed
    e.target.value = '';

    const lowerName = file.name.toLowerCase();
    const isHeic = lowerName.endsWith('.heic') || lowerName.endsWith('.heif') || file.type === 'image/heic' || file.type === 'image/heif';
    const isStandardImage = file.type.startsWith('image/') || /\.(jpe?g|png|webp|gif)$/i.test(lowerName);

    if (!isHeic && !isStandardImage) {
      alert('Please select a valid image file (JPEG, PNG, WebP, GIF, or HEIC).');
      return;
    }

    if (isHeic) {
      setConvertingHeic(true);
      try {
        const convertedFile = await convertHeicToJpeg(file);
        setSelectedImage(convertedFile);
        setImagePreviewUrl(URL.createObjectURL(convertedFile));
      } catch (err) {
        console.error('Error converting HEIC image:', err);
        alert('Failed to process HEIC image from device.');
      } finally {
        setConvertingHeic(false);
      }
    } else {
      setSelectedImage(file);
      setImagePreviewUrl(URL.createObjectURL(file));
    }
  };

  const removeSelectedImage = () => {
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    setSelectedImage(null);
    setImagePreviewUrl(null);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    const messageText = newMessage.trim();
    if ((!messageText && !selectedImage) || sending || !canSendMessage) return;
    
    setSending(true);
    const imageToUpload = selectedImage;
    const previewToRevoke = imagePreviewUrl;

    if (imageToUpload && previewToRevoke) {
      setUploadingImage({ url: previewToRevoke, caption: messageText });
    }

    setNewMessage('');
    setSelectedImage(null);
    setImagePreviewUrl(null);
    setTimeout(scrollToBottom, 50);
    
    try {
      let imageUrl = null;
      if (imageToUpload) {
        const timestamp = Date.now();
        const cleanFileName = imageToUpload.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const imgRef = storageRef(storage, `chats/${chatId}/images/${timestamp}_${cleanFileName}`);
        const uploadResult = await uploadBytes(imgRef, imageToUpload, {
          contentType: imageToUpload.type || 'image/jpeg',
        });
        imageUrl = await getDownloadURL(uploadResult.ref);
      }

      const messageData = {
        sender_uid: user.uid,
        timestamp: serverTimestamp(),
        read: false,
        text: messageText,
      };

      if (imageUrl) {
        messageData.image_url = imageUrl;
        messageData.type = 'image';
      } else {
        messageData.type = 'text';
      }

      // Add message to Firestore
      await addDoc(collection(db, 'chats', chatId, 'messages'), messageData);
      
      const lastMsgDisplay = messageText || (imageUrl ? '📷 Photo' : '');

      // Update chat metadata
      const chatRef = doc(db, 'chats', chatId);
      await setDoc(chatRef, {
        last_message: lastMsgDisplay,
        last_message_time: serverTimestamp(),
        last_message_timestamp: serverTimestamp(),
        last_message_sender_uid: user.uid,
      }, { merge: true });
      
      // Update doctor's chat metadata if user is sending
      if (!isDoctor && recipientId) {
        const doctorChatRef = doc(db, 'doctors', recipientId, 'chats', chatId);
        await setDoc(doctorChatRef, {
          chat_id: chatId,
          user_uid: user.uid,
          user_name: user.displayName || 'User',
          user_photo_url: user.photoURL || null,
          last_message: lastMsgDisplay,
          last_message_sender_uid: user.uid,
          last_message_timestamp: serverTimestamp(),
          last_message_time: serverTimestamp(),
          last_message_read_by_doctor: false,
          unread_count: increment(1),
        }, { merge: true });
      }

      // If doctor is sending, update doctor's own chat metadata too
      if (isDoctor) {
        const doctorChatRef = doc(db, 'doctors', user.uid, 'chats', chatId);
        await setDoc(doctorChatRef, {
          chat_id: chatId,
          last_message: lastMsgDisplay,
          last_message_sender_uid: user.uid,
          last_message_timestamp: serverTimestamp(),
          last_message_time: serverTimestamp(),
          last_message_read_by_doctor: true,
        }, { merge: true });
      }

      if (previewToRevoke) {
        URL.revokeObjectURL(previewToRevoke);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Restore previous state if failed
      setNewMessage(messageText);
      if (imageToUpload) {
        setSelectedImage(imageToUpload);
        setImagePreviewUrl(previewToRevoke);
      }
    } finally {
      setUploadingImage(null);
      setSending(false);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = formatDate(message.timestamp);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {});

  return (
    <div className="flex flex-col h-full bg-transparent">
      {/* Optional Inner Header */}
      {!hideHeader && (
        <div className="p-4 border-b border-white/10 bg-[#1E1E1E]/80 backdrop-blur-md">
          <h3 className="font-semibold text-sm text-white">{recipientName}</h3>
          {!canSendMessage && !isDoctor && (
            <p className="text-xs text-white/60 mt-0.5">
              Messaging is enabled after completing your first consultation
            </p>
          )}
        </div>
      )}
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {Object.keys(groupedMessages).length === 0 && !uploadingImage ? (
          <div className="flex items-center justify-center h-full text-center p-6">
            <div className="bg-[#2D2D30]/85 border border-white/10 rounded-2xl p-6 max-w-sm backdrop-blur-md shadow-xl">
              <p className="text-sm font-semibold text-white mb-1">Direct Message Channel</p>
              <p className="text-xs text-white/70">
                {canSendMessage
                  ? 'Send a message or photo to begin your conversation.'
                  : 'Complete your first video consultation to unlock direct messaging.'}
              </p>
            </div>
          </div>
        ) : (
          <>
            {Object.entries(groupedMessages).map(([date, dateMessages]) => (
              <div key={date}>
                <div className="text-center my-3">
                  <span className="text-[11px] font-medium text-white/75 bg-black/40 border border-white/10 px-3.5 py-1 rounded-full backdrop-blur-xs shadow-xs">
                    {date}
                  </span>
                </div>
                {dateMessages.map((message) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isOwn={message.sender_uid === user?.uid}
                    time={formatTime(message.timestamp)}
                    onImageClick={(url) => setFullscreenImage(url)}
                  />
                ))}
              </div>
            ))}

            {/* Optimistic Uploading Image Bubble */}
            {uploadingImage && (
              <div className="flex justify-end mb-2.5">
                <div className="max-w-[85%] sm:max-w-[70%] shadow-lg p-1 bg-[#FFD3AC] text-[#1E1E1E] rounded-2xl rounded-br-xs">
                  <div className="relative overflow-hidden rounded-xl">
                    <img
                      src={uploadingImage.url}
                      alt="Uploading preview"
                      className="max-h-72 max-w-[280px] w-full rounded-xl object-cover"
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
                      <p className="whitespace-pre-wrap break-words text-sm leading-relaxed font-normal">
                        {uploadingImage.caption}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Selected Image Preview */}
      {selectedImage && (
        <div className="px-4 py-2.5 border-t border-white/10 bg-[#1E1E1E]/95 backdrop-blur-md flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={imagePreviewUrl}
              alt="Preview"
              className="w-12 h-12 object-cover rounded-xl border border-white/20"
            />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate max-w-[200px] sm:max-w-xs">
                {selectedImage.name}
              </p>
              <p className="text-[10px] text-[#FFD3AC]">
                {(selectedImage.size / 1024).toFixed(0)} KB • Photo attached • Ready to send
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={removeSelectedImage}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition cursor-pointer"
            aria-label="Remove image"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Processing HEIC notification */}
      {convertingHeic && (
        <div className="px-4 py-2 bg-black/60 backdrop-blur-md border-t border-[#FFD3AC]/30 text-xs text-[#FFD3AC] flex items-center gap-2">
          <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-[#FFD3AC]" />
          Processing Apple photo...
        </div>
      )}
      
      {/* Input */}
      {canSendMessage ? (
        <form onSubmit={sendMessage} className="p-3 sm:p-4 border-t border-white/10 bg-black/40 backdrop-blur-md">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,.heic,.heif"
            onChange={handleImageSelect}
            className="hidden"
          />
          <div className="flex items-center gap-2 max-w-4xl mx-auto">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={sending || convertingHeic}
              className="w-11 h-11 bg-white/10 hover:bg-white/15 border border-white/15 text-[#FFD3AC] rounded-full disabled:opacity-40 transition flex items-center justify-center flex-shrink-0 cursor-pointer"
              title="Attach image"
              aria-label="Attach image"
            >
              <PhotoIcon className="w-5 h-5 text-[#FFD3AC]" />
            </button>

            <textarea
              ref={inputRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(e);
                }
              }}
              placeholder={selectedImage ? "Add a caption..." : "Type a message..."}
              className="flex-1 px-4 py-2.5 text-sm bg-white/10 border border-white/15 rounded-full resize-none focus:outline-none focus:ring-2 focus:ring-[#FFD3AC] focus:border-[#FFD3AC] text-white placeholder-white/50 leading-relaxed"
              rows={1}
            />
            <button
              type="submit"
              disabled={(!newMessage.trim() && !selectedImage) || sending || convertingHeic}
              className="w-11 h-11 bg-[#FFD3AC] hover:bg-[#ffe0c4] text-[#1E1E1E] rounded-full disabled:opacity-40 disabled:cursor-not-allowed transition shadow-md flex items-center justify-center flex-shrink-0 cursor-pointer"
              aria-label="Send message"
            >
              {sending ? (
                <div className="w-5 h-5 border-2 border-[#1E1E1E] border-t-transparent rounded-full animate-spin" />
              ) : (
                <PaperAirplaneIcon className="w-5 h-5 ml-0.5" />
              )}
            </button>
          </div>
        </form>
      ) : (
        <div className="p-4 border-t border-white/10 bg-black/40 backdrop-blur-md text-center">
          <p className="text-xs text-white/60 font-medium">
            {isDoctor 
              ? 'This conversation is currently locked' 
              : 'Complete your first consultation to start messaging with your doctor.'}
          </p>
        </div>
      )}

      {/* Fullscreen Image Lightbox Modal */}
      {fullscreenImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setFullscreenImage(null)}
        >
          <button
            type="button"
            onClick={() => setFullscreenImage(null)}
            className="absolute top-5 right-5 text-white bg-white/20 hover:bg-white/30 rounded-full p-2.5 transition cursor-pointer"
            aria-label="Close image preview"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
          <img
            src={fullscreenImage}
            alt="Full size view"
            className="max-h-[85vh] max-w-[90vw] object-contain rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

// Message Bubble Component with Ambé Theme
function MessageBubble({ message, isOwn, time, onImageClick }) {
  const hasImage = !!message.image_url;
  const hasText = !!(message.text && message.text.trim());

  if (!hasImage && !hasText) return null;

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2.5`}>
      <div
        className={`max-w-[85%] sm:max-w-[70%] shadow-md ${
          hasImage && !hasText
            ? 'p-1'
            : hasImage && hasText
            ? 'p-1'
            : 'px-4 py-2.5'
        } ${
          isOwn
            ? 'bg-[#FFD3AC] text-[#1E1E1E] rounded-2xl rounded-br-xs'
            : 'bg-[#262626] text-white border border-white/15 rounded-2xl rounded-bl-xs'
        }`}
      >
        {hasImage && !hasText ? (
          <div className="relative overflow-hidden rounded-xl">
            <img
              src={message.image_url}
              alt="Chat attachment"
              onClick={() => onImageClick?.(message.image_url)}
              className="max-h-72 max-w-[280px] w-full rounded-xl object-cover cursor-pointer hover:opacity-95 transition"
              loading="lazy"
            />
            <div className="absolute inset-x-0 bottom-0 h-9 bg-gradient-to-t from-black/65 to-transparent pointer-events-none" />
            <span className="absolute bottom-1.5 right-2 text-[10px] font-medium text-white drop-shadow-sm flex items-center gap-1">
              {time}
              {isOwn && <span className="text-[11px] opacity-90">✓✓</span>}
            </span>
          </div>
        ) : (
          <>
            {hasImage && (
              <div className="overflow-hidden rounded-xl">
                <img
                  src={message.image_url}
                  alt="Chat attachment"
                  onClick={() => onImageClick?.(message.image_url)}
                  className="max-h-72 max-w-[280px] w-full rounded-xl object-cover cursor-pointer hover:opacity-95 transition"
                  loading="lazy"
                />
              </div>
            )}
            <div className={hasImage ? 'px-2.5 pt-2 pb-1' : ''}>
              {hasText && (
                <p className="whitespace-pre-wrap break-words text-sm leading-relaxed font-normal">
                  {message.text}
                </p>
              )}
              <p
                className={`text-[10px] mt-1 font-medium ${
                  isOwn ? 'text-black/60 text-right' : 'text-white/50 text-right'
                }`}
              >
                {time}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}