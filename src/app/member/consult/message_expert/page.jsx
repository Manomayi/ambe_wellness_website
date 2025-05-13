import { Suspense } from 'react'
import MessageExpertClient from './MessageExpertClient'

export default function Page() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        Loading chat…
      </div>
    }>
      <MessageExpertClient />
    </Suspense>
  )
}