'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { apiClient } from '@/lib/api/client'
import { Search, Phone, Mail, MapPin, Calendar, CheckCircle, XCircle, Sparkles } from 'lucide-react'
import OutboundAgent from '@/components/agents/OutboundAgent'
import ShaderBackground from '@/components/ui/ShaderBackground'
import dynamic from 'next/dynamic'

// Dynamically import OutboundAgent to avoid SSR issues
const OutboundAgentDynamic = dynamic(() => import('@/components/agents/OutboundAgent'), { ssr: false })

interface Lead {
  lead_id: string
  tenant_id: string
  property_id: string
  property_code: string
  channel: string
  transcript: string
  call_recording_url: string
  match_score: string
  status: string
  matching_properties_count?: number
  tenant?: {
    tenant_id: string
    name: string
    phone: string
    whatsapp_number?: string
    email?: string
    city: string
    localities?: string
    budget_min?: string
    budget_max?: string
    bedrooms?: string
    amenities?: string
  }
  property?: {
    property_id: string
    property_code: string
    title: string
    locality: string
    rent: string
    bedrooms?: string
    area_sqft?: string
    amenities?: string
  }
  created_at: string
  updated_at: string
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [showAgent, setShowAgent] = useState(false)
  const [selectedTenant, setSelectedTenant] = useState<Lead | null>(null)
  const [filters, setFilters] = useState({
    status: 'new',
    search: ''
  })

  useEffect(() => {
    fetchLeads()
  }, [filters])

  const fetchLeads = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (filters.status) params.append('status', filters.status)

      // Get leads (tenants.csv as leads with matching)
      const response = await apiClient.get(`/leads?${params.toString()}`)
      let filteredLeads = response.data.leads || []

