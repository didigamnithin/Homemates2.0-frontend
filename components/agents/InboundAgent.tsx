/**
 * Inbound Agent Component
 * Loads the DesiVocal inbound agent for tenant to owner calls
 */

'use client'

import { useEffect } from 'react'

interface InboundAgentProps {
  calleeName?: string
  propertyCode?: string
}

export default function InboundAgent({ calleeName, propertyCode }: InboundAgentProps) {
  useEffect(() => {
    // Load the agent CDN
    function loadAgentsCdn(version: string, callback: () => void) {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.type = 'text/css'
      link.href = `https://cdn.jsdelivr.net/npm/@desivocal/agents-cdn@${version}/dist/style.css`
      
      const script = document.createElement('script')
      script.type = 'text/javascript'
      
      // Legacy IE support (readyState and onreadystatechange are not in TypeScript definitions)
      if ((script as any).readyState) {
        (script as any).onreadystatechange = function() {
          if ((script as any).readyState !== 'loaded' && (script as any).readyState !== 'complete') return
          ;(script as any).onreadystatechange = null
          callback()
        }
      } else {
        script.onload = function() {
          callback()
        }
      }
      
      script.src = `https://cdn.jsdelivr.net/npm/@desivocal/agents-cdn@${version}/dist/dv-agent.es.js`
      document.getElementsByTagName('head')[0].appendChild(link)
      document.getElementsByTagName('head')[0].appendChild(script)
    }

    // Load and initialize the inbound agent
    loadAgentsCdn('1.0.3', function() {
      // @ts-ignore - loadAgent is loaded from CDN
      if (typeof loadAgent !== 'undefined') {
        // @ts-ignore
        loadAgent({
          agentId: '91312a1a-f2c3-42dc-a0c7-4e532d90257b',
          xApiKey: '5d001a13-f975-4baa-a8b6-e61fce1e8e98',
          variables: {
            ...(calleeName && { callee_name: calleeName }),
            ...(propertyCode && { property_code: propertyCode })
          }
        })
      }
    })

    // Cleanup function
    return () => {
      // Remove agent if needed
      const agentElement = document.getElementById('dv-agent-container')
      if (agentElement) {
        agentElement.remove()
      }
    }
  }, [calleeName, propertyCode])

  return null // This component doesn't render anything visible
}

