'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { apiClient } from '@/lib/api/client'
import { useAuthStore } from '@/lib/store/auth'
import { useRouter } from 'next/navigation'
import { Search, MapPin, Bed, Square, IndianRupee, Phone, Sparkles } from 'lucide-react'
import InboundAgent from '@/components/agents/InboundAgent'
import ShaderBackground from '@/components/ui/ShaderBackground'
import dynamic from 'next/dynamic'

// Dynamically import InboundAgent to avoid SSR issues
const InboundAgentDynamic = dynamic(() => import('@/components/agents/InboundAgent'), { ssr: false })

interface Property {
  property_id: string
  property_code: string
  title: string
  address: string
  city: string
  locality: string
  rent: string
  available_from: string
  bedrooms: string
  bathrooms: string
  area_sqft: string
  amenities: string
  furnishing: string
  status: string
  description: string
  owner_name?: string
  owner_phone?: string
}

export default function PropertiesPage() {
  const router = useRouter()
  const { user, userType } = useAuthStore()
  const [properties, setProperties] = useState<Property[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState({
    city: '',
    status: 'available',
    search: ''
  })
  const [showInboundAgent, setShowInboundAgent] = useState(false)
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)

  useEffect(() => {
    if (userType === 'tenant') {
      fetchMatchingProperties()
    } else {
      fetchProperties()
    }
  }, [filters, userType])

  const fetchMatchingProperties = async () => {
    try {
      setIsLoading(true)
      const phoneNumber = (user as any)?.phone || user?.email || ''
      if (!phoneNumber) {
        fetchProperties()
        return
      }

      try {
        const tenantResponse = await apiClient.get(`/tenants/phone/${phoneNumber}`)
        const tenant = tenantResponse.data.tenant

        if (tenant) {
          const params = new URLSearchParams()
          if (tenant.city) params.append('city', tenant.city)
          if (tenant.localities) params.append('locality', tenant.localities)
          if (tenant.bedrooms) params.append('bedrooms', tenant.bedrooms)
          if (tenant.budget_min) params.append('budget_min', tenant.budget_min)
          if (tenant.budget_max) params.append('budget_max', tenant.budget_max)
          if (tenant.amenities) params.append('amenities', tenant.amenities)

          const response = await apiClient.get(`/properties/match?${params.toString()}`)
          let filteredProperties = response.data.properties || []

          // If no matches, show all available properties
          if (filteredProperties.length === 0) {
            const allResponse = await apiClient.get('/properties?status=available')
            filteredProperties = allResponse.data.properties || []
          }

          if (filters.search) {
            const searchLower = filters.search.toLowerCase()
            filteredProperties = filteredProperties.filter((p: Property) =>
              p.title?.toLowerCase().includes(searchLower) ||
              p.locality?.toLowerCase().includes(searchLower) ||
              p.property_code?.toLowerCase().includes(searchLower)
            )
          }

          setProperties(filteredProperties)
        } else {
          fetchProperties()
        }
      } catch (error) {
        console.error('Tenant not found, showing all properties:', error)
        fetchProperties()
      }
    } catch (error) {
      console.error('Failed to fetch matching properties:', error)
      fetchProperties()
    } finally {
      setIsLoading(false)
    }
  }

  const fetchProperties = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (filters.city) params.append('city', filters.city)
      if (filters.status) params.append('status', filters.status)

      const response = await apiClient.get(`/properties?${params.toString()}`)
      let filteredProperties = response.data.properties || []

      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        filteredProperties = filteredProperties.filter((p: Property) =>
          p.title?.toLowerCase().includes(searchLower) ||
          p.locality?.toLowerCase().includes(searchLower) ||
          p.property_code?.toLowerCase().includes(searchLower)
        )
      }

      // For owners, show only 5 properties
      if (userType === 'owner') {
        filteredProperties = filteredProperties.slice(0, 5)
      }

      setProperties(filteredProperties)
    } catch (error) {
      console.error('Failed to fetch properties:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCall = (property: Property) => {
    setSelectedProperty(property)
    setShowInboundAgent(true)
  }

  const getUniqueCities = () => {
    const cities = new Set(properties.map(p => p.city).filter(Boolean))
    return Array.from(cities).sort()
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
        {showInboundAgent && selectedProperty && userType === 'tenant' && (
          <InboundAgentDynamic 
            calleeName={selectedProperty.owner_name || 'Owner'}
            propertyCode={selectedProperty.property_code}
          />
        )}

        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 gap-4">
            <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-homie-blue to-homie-blue-light bg-clip-text text-transparent">
              {userType === 'tenant' ? 'Matching Properties' : 'My Properties'}
            </h1>
            <p className="text-muted-foreground mt-2 text-sm md:text-base">
              {userType === 'tenant' 
                ? 'Properties that match your requirements' 
                : 'All your properties'}
            </p>
          </div>
          {userType === 'owner' && (
            <Button 
              onClick={() => router.push('/dashboard/properties-owner')}
              className="homie-gradient text-white shadow-lg hover:shadow-xl transition-all"
            >
              Add Property
            </Button>
          )}
          </div>

        {/* Filters - Mobile Responsive */}
        {userType === 'owner' && (
          <Card className="mb-6 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="search">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Search properties..."
                      value={filters.search}
                      onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="city">City</Label>
                  <Select
                    id="city"
                    value={filters.city}
                    onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                  >
                    <option value="">All Cities</option>
                    {getUniqueCities().map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    id="status"
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  >
                    <option value="available">Available</option>
                    <option value="booked">Booked</option>
                    <option value="">All</option>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Properties Grid - Mobile Responsive */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {properties.length === 0 ? (
            <div className="col-span-full">
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardContent className="pt-6">
                  <p className="text-muted-foreground text-center py-8">No properties found</p>
                </CardContent>
              </Card>
            </div>
          ) : (
            properties.map((property) => (
              <Card 
                key={property.property_id} 
                className="shadow-lg hover:shadow-xl transition-all duration-300 border-0 bg-white/90 backdrop-blur-sm overflow-hidden group"
              >
                <div className="homie-gradient h-2 w-full"></div>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg md:text-xl mb-1 line-clamp-1">
                        {property.title || 'N/A'}
                      </CardTitle>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4 text-homie-blue" />
                        <span className="line-clamp-1">{property.locality || 'N/A'}, {property.city || 'N/A'}</span>
                      </div>
                    </div>
                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-homie-blue/10 text-homie-blue">
                      {property.property_code || 'N/A'}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-50">
                      <IndianRupee className="h-4 w-4 text-homie-blue" />
                      <div>
                        <p className="text-xs text-muted-foreground">Rent</p>
                        <p className="font-bold text-homie-blue">₹{property.rent || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-100">
                      <Bed className="h-4 w-4 text-homie-blue-dark" />
                      <div>
                        <p className="text-xs text-muted-foreground">BHK</p>
                        <p className="font-bold text-homie-blue-dark">{property.bedrooms || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <Square className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{property.area_sqft || 'N/A'} sqft</span>
                  </div>

                  {property.amenities && (
                    <div className="text-sm">
                      <p className="text-xs text-muted-foreground mb-1">Amenities</p>
                      <p className="line-clamp-2 text-foreground">{property.amenities}</p>
                    </div>
                  )}

                  {userType === 'owner' && (
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="text-sm">
                        <p className="text-xs text-muted-foreground">Status</p>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          property.status === 'available' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {property.status || 'N/A'}
                        </span>
                      </div>
                      {property.available_from && (
                        <div className="text-xs text-muted-foreground">
                          {new Date(property.available_from).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  )}

                  {userType === 'tenant' && (
                    <Button
                      onClick={() => handleCall(property)}
                      className="w-full call-homie-button text-white font-semibold py-4 md:py-6 text-sm md:text-lg flex items-center justify-center gap-2"
                      size="lg"
                    >
                      <Sparkles className="h-4 w-4 md:h-5 md:w-5" />
                      Call Homie
                      <Phone className="h-4 w-4 md:h-5 md:w-5" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Call Homie Banner for Tenants */}
        {userType === 'tenant' && properties.length > 0 && (
          <Card className="mt-6 shadow-xl border-0 homie-gradient text-white">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl md:text-2xl font-bold mb-2 flex items-center gap-2">
                    <Sparkles className="h-6 w-6" />
                    Our Best-in-Class Real Estate Voice Agent
                  </h3>
                  <p className="text-white/90 text-sm md:text-base">
                    Click "Call Homie" on any property to connect with our AI-powered voice agent
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
    </div>
  )
}
