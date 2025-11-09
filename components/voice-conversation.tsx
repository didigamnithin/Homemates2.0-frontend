'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Mic, MicOff, Volume2, VolumeX, Phone, PhoneOff } from 'lucide-react'

interface VoiceConversationProps {
  agentId: string
  agentName: string
  onClose: () => void
}

export function VoiceConversation({ agentId, agentName, onClose }: VoiceConversationProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [transcript, setTranscript] = useState<string[]>([])
  const [agentResponse, setAgentResponse] = useState<string>('')
  
  const wsRef = useRef<WebSocket | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const audioQueueRef = useRef<AudioBuffer[]>([])
  const isPlayingRef = useRef(false)
  const isListeningRef = useRef(false)
  const processorRef = useRef<ScriptProcessorNode | null>(null)

  // Initialize WebSocket connection
  useEffect(() => {
    if (!agentId) return

    const connectWebSocket = async () => {
      try {
        // Get signed URL from backend for private agents
        // For now, we'll use the public agent endpoint
        const wsUrl = `wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${agentId}`
        
        console.log('Connecting to ElevenLabs WebSocket:', wsUrl)
        const ws = new WebSocket(wsUrl)
        wsRef.current = ws

        ws.onopen = () => {
          console.log('WebSocket connected')
          setIsConnected(true)
          
          // Auto-start listening when connected
          // Small delay to ensure connection is fully established
          setTimeout(() => {
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
              console.log('Auto-starting microphone...')
              startListening()
            }
          }, 500)
        }

        ws.onmessage = async (event) => {
          try {
            // Check if message is binary (audio data)
            if (event.data instanceof ArrayBuffer) {
              console.log('Received binary audio data from WebSocket, size:', event.data.byteLength)
              // Handle binary audio data directly
              await handleBinaryAudio(event.data)
              return
            }
            
            if (event.data instanceof Blob) {
              console.log('Received Blob audio data from WebSocket')
              const arrayBuffer = await event.data.arrayBuffer()
              await handleBinaryAudio(arrayBuffer)
              return
            }

            // Handle text messages (JSON)
            const data = JSON.parse(event.data)
            console.log('WebSocket message:', data)

            // Handle different event types
            if (data.type === 'conversation_initiation_metadata') {
              console.log('Conversation initiated:', data)
            } else if (data.type === 'user_transcript' || data.type === 'user_transcript_interim') {
              // User's speech transcribed
              const userText = data.text || data.transcript || ''
              if (userText) {
                console.log('User transcript:', userText)
                setTranscript(prev => {
                  // Remove interim transcripts and add final one
                  const filtered = prev.filter(msg => !msg.startsWith('You:') || !msg.includes('(interim)'))
                  return [...filtered, `You: ${userText}`]
                })
              }
            } else if (data.type === 'agent_response' || data.type === 'agent_response_text') {
              // Agent's response text
              const agentText = data.text || data.response || data.agent_response || ''
              if (agentText) {
                console.log('Agent response:', agentText)
                setAgentResponse(agentText)
                setTranscript(prev => [...prev, `Agent: ${agentText}`])
              }
            } else if (data.type === 'audio' || data.type === 'audio_chunk' || data.type === 'audio_base64') {
              // Agent's audio response (base64 encoded)
              const audioData = data.audio || data.data || data.chunk || data.audio_base64
              if (audioData) {
                console.log('Received audio chunk from agent (base64)')
                await handleAgentAudio(audioData)
              }
            } else {
              console.log('Unknown WebSocket message type:', data.type, data)
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error, event.data)
          }
        }

        ws.onerror = (error) => {
          console.error('WebSocket error:', error)
          setIsConnected(false)
        }

        ws.onclose = (event) => {
          console.log('WebSocket closed', event.code, event.reason)
          setIsConnected(false)
          stopListening()
          
          // Note: Reconnection would need to be handled separately
          // For now, user can manually reconnect by closing and reopening the dialog
        }
      } catch (error) {
        console.error('Failed to connect WebSocket:', error)
        alert('Failed to connect to agent. Please check your agent ID and try again.')
      }
    }

    connectWebSocket()

    return () => {
      // Cleanup on unmount
      if (wsRef.current) {
        wsRef.current.close()
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop())
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [agentId])

  // Handle binary audio data (PCM format)
  const handleBinaryAudio = async (audioData: ArrayBuffer) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext({ sampleRate: 24000 })
      }

      // Resume audio context if suspended
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume()
      }

      // Convert PCM16 to AudioBuffer
      // Assuming 24kHz sample rate, mono channel
      const pcm16Data = new Int16Array(audioData)
      const float32Data = new Float32Array(pcm16Data.length)
      
      // Convert Int16 PCM to Float32 (-1.0 to 1.0)
      for (let i = 0; i < pcm16Data.length; i++) {
        float32Data[i] = pcm16Data[i] / 32768.0
      }

      // Create AudioBuffer
      const audioBuffer = audioContextRef.current.createBuffer(1, float32Data.length, 24000)
      audioBuffer.copyToChannel(float32Data, 0)
      
      // Queue audio for playback
      audioQueueRef.current.push(audioBuffer)
      
      // Play queued audio
      if (!isPlayingRef.current) {
        playQueuedAudio()
      }
    } catch (error) {
      console.error('Error handling binary audio:', error)
    }
  }

  // Handle agent audio playback (base64 encoded)
  const handleAgentAudio = async (audioData: string) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext({ sampleRate: 24000 })
      }

      // Resume audio context if suspended
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume()
      }

      // Decode base64 audio
      const audioBytes = Uint8Array.from(atob(audioData), c => c.charCodeAt(0))
      
      // Try to decode as audio format (MP3, WAV, etc.)
      try {
        const audioBuffer = await audioContextRef.current.decodeAudioData(audioBytes.buffer)
        // Queue audio for playback
        audioQueueRef.current.push(audioBuffer)
        
        // Play queued audio
        if (!isPlayingRef.current) {
          playQueuedAudio()
        }
      } catch (decodeError) {
        // If decodeAudioData fails, try treating as PCM16
        console.log('decodeAudioData failed, treating as PCM16:', decodeError)
        await handleBinaryAudio(audioBytes.buffer)
      }
    } catch (error) {
      console.error('Error handling agent audio:', error)
    }
  }

  // Play queued audio chunks
  const playQueuedAudio = async () => {
    if (audioQueueRef.current.length === 0) {
      isPlayingRef.current = false
      setIsSpeaking(false)
      return
    }

    // Resume audio context if suspended
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume()
    }

    isPlayingRef.current = true
    setIsSpeaking(true)

    const audioBuffer = audioQueueRef.current.shift()!
    const source = audioContextRef.current!.createBufferSource()
    source.buffer = audioBuffer
    source.connect(audioContextRef.current!.destination)

    source.onended = () => {
      // Continue playing next chunk
      playQueuedAudio()
    }

    try {
      source.start(0)
    } catch (error) {
      console.error('Error playing audio:', error)
      // Continue with next chunk even if this one fails
      playQueuedAudio()
    }
  }

  // Start microphone input
  const startListening = async () => {
    try {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        alert('WebSocket is not connected. Please wait for connection.')
        return
      }

      console.log('Requesting microphone access...')
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      })
      
      console.log('Microphone access granted, stream:', stream)
      mediaStreamRef.current = stream

      // Initialize audio context if not already initialized
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext({ sampleRate: 24000 })
        console.log('AudioContext created with sample rate:', audioContextRef.current.sampleRate)
      }
      
      // Resume audio context if suspended (browser autoplay policy)
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume()
        console.log('AudioContext resumed')
      }
      
      // Create audio processing
      const source = audioContextRef.current.createMediaStreamSource(stream)
      const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1)
      processorRef.current = processor

      processor.onaudioprocess = (e) => {
        // Use ref instead of state for real-time checking
        if (!isListeningRef.current || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
          return
        }

        const inputData = e.inputBuffer.getChannelData(0)
        const pcmData = new Int16Array(inputData.length)
        
        // Convert float32 to int16 PCM
        for (let i = 0; i < inputData.length; i++) {
          pcmData[i] = Math.max(-32768, Math.min(32767, inputData[i] * 32768))
        }

        // Send audio to WebSocket
        // Try sending as raw binary first (more efficient for streaming)
        try {
          // Send raw binary PCM data for real-time streaming
          wsRef.current.send(pcmData.buffer)
        } catch (error) {
          // If binary fails, try JSON format with base64
          try {
            const uint8Array = new Uint8Array(pcmData.buffer)
            let binaryString = ''
            for (let i = 0; i < uint8Array.length; i++) {
              binaryString += String.fromCharCode(uint8Array[i])
            }
            const base64Audio = btoa(binaryString)
            
            const message = JSON.stringify({
              type: 'audio',
              audio: base64Audio
            })
            wsRef.current.send(message)
          } catch (jsonError) {
            console.error('Error sending audio to WebSocket:', jsonError)
          }
        }
      }

      source.connect(processor)
      processor.connect(audioContextRef.current.destination)

      isListeningRef.current = true
      setIsListening(true)
      console.log('Microphone listening started')
    } catch (error) {
      console.error('Error starting microphone:', error)
      alert(`Failed to access microphone: ${error instanceof Error ? error.message : 'Unknown error'}. Please grant microphone permissions.`)
    }
  }

  // Stop microphone input
  const stopListening = () => {
    console.log('Stopping microphone...')
    
    if (processorRef.current) {
      processorRef.current.disconnect()
      processorRef.current = null
    }
    
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => {
        track.stop()
        console.log('Stopped track:', track.kind)
      })
      mediaStreamRef.current = null
    }
    
    isListeningRef.current = false
    setIsListening(false)
    console.log('Microphone stopped')
  }

  // End conversation
  const endConversation = () => {
    stopListening()
    if (wsRef.current) {
      wsRef.current.close()
    }
    onClose()
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">Conversation with {agentName}</h3>
              <p className="text-sm text-muted-foreground">
                {isConnected ? 'Connected' : 'Connecting...'}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={endConversation}>
              <PhoneOff className="h-4 w-4 mr-2" />
              End
            </Button>
          </div>

          {/* Transcript */}
          <div className="h-48 overflow-y-auto border rounded-lg p-4 mb-4 bg-muted/50">
            {transcript.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center">
                Start speaking to begin the conversation...
              </p>
            ) : (
              <div className="space-y-2">
                {transcript.map((message, index) => (
                  <div key={index} className="text-sm">
                    {message}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4">
            <Button
              variant={isListening ? "default" : "outline"}
              size="lg"
              onClick={isListening ? stopListening : startListening}
              disabled={!isConnected}
            >
              {isListening ? (
                <>
                  <MicOff className="h-5 w-5 mr-2" />
                  Stop Listening
                </>
              ) : (
                <>
                  <Mic className="h-5 w-5 mr-2" />
                  Start Listening
                </>
              )}
            </Button>

            <div className="flex items-center gap-2">
              {isSpeaking ? (
                <>
                  <Volume2 className="h-5 w-5 text-primary animate-pulse" />
                  <span className="text-sm text-muted-foreground">Agent is speaking...</span>
                </>
              ) : (
                <>
                  <VolumeX className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Agent is listening</span>
                </>
              )}
            </div>
          </div>

          {!isConnected && (
            <p className="text-sm text-muted-foreground text-center mt-4">
              Connecting to agent...
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

