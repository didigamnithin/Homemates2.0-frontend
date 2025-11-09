/**
 * Outbound Agent Component
 * Initiates outbound calls using Ringg AI API via backend
 */

'use client'

import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/api/client'

interface OutboundAgentProps {
  calleeName?: string
  tenantId?: string
  mobileNumber?: string
  onCallInitiated?: (callId: string) => void
  onError?: (error: string) => void
}

export default function OutboundAgent({ 
  calleeName, 
  tenantId, 
  mobileNumber,
  onCallInitiated,
  onError 
}: OutboundAgentProps) {
  const [isCalling, setIsCalling] = useState(false)
  const [callStatus, setCallStatus] = useState<string | null>(null)

  useEffect(() => {
    // Auto-initiate call when component mounts if we have required data
    if (calleeName && mobileNumber && !isCalling) {
      initiateCall()
    }
  }, [calleeName, mobileNumber])

  const initiateCall = async () => {
    if (!calleeName || !mobileNumber) {
      onError?.('Name and mobile number are required')
      return
    }

    try {
      setIsCalling(true)
      setCallStatus('Initiating call...')

      const response = await apiClient.post('/calls/outbound', {
        name: calleeName,
        mobile_number: mobileNumber,
        custom_args_values: {
          ...(calleeName && { callee_name: calleeName }),
          ...(tenantId && { tenant_id: tenantId })
        }
      })

      if (response.data.call) {
        setCallStatus('Call initiated successfully')
        onCallInitiated?.(response.data.call['Unique Call ID'])
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to initiate call'
      setCallStatus(`Error: ${errorMessage}`)
      onError?.(errorMessage)
    } finally {
      setIsCalling(false)
    }
  }

  // Show call status if available
  if (callStatus) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
          <h3 className="text-lg font-semibold mb-2">Call Status</h3>
          <p className="text-sm text-gray-600 mb-4">{callStatus}</p>
          {!isCalling && (
            <button
              onClick={() => setCallStatus(null)}
              className="w-full px-4 py-2 bg-homie-blue text-white rounded-lg hover:bg-homie-blue-dark transition-colors"
            >
              Close
            </button>
          )}
        </div>
      </div>
    )
  }

  return null
}

