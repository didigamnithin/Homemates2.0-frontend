'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store/auth'

export default function DashboardPage() {
  const router = useRouter()
  const { userType } = useAuthStore()

  useEffect(() => {
    // Redirect based on user type
    if (userType === 'tenant') {
      router.push('/dashboard/properties')
    } else if (userType === 'owner') {
      router.push('/dashboard/leads')
    }
  }, [userType, router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  )
}

