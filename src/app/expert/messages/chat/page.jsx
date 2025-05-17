// src/app/expert/messages/chat/page.jsx
import { Suspense } from 'react'
import MessageMemberClient from './MessageMemberClient'

export default function Page() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        Loading chat…
      </div>
    }>
      <MessageMemberClient />
    </Suspense>
  )
}