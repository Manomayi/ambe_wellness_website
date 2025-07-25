// src/app/doctor/messages/chat/page.jsx
import { Suspense } from 'react'
import MessageUserClient from './MessageUserClient'

export default function Page() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        Loading chat…
      </div>
    }>
      <MessageUserClient />
    </Suspense>
  )
}