      // Apply search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        filteredLeads = filteredLeads.filter((lead: Lead) =>
          lead.tenant?.name?.toLowerCase().includes(searchLower) ||
          lead.tenant?.phone?.includes(searchLower) ||
          lead.property_code?.toLowerCase().includes(searchLower) ||
          lead.property?.title?.toLowerCase().includes(searchLower) ||
          lead.tenant?.localities?.toLowerCase().includes(searchLower)
        )
      }

      setLeads(filteredLeads)
    } catch (error) {
      console.error('Failed to fetch leads:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClaimLead = async (leadId: string) => {
    try {
      await apiClient.post(`/leads/${leadId}/claim`, {
        owner_user_id: 'current_user' // Replace with actual user ID
      })
      fetchLeads()
      alert('Lead claimed successfully!')
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to claim lead')
    }
  }

  const handleUpdateStatus = async (leadId: string, status: string) => {
    try {
      await apiClient.put(`/leads/${leadId}`, { status })
      fetchLeads()
      alert('Lead status updated!')
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to update lead')
    }
  }

  const handleCall = (lead: Lead) => {
    if (!lead.tenant?.phone) {
      alert('Phone number not available for this lead')
      return
    }
    setSelectedTenant(lead)
    setShowAgent(true)
  }

  const formatMatchScore = (score: string) => {
    const numScore = parseFloat(score) * 100
    return `${numScore.toFixed(0)}%`
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen relative">
        <ShaderBackground />
        <div className="relative z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative p-4 md:p-8">
      <ShaderBackground />
      <div className="relative z-10">
        {showAgent && selectedTenant && (
          <OutboundAgentDynamic 
            calleeName={selectedTenant.tenant?.name || 'Tenant'}
            tenantId={selectedTenant.tenant_id}
            mobileNumber={selectedTenant.tenant?.phone}
            onCallInitiated={(callId) => {
              console.log('Call initiated:', callId)
              setShowAgent(false)
              alert('Call initiated successfully!')
            }}
            onError={(error) => {
              console.error('Call error:', error)
              alert(`Failed to initiate call: ${error}`)
              setShowAgent(false)
            }}
          />
        )}

        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 gap-4">
            <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-homie-blue to-homie-blue-light bg-clip-text text-transparent">
              Leads
            </h1>
            <p className="text-muted-foreground mt-2 text-sm md:text-base">View and manage property leads</p>
            </div>
          </div>

        {/* Filters - Mobile Responsive */}
        <Card className="mb-6 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg md:text-xl">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by tenant name, phone, or property code..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                id="status"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="claimed">Claimed</option>
                <option value="converted">Converted</option>
                <option value="rejected">Rejected</option>
                <option value="">All</option>
              </Select>
            </div>
          </div>
        </CardContent>
        </Card>

        {/* Leads Grid - Mobile Responsive */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6">
          {leads.length === 0 ? (
            <div className="col-span-full">
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardContent className="pt-6">
                  <p className="text-muted-foreground text-center py-8">No leads found</p>
                </CardContent>
              </Card>
            </div>
          ) : (
            leads.map((lead) => (
              <Card 
                key={lead.lead_id} 
                className="shadow-lg hover:shadow-xl transition-all duration-300 border-0 bg-white/90 backdrop-blur-sm overflow-hidden group"
              >
                <div className="homie-gradient h-2 w-full"></div>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg md:text-xl mb-1">
                        {lead.tenant?.name || 'Unknown Tenant'}
                      </CardTitle>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-4 w-4 text-homie-blue" />
                        <span>{lead.tenant?.phone || 'N/A'}</span>
                      </div>
                      {lead.tenant?.city && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <MapPin className="h-3 w-3" />
                          <span>{lead.tenant.city}</span>
                        </div>
                      )}
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      lead.status === 'new' 
                        ? 'bg-homie-blue/10 text-homie-blue'
                        : lead.status === 'converted'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {lead.status || 'N/A'}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    {lead.property ? (
                      <>
                        <p className="text-sm font-semibold mb-1">{lead.property.title || 'N/A'}</p>
                        <p className="text-xs text-muted-foreground">Code: {lead.property_code || 'N/A'}</p>
                        {lead.property.locality && (
                          <p className="text-xs text-muted-foreground mt-1">{lead.property.locality}</p>
                        )}
                        {lead.property.rent && (
                          <p className="text-sm font-bold text-homie-blue mt-1">₹{lead.property.rent}</p>
                        )}
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-semibold mb-1 text-gray-500">No matching property</p>
                        <p className="text-xs text-muted-foreground">
                          {lead.tenant?.localities && `Looking in: ${lead.tenant.localities}`}
                        </p>
                        {lead.tenant?.budget_min && lead.tenant?.budget_max && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Budget: ₹{lead.tenant.budget_min} - ₹{lead.tenant.budget_max}
                          </p>
                        )}
                        {lead.tenant?.bedrooms && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {lead.tenant.bedrooms} BHK
                          </p>
                        )}
                      </>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        {lead.matching_properties_count !== undefined 
                          ? `${lead.matching_properties_count} matching properties`
                          : 'Match Score'}
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 rounded-full bg-gray-200 overflow-hidden">
                          <div 
                            className={`h-full ${
                              parseFloat(lead.match_score || '0') > 0.7 
                                ? 'bg-green-500' 
                                : parseFloat(lead.match_score || '0') > 0.5
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                            }`} 
                            style={{
                              width: `${parseFloat(lead.match_score || '0') * 100}%`
                            }}
                          ></div>
                        </div>
                        <span className="text-sm font-semibold">
                          {formatMatchScore(lead.match_score || '0')}
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(lead.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedLead(lead)
                        setIsDetailOpen(true)
                      }}
                      className="flex-1"
                    >
                      View
                    </Button>
                    <Button
                      onClick={() => handleCall(lead)}
                      className="flex-1 call-homie-button text-white font-semibold flex items-center justify-center gap-2"
                      size="sm"
                    >
                      <Sparkles className="h-4 w-4" />
                      Call Homie
                      <Phone className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Call Homie Banner for Owners */}
        {leads.length > 0 && (
          <Card className="shadow-xl border-0 homie-gradient text-white">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl md:text-2xl font-bold mb-2 flex items-center gap-2">
                    <Sparkles className="h-6 w-6" />
                    Our Best-in-Class Real Estate Voice Agent
                  </h3>
                  <p className="text-white/90 text-sm md:text-base">
                    Click "Call Homie" on any lead to connect with our AI-powered voice agent
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-8 w-8 animate-pulse" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        </div>
        </div>

        {/* Lead Detail Dialog */}
        {selectedLead && (
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Lead Details</DialogTitle>
              <DialogDescription>
                Complete information about this lead
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              {/* Tenant Information */}
              <div>
                <h3 className="font-semibold mb-2">Tenant Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">{selectedLead.tenant?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{selectedLead.tenant?.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">City</p>
                    <p className="font-medium">{selectedLead.tenant?.city || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Property Information */}
              {selectedLead.property && (
                <div>
                  <h3 className="font-semibold mb-2">Property Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Title</p>
                      <p className="font-medium">{selectedLead.property.title}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Code</p>
                      <p className="font-medium">{selectedLead.property_code}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Locality</p>
                      <p className="font-medium">{selectedLead.property.locality}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Rent</p>
                      <p className="font-medium">₹{selectedLead.property.rent}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Call Information */}
              <div>
                <h3 className="font-semibold mb-2">Call Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Channel</p>
                    <p className="font-medium">{selectedLead.channel || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Match Score</p>
                    <p className="font-medium">{formatMatchScore(selectedLead.match_score || '0')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className="font-medium">{selectedLead.status || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Created</p>
                    <p className="font-medium">
                      {new Date(selectedLead.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Transcript */}
              {selectedLead.transcript && (
                <div>
                  <h3 className="font-semibold mb-2">Transcript</h3>
                  <div className="border rounded-lg p-4 max-h-64 overflow-y-auto">
                    <p className="text-sm whitespace-pre-wrap">{selectedLead.transcript}</p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-4">
                {selectedLead.status === 'new' && (
                  <Button onClick={() => handleClaimLead(selectedLead.lead_id)}>
                    Claim Lead
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => handleUpdateStatus(selectedLead.lead_id, 'contacted')}
                >
                  Mark as Contacted
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleUpdateStatus(selectedLead.lead_id, 'converted')}
                >
                  Mark as Converted
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleUpdateStatus(selectedLead.lead_id, 'rejected')}
                >
                  Reject
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

