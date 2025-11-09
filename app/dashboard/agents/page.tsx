'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { apiClient } from '@/lib/api/client'
import { Plus, Trash2, Phone } from 'lucide-react'
// import { VoiceConversation } from '@/components/voice-conversation' // Commented out - using Twilio outbound calls

interface Agent {
  agent_id: string
  name: string
  description?: string
  custom_name?: string
  tone?: string
  personality?: string
  agent_type?: 'inbound' | 'outbound'
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isTestCallOpen, setIsTestCallOpen] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [formData, setFormData] = useState({
    eleven_agent_id: '',
    name: '',
    tone: 'friendly',
    personality: '',
    agent_type: 'outbound' as 'inbound' | 'outbound'
  })
  const [testCallData, setTestCallData] = useState({
    to_number: '',
    agent_phone_number_id: '',
    customer_name: ''
  })
  const [phoneNumbers, setPhoneNumbers] = useState<any[]>([])
  const [isLoadingPhoneNumbers, setIsLoadingPhoneNumbers] = useState(false)
  const [isCalling, setIsCalling] = useState(false)

  useEffect(() => {
    fetchAgents()
  }, [])

  const fetchAgents = async () => {
    try {
      const response = await apiClient.get('/agents')
      const agentsList = response.data.agents || []
      console.log('Fetched agents:', agentsList)
      console.log('First agent structure:', agentsList[0])
      setAgents(agentsList)
    } catch (error) {
      console.error('Failed to fetch agents:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await apiClient.post('/agents/create', formData)
      setIsCreateOpen(false)
      setFormData({ eleven_agent_id: '', name: '', tone: 'friendly', personality: '', agent_type: 'outbound' })
      fetchAgents()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to create agent')
    }
  }

  const handleDelete = async (agentId: string) => {
    if (!confirm('Are you sure you want to delete this agent?')) return
    try {
      await apiClient.delete(`/agents/${agentId}`)
      fetchAgents()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete agent')
    }
  }

  const handleTestCall = async (agent: Agent) => {
    console.log('Call Now clicked for agent:', agent)
    console.log('Agent ID:', agent.agent_id)
    
    // Verify agent has agent_id
    if (!agent.agent_id) {
      console.error('Agent missing agent_id!', agent)
      alert('Error: Agent ID is missing. Please refresh the page and try again.')
      return
    }
    
    setSelectedAgent(agent)
    setTestCallData({
      to_number: '',
      agent_phone_number_id: '',
      customer_name: ''
    })
    setIsTestCallOpen(true)
    setIsLoadingPhoneNumbers(true)
    
    try {
      const response = await apiClient.get('/calls/phone-numbers')
      console.log('Phone numbers response:', response.data)
      const phoneNumbersList = response.data.phone_numbers || []
      
      if (phoneNumbersList.length === 0) {
        alert('No phone numbers found in ElevenLabs. Please configure a phone number in your ElevenLabs dashboard first.')
        setIsLoadingPhoneNumbers(false)
        return
      }
      
      // Filter phone numbers that support outbound calls
      let outboundNumbers = phoneNumbersList.filter((pn: any) => pn.supports_outbound !== false)
      
      // If no outbound numbers, show all numbers (some APIs might not have supports_outbound field)
      if (outboundNumbers.length === 0) {
        console.warn('No phone numbers with supports_outbound=true, showing all numbers')
        outboundNumbers = phoneNumbersList
      }
      
      // Filter by selected agent if phone number is assigned to an agent
      // Show phone numbers assigned to this agent, or unassigned phone numbers
      const filteredNumbers = outboundNumbers.filter((pn: any) => {
        if (!pn.assigned_agent) return true // Show unassigned numbers
        return pn.assigned_agent.agent_id === agent.agent_id // Show numbers assigned to this agent
      })
      
      // If filtered by agent returns nothing, show all outbound numbers
      const finalNumbers = filteredNumbers.length > 0 ? filteredNumbers : outboundNumbers
      
      // Log phone numbers for debugging
      console.log('Phone numbers to display:', finalNumbers.map((pn: any) => ({
        phone_number_id: pn.phone_number_id || pn.id || pn.phoneNumberId,
        phone_number: pn.phone_number || pn.phone,
        label: pn.label,
        assigned_agent: pn.assigned_agent
      })));
      
      setPhoneNumbers(finalNumbers)
      
      if (finalNumbers.length === 0) {
        alert('No phone numbers available for this agent. Please configure a phone number in ElevenLabs and assign it to this agent.')
      }
    } catch (error: any) {
      console.error('Failed to fetch phone numbers:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch phone numbers'
      alert(`Failed to fetch phone numbers: ${errorMessage}\n\nPlease check:\n1. Your ElevenLabs API key is correct\n2. You have phone numbers configured in ElevenLabs\n3. Your backend is running and connected to ElevenLabs`)
    } finally {
      setIsLoadingPhoneNumbers(false)
    }
  }

  const handleInitiateTestCall = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAgent) {
      alert('No agent selected')
      return
    }

    // Validate required fields
    if (!testCallData.to_number || !testCallData.to_number.trim()) {
      alert('Please enter a phone number to call')
      return
    }

    if (!testCallData.agent_phone_number_id || !testCallData.agent_phone_number_id.trim()) {
      alert('Please select a phone number from ElevenLabs')
      return
    }

    // Get the correct agent_id - try multiple possible field names
    const agentId = selectedAgent.agent_id || 
                    (selectedAgent as any).eleven_agent_id || 
                    (selectedAgent as any).id || 
                    (selectedAgent as any).agentId
    
    if (!agentId) {
      console.error('Agent ID is missing! Selected agent:', selectedAgent)
      alert(`Agent ID is missing. Please refresh the page and try again.\n\nAgent object: ${JSON.stringify(selectedAgent, null, 2)}`)
      return
    }

    // Validate phone number ID format (should be like phnum_xxx, not display text)
    if (testCallData.agent_phone_number_id && 
        !testCallData.agent_phone_number_id.startsWith('phnum_') && 
        !testCallData.agent_phone_number_id.match(/^[a-zA-Z0-9_]+$/)) {
      console.error('Invalid phone number ID format:', testCallData.agent_phone_number_id);
      alert('Error: Invalid phone number ID. Please select a phone number from the dropdown again.')
      return
    }
    
    console.log('Initiating call with:', {
      agent_id: agentId,
      agent_phone_number_id: testCallData.agent_phone_number_id,
      to_number: testCallData.to_number,
      customer_name: testCallData.customer_name,
      selectedAgent: selectedAgent,
      selectedAgentKeys: Object.keys(selectedAgent),
      phoneNumberIdType: typeof testCallData.agent_phone_number_id,
      phoneNumberIdLength: testCallData.agent_phone_number_id?.length
    })

    setIsCalling(true)
    try {
      const response = await apiClient.post('/calls/initiate', {
        agent_id: agentId,
        agent_phone_number_id: testCallData.agent_phone_number_id,
        to_number: testCallData.to_number.trim(),
        customer_name: testCallData.customer_name?.trim() || undefined
      })
      
      // Handle both camelCase (from SDK) and snake_case (from REST API)
      const conversationId = response.data.call_result?.conversationId || 
                             response.data.call_result?.conversation_id || 
                             'N/A';
      alert(`Call initiated successfully! Conversation ID: ${conversationId}`)
      setIsTestCallOpen(false)
      setTestCallData({ to_number: '', agent_phone_number_id: '', customer_name: '' })
    } catch (error: any) {
      console.error('Failed to initiate call:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Failed to initiate call'
      alert(`Failed to initiate call: ${errorMessage}\n\nPlease check:\n1. All fields are filled correctly\n2. Phone number is in correct format (e.g., +1234567890)\n3. Agent ID and phone number ID are valid`)
    } finally {
      setIsCalling(false)
    }
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
          <h1 className="text-3xl font-bold">Agents</h1>
          <p className="text-muted-foreground mt-2">Manage your AI voice agents</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Agent
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {agents.map((agent) => (
          <Card key={agent.agent_id}>
            <CardHeader>
              <CardTitle>{agent.custom_name || agent.name}</CardTitle>
              <CardDescription>{agent.description || 'No description'}</CardDescription>
            </CardHeader>
            <CardContent>
                    <div className="space-y-2 mb-4">
                      <div>
                        <span className="text-sm text-muted-foreground">Tone: </span>
                        <span className="text-sm font-medium">{agent.tone || 'friendly'}</span>
                      </div>
                      {agent.agent_type && (
                        <div>
                          <span className="text-sm text-muted-foreground">Type: </span>
                          <span className={`text-sm font-medium px-2 py-1 rounded ${
                            agent.agent_type === 'inbound' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {agent.agent_type === 'inbound' ? 'Inbound' : 'Outbound'}
                          </span>
                        </div>
                      )}
                      {agent.personality && (
                        <div>
                          <span className="text-sm text-muted-foreground">Personality: </span>
                          <span className="text-sm">{agent.personality}</span>
                        </div>
                      )}
                    </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => handleTestCall(agent)}
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Call Now
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(agent.agent_id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {agents.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No agents yet. Create your first agent to get started.</p>
          </CardContent>
        </Card>
      )}

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Agent</DialogTitle>
            <DialogDescription>
              Customize an ElevenLabs agent for your brand
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate}>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="eleven_agent_id">ElevenLabs Agent ID</Label>
                <Input
                  id="eleven_agent_id"
                  value={formData.eleven_agent_id}
                  onChange={(e) => setFormData({ ...formData, eleven_agent_id: e.target.value })}
                  required
                  placeholder="Enter agent ID from ElevenLabs"
                />
              </div>
              <div>
                <Label htmlFor="name">Custom Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="e.g., Sales Agent"
                />
              </div>
              <div>
                <Label htmlFor="tone">Tone</Label>
                <Select
                  id="tone"
                  value={formData.tone}
                  onChange={(e) => setFormData({ ...formData, tone: e.target.value })}
                >
                  <option value="friendly">Friendly</option>
                  <option value="formal">Formal</option>
                  <option value="luxury">Luxury</option>
                  <option value="conversational">Conversational</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="personality">Personality</Label>
                <Textarea
                  id="personality"
                  value={formData.personality}
                  onChange={(e) => setFormData({ ...formData, personality: e.target.value })}
                  placeholder="Describe the agent's personality..."
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="agent_type">Agent Type</Label>
                <Select
                  id="agent_type"
                  value={formData.agent_type}
                  onChange={(e) => setFormData({ ...formData, agent_type: e.target.value as 'inbound' | 'outbound' })}
                  required
                >
                  <option value="outbound">Outbound (Makes calls)</option>
                  <option value="inbound">Inbound (Receives calls)</option>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Outbound agents make calls to customers. Inbound agents receive calls from customers.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Agent</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isTestCallOpen} onOpenChange={setIsTestCallOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Initiate Call</DialogTitle>
            <DialogDescription>
              Make a call using {selectedAgent?.custom_name || selectedAgent?.name}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleInitiateTestCall}>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="to_number">Phone Number to Call</Label>
                <Input
                  id="to_number"
                  type="tel"
                  value={testCallData.to_number}
                  onChange={(e) => setTestCallData({ ...testCallData, to_number: e.target.value })}
                  required
                  placeholder="+1234567890"
                  pattern="^\+?[1-9]\d{1,14}$"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Enter phone number in E.164 format (e.g., +1234567890). Include country code.
                </p>
              </div>
              <div>
                <Label htmlFor="agent_phone_number_id">Select Phone Number</Label>
                {isLoadingPhoneNumbers ? (
                  <div className="mt-2 text-sm text-muted-foreground">Loading phone numbers...</div>
                ) : (
                  <Select
                    id="agent_phone_number_id"
                    value={testCallData.agent_phone_number_id}
                    onChange={(e) => setTestCallData({ ...testCallData, agent_phone_number_id: e.target.value })}
                    required
                    className="mt-2"
                  >
                    <option value="">Select a phone number</option>
                    {phoneNumbers.map((pn) => {
                      // Get phone_number_id - try multiple possible field names
                      const phoneNumberId = pn.phone_number_id || pn.id || pn.phoneNumberId;
                      
                      if (!phoneNumberId) {
                        console.error('Phone number missing phone_number_id!', pn);
                      }
                      
                      // Display text
                      const displayText = `${pn.phone_number || pn.phone || ''} ${pn.label ? `(${pn.label})` : ''} ${pn.assigned_agent ? ` - ${pn.assigned_agent.agent_name || pn.assigned_agent.agent_id}` : ' (Unassigned)'}`;
                      
                      return (
                        <option key={phoneNumberId || pn.phone_number} value={phoneNumberId || ''}>
                          {displayText}
                        </option>
                      );
                    })}
                  </Select>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Select a phone number configured in ElevenLabs
                </p>
              </div>
              <div>
                <Label htmlFor="customer_name">Customer Name (Optional)</Label>
                <Input
                  id="customer_name"
                  type="text"
                  value={testCallData.customer_name}
                  onChange={(e) => setTestCallData({ ...testCallData, customer_name: e.target.value })}
                  placeholder="John Doe"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Optional: Enter customer name for personalization
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsTestCallOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isCalling || isLoadingPhoneNumbers || !testCallData.agent_phone_number_id}>
                {isCalling ? 'Initiating Call...' : 'Initiate Call'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

