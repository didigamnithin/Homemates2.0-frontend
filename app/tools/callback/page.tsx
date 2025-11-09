'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { apiClient } from '@/lib/api/client'
import { useRouter } from 'next/navigation'

export default function ToolsCallbackPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing')
  const [message, setMessage] = useState('Processing OAuth callback...')

  useEffect(() => {
    const code = searchParams.get('code')
    const error = searchParams.get('error')
    const toolType = localStorage.getItem('oauth_tool_type') || 'gmail'

    if (error) {
      setStatus('error')
      setMessage('OAuth authorization was cancelled or failed.')
      setTimeout(() => router.push('/dashboard/tools'), 3000)
      return
    }

    if (code) {
      handleOAuthCallback(code, toolType)
    } else {
      setStatus('error')
      setMessage('No authorization code received.')
      setTimeout(() => router.push('/dashboard/tools'), 3000)
    }
  }, [searchParams, router])

  const handleOAuthCallback = async (code: string, toolType: string) => {
    try {
      const endpoint = toolType === 'gmail' ? '/tools/gmail/connect' : '/tools/calendar/connect'
      await apiClient.post(endpoint, { code })
      
      setStatus('success')
      setMessage('Successfully connected! Redirecting...')
      localStorage.removeItem('oauth_tool_type')
      
      setTimeout(() => {
        router.push('/dashboard/tools')
      }, 2000)
    } catch (error: any) {
      setStatus('error')
      setMessage(error.response?.data?.message || 'Failed to connect tool')
      setTimeout(() => router.push('/dashboard/tools'), 3000)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        {status === 'processing' && (
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        )}
        {status === 'success' && (
          <div className="text-green-600 mb-4">✓</div>
        )}
        {status === 'error' && (
          <div className="text-red-600 mb-4">✗</div>
        )}
        <p className="text-lg">{message}</p>
      </div>
    </div>
  )
}

