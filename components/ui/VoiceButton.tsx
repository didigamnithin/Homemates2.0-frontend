'use client'

import { useState } from 'react'
import { Phone, Mic, MicOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import ShaderBackground from './ShaderBackground'

interface VoiceButtonProps {
  onCall?: () => void
  isActive?: boolean
  className?: string
}

export default function VoiceButton({ onCall, isActive = false, className = '' }: VoiceButtonProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div className={`relative ${className}`}>
      <ShaderBackground />
      <div className="relative z-10 flex items-center justify-center">
        <Button
          onClick={onCall}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={`
            call-homie-button 
            text-white 
            font-semibold 
            rounded-full 
            w-20 h-20 
            md:w-24 md:h-24 
            shadow-2xl
            hover:scale-110
            transition-all
            duration-300
            flex
            items-center
            justify-center
            ${isActive ? 'animate-pulse' : ''}
          `}
          size="lg"
        >
          {isActive ? (
            <MicOff className="h-8 w-8 md:h-10 md:w-10" />
          ) : (
            <Phone className="h-8 w-8 md:h-10 md:w-10" />
          )}
        </Button>
      </div>
    </div>
  )
}

