'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store/auth'
import { Sidebar } from '@/components/layout/Sidebar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { isLoading, userType, setUserType } = useAuthStore()
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true)

  useEffect(() => {
    // Check if userType is set, if not redirect to login
    const storedUserType = localStorage.getItem('userType') as 'tenant' | 'owner' | null
    if (!storedUserType) {
      router.push('/login')
    } else {
      // Set userType in store if not already set
      if (!userType) {
        setUserType(storedUserType)
      }
      setIsCheckingOnboarding(false)
    }
  }, [userType, router, setUserType])

  if (isLoading || isCheckingOnboarding) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!userType) {
    return null
  }

  // Skip onboarding for now - allow direct access

  return (
    <div className="flex h-screen lg:flex-row flex-col">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-background lg:ml-0">
        {children}
      </main>
    </div>
  )
}

