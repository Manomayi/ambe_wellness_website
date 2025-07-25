import { Suspense } from 'react'
import MessageDoctorClient from './MessageDoctorClient'

export default function Page() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        Loading chat…
      </div>
    }>
      <MessageDoctorClient />
    </Suspense>
  )
}