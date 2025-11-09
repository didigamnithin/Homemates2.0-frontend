'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { apiClient } from '@/lib/api/client'
import { Phone, Play, Calendar } from 'lucide-react'
import ReactPlayer from 'react-player'

interface Call {
  id?: string
  conversation_id: string
  customer_name?: string
  phone?: string
  agent_id?: string
  agent_name?: string
  duration?: number
  audio_url?: string
  timestamp?: string
  created_at?: string
  updated_at?: string
  sentiment_score?: number
  status?: string
  metadata?: any
  transcript?: any
  summary?: string
  [key: string]: any
}

export default function CallsPage() {
  const [calls, setCalls] = useState<Call[]>([])
  const [agents, setAgents] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isInitiateOpen, setIsInitiateOpen] = useState(false)
  const [selectedCall, setSelectedCall] = useState<Call | null>(null)
  const [callDetails, setCallDetails] = useState<any>(null)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  const [formData, setFormData] = useState({
    phone_number: '',
    agent_id: '',
    customer_name: ''
  })

  useEffect(() => {
    fetchCalls()
    fetchAgents()
  }, [])

  const fetchCalls = async () => {
    try {
      const response = await apiClient.get('/calls')
      console.log('Fetched calls:', response.data)
      setCalls(response.data.calls || [])
    } catch (error) {
      console.error('Failed to fetch calls:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchCallDetails = async (conversationId: string) => {
    try {
      const response = await apiClient.get(`/calls/${conversationId}`)
      console.log('Call details:', response.data)
      return response.data.call
    } catch (error) {
      console.error('Failed to fetch call details:', error)
      return null
    }
  }

  const fetchAgents = async () => {
    try {
      const response = await apiClient.get('/agents')
      setAgents(response.data.agents || [])
    } catch (error) {
      console.error('Failed to fetch agents:', error)
    }
  }

  const handleInitiateCall = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await apiClient.post('/calls/initiate', formData)
      setIsInitiateOpen(false)
      setFormData({ phone_number: '', agent_id: '', customer_name: '' })
      fetchCalls()
      alert('Call initiated successfully!')
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to initiate call')
    }
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  const getSentimentColor = (score?: number) => {
    if (!score) return 'text-muted-foreground'
    if (score > 0.3) return 'text-green-600'
    if (score < -0.3) return 'text-red-600'
    return 'text-yellow-600'
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Calls</h1>
          <p className="text-muted-foreground mt-2">View and manage call logs</p>
        </div>
        <Button onClick={() => setIsInitiateOpen(true)}>
          <Phone className="h-4 w-4 mr-2" />
          Initiate Call
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Call History</CardTitle>
          <CardDescription>All customer interactions and recordings</CardDescription>
        </CardHeader>
        <CardContent>
          {calls.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No calls yet</p>
          ) : (
            <div className="space-y-4">
              {calls.map((call) => (
                <div key={call.conversation_id || call.id} className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold">{call.customer_name || 'Unknown Customer'}</h3>
                      <p className="text-sm text-muted-foreground">{call.phone || 'N/A'}</p>
                      {call.agent_name && (
                        <p className="text-sm text-muted-foreground mt-1">Agent: {call.agent_name}</p>
                      )}
                      {call.conversation_id && (
                        <p className="text-xs text-muted-foreground mt-1">ID: {call.conversation_id}</p>
                      )}
                    </div>
                    <div className="text-right ml-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {new Date(call.timestamp || call.created_at || call.updated_at || Date.now()).toLocaleString()}
                      </div>
                      <p className="text-sm mt-1">Duration: {formatDuration(call.duration)}</p>
                      {call.status && (
                        <p className="text-sm mt-1">
                          Status: <span className="font-medium">{call.status}</span>
                        </p>
                      )}
                      {call.sentiment_score !== undefined && (
                        <p className={`text-sm font-medium mt-1 ${getSentimentColor(call.sentiment_score)}`}>
                          Sentiment: {call.sentiment_score.toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        setIsLoadingDetails(true)
                        const details = await fetchCallDetails(call.conversation_id || call.id || '')
                        setCallDetails(details || call)
                        setSelectedCall(call)
                        setIsLoadingDetails(false)
                      }}
                    >
                      {isLoadingDetails ? 'Loading...' : 'View Details'}
                    </Button>
                    {call.audio_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedCall(call)}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Play Recording
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isInitiateOpen} onOpenChange={setIsInitiateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Initiate Outbound Call</DialogTitle>
            <DialogDescription>
              Start a call using one of your agents
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleInitiateCall}>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="phone_number">Phone Number</Label>
                <Input
                  id="phone_number"
                  type="tel"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  required
                  placeholder="+1234567890"
                />
              </div>
              <div>
                <Label htmlFor="agent_id">Agent</Label>
                <Select
                  id="agent_id"
                  value={formData.agent_id}
                  onChange={(e) => setFormData({ ...formData, agent_id: e.target.value })}
                  required
                >
                  <option value="">Select an agent</option>
                  {agents.map((agent) => (
                    <option key={agent.agent_id} value={agent.agent_id}>
                      {agent.custom_name || agent.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="customer_name">Customer Name (Optional)</Label>
                <Input
                  id="customer_name"
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsInitiateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Initiate Call</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {selectedCall && (
        <Dialog open={!!selectedCall} onOpenChange={() => {
          setSelectedCall(null)
          setCallDetails(null)
        }}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Call Details</DialogTitle>
              <DialogDescription>
                {selectedCall.customer_name || 'Unknown'} - {selectedCall.phone || 'N/A'}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Conversation ID</p>
                  <p className="text-sm">{selectedCall.conversation_id || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <p className="text-sm">{selectedCall.status || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Duration</p>
                  <p className="text-sm">{formatDuration(selectedCall.duration)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Agent</p>
                  <p className="text-sm">{selectedCall.agent_name || selectedCall.agent_id || 'N/A'}</p>
                </div>
                {selectedCall.created_at && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Created</p>
                    <p className="text-sm">{new Date(selectedCall.created_at).toLocaleString()}</p>
                  </div>
                )}
                {selectedCall.updated_at && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Updated</p>
                    <p className="text-sm">{new Date(selectedCall.updated_at).toLocaleString()}</p>
                  </div>
                )}
              </div>

              {/* Summary */}
              {callDetails?.summary && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Summary</p>
                  <p className="text-sm">{callDetails.summary}</p>
                </div>
              )}

              {/* Transcript */}
              {callDetails?.transcript && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Transcript</p>
                  <div className="border rounded-lg p-4 max-h-64 overflow-y-auto">
                    <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(callDetails.transcript, null, 2)}</pre>
                  </div>
                </div>
              )}

              {/* Metadata */}
              {callDetails?.metadata && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Metadata</p>
                  <div className="border rounded-lg p-4 max-h-64 overflow-y-auto">
                    <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(callDetails.metadata, null, 2)}</pre>
                  </div>
                </div>
              )}

              {/* Audio Recording */}
              {selectedCall.audio_url && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Recording</p>
                  <ReactPlayer url={selectedCall.audio_url} controls width="100%" height="50px" />
                </div>
              )}

              {/* Full Details (for debugging) */}
              <details className="border rounded-lg p-4">
                <summary className="text-sm font-medium cursor-pointer">Full Details (JSON)</summary>
                <pre className="text-xs mt-2 overflow-auto max-h-64 whitespace-pre-wrap">
                  {JSON.stringify(callDetails || selectedCall, null, 2)}
                </pre>
              </details>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

