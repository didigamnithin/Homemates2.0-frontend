'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { apiClient } from '@/lib/api/client'
import { Mic, MicOff, CheckCircle } from 'lucide-react'

interface TenantOnboardingProps {
  onComplete: () => void
  phoneNumber: string
}

export default function TenantOnboarding({ onComplete, phoneNumber }: TenantOnboardingProps) {
  const [formData, setFormData] = useState({
    Name: '',
    Mobile: phoneNumber,
    Locality: '',
    Budget: '',
    BHKtype: '',
    'Must Need amenities': '',
    Others: ''
  })
  const [isRecording, setIsRecording] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Create tenant in backend
      // Format data according to tenants.csv: Name, Mobile, Locality, Budget, BHKtype, Must Need amenities, Others
      await apiClient.post('/tenants', {
        name: formData.Name,
        phone: formData.Mobile,
        localities: formData.Locality,
        budget_min: formData.Budget ? parseInt(formData.Budget) * 0.8 : '',
        budget_max: formData.Budget ? parseInt(formData.Budget) : '',
        bedrooms: formData.BHKtype.replace(' BHK', ''),
        amenities: formData['Must Need amenities'],
        preferences: JSON.stringify({
          others: formData.Others
        }),
        city: 'Hyderabad',
        source: 'app',
        consent_timestamp: new Date().toISOString(),
        consent_scope: 'contact,recording'
      })

      setIsComplete(true)
      setTimeout(() => {
        onComplete()
      }, 1500)
    } catch (error: any) {
      console.error('Failed to save tenant requirements:', error)
      alert(error.response?.data?.message || 'Failed to save requirements')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleVoiceInput = () => {
    setIsRecording(!isRecording)
    // TODO: Implement voice input using Web Speech API or external service
    if (!isRecording) {
      // Start recording
      alert('Voice input feature coming soon! Please use text input for now.')
      setIsRecording(false)
    }
  }

  if (isComplete) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Requirements Saved!</h2>
              <p className="text-muted-foreground">Finding matching properties for you...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <CardTitle className="text-2xl">Welcome! Let's find your perfect home</CardTitle>
          <CardDescription>
            Please provide your requirements. You can enter them manually or use voice input.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  required
                  value={formData.Name}
                  onChange={(e) => setFormData({ ...formData, Name: e.target.value })}
                  placeholder="Enter your name"
                />
              </div>
              <div>
                <Label htmlFor="mobile">Mobile Number *</Label>
                <Input
                  id="mobile"
                  required
                  value={formData.Mobile}
                  onChange={(e) => setFormData({ ...formData, Mobile: e.target.value })}
                  placeholder="+91 9876543210"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="locality">Preferred Locality *</Label>
              <Input
                id="locality"
                required
                value={formData.Locality}
                onChange={(e) => setFormData({ ...formData, Locality: e.target.value })}
                placeholder="e.g., Madhapur, Gachibowli, Hitech City"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="budget">Budget (₹ per month) *</Label>
                <Input
                  id="budget"
                  type="number"
                  required
                  value={formData.Budget}
                  onChange={(e) => setFormData({ ...formData, Budget: e.target.value })}
                  placeholder="e.g., 25000"
                />
              </div>
              <div>
                <Label htmlFor="bhk">BHK Type *</Label>
                <Select
                  id="bhk"
                  required
                  value={formData.BHKtype}
                  onChange={(e) => setFormData({ ...formData, BHKtype: e.target.value })}
                >
                  <option value="">Select BHK</option>
                  <option value="1 BHK">1 BHK</option>
                  <option value="2 BHK">2 BHK</option>
                  <option value="3 BHK">3 BHK</option>
                  <option value="4 BHK">4 BHK</option>
                </Select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="amenities">Must Need Amenities *</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleVoiceInput}
                  className="flex items-center gap-2"
                >
                  {isRecording ? (
                    <>
                      <MicOff className="h-4 w-4" />
                      Stop Recording
                    </>
                  ) : (
                    <>
                      <Mic className="h-4 w-4" />
                      Voice Input
                    </>
                  )}
                </Button>
              </div>
              <Input
                id="amenities"
                required
                value={formData['Must Need amenities']}
                onChange={(e) => setFormData({ ...formData, 'Must Need amenities': e.target.value })}
                placeholder="e.g., Parking, Lift, Security, Gym, Swimming Pool"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Separate multiple amenities with commas
              </p>
            </div>

            <div>
              <Label htmlFor="others">Other Preferences</Label>
              <Textarea
                id="others"
                value={formData.Others}
                onChange={(e) => setFormData({ ...formData, Others: e.target.value })}
                placeholder="Any other requirements or preferences..."
                rows={3}
              />
            </div>

            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? 'Saving...' : 'Save Requirements & Find Properties'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

