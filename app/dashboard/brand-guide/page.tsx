'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { apiClient } from '@/lib/api/client'
import { Upload, Save } from 'lucide-react'

interface BrandGuide {
  id?: string
  tone: string
  description?: string
  keywords?: string[]
  script_examples?: string
  logo_url?: string
  voice_note_url?: string
}

export default function BrandGuidePage() {
  const [brandGuide, setBrandGuide] = useState<BrandGuide | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    tone: 'friendly',
    description: '',
    keywords: '',
    script_examples: '',
    logo: null as File | null,
    voice_note: null as File | null
  })

  useEffect(() => {
    fetchBrandGuide()
  }, [])

  const fetchBrandGuide = async () => {
    try {
      const response = await apiClient.get('/brand-guide')
      if (response.data.brand_guide) {
        const bg = response.data.brand_guide
        setBrandGuide(bg)
        setFormData({
          tone: bg.tone || 'friendly',
          description: bg.description || '',
          keywords: Array.isArray(bg.keywords) ? bg.keywords.join(', ') : '',
          script_examples: bg.script_examples || '',
          logo: null,
          voice_note: null
        })
      }
    } catch (error) {
      console.error('Failed to fetch brand guide:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const formDataToSend = new FormData()
      formDataToSend.append('tone', formData.tone)
      formDataToSend.append('description', formData.description)
      formDataToSend.append('keywords', formData.keywords)
      formDataToSend.append('script_examples', formData.script_examples)
      if (formData.logo) {
        formDataToSend.append('logo', formData.logo)
      }
      if (formData.voice_note) {
        formDataToSend.append('voice_note', formData.voice_note)
      }

      const response = await apiClient.post('/brand-guide', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      setBrandGuide(response.data.brand_guide)
      alert('Brand guide saved successfully!')
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to save brand guide')
    } finally {
      setIsSaving(false)
    }
  }

  const getToneLabel = (tone: string) => {
    const tones: { [key: string]: string } = {
      'formal': 'Formal',
      'friendly': 'Friendly',
      'luxury': 'Luxury',
      'conversational': 'Conversational'
    }
    return tones[tone] || tone
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Brand Guide</h1>
        <p className="text-muted-foreground mt-2">Configure your brand voice and guidelines</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Brand Tone</CardTitle>
              <CardDescription>Set the tone for your AI agents</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Tone: {getToneLabel(formData.tone)}</Label>
                <div className="mt-2 space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      value="formal"
                      checked={formData.tone === 'formal'}
                      onChange={(e) => setFormData({ ...formData, tone: e.target.value })}
                      className="w-4 h-4"
                    />
                    <span>Formal</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      value="friendly"
                      checked={formData.tone === 'friendly'}
                      onChange={(e) => setFormData({ ...formData, tone: e.target.value })}
                      className="w-4 h-4"
                    />
                    <span>Friendly</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      value="luxury"
                      checked={formData.tone === 'luxury'}
                      onChange={(e) => setFormData({ ...formData, tone: e.target.value })}
                      className="w-4 h-4"
                    />
                    <span>Luxury</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      value="conversational"
                      checked={formData.tone === 'conversational'}
                      onChange={(e) => setFormData({ ...formData, tone: e.target.value })}
                      className="w-4 h-4"
                    />
                    <span>Conversational</span>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Brand Assets</CardTitle>
              <CardDescription>Upload logo and voice samples</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="logo">Logo (PNG/JPG)</Label>
                <Input
                  id="logo"
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  onChange={(e) => setFormData({ ...formData, logo: e.target.files?.[0] || null })}
                  className="mt-2"
                />
                {brandGuide?.logo_url && (
                  <img src={brandGuide.logo_url} alt="Logo" className="mt-4 h-20 w-auto" />
                )}
              </div>
              <div>
                <Label htmlFor="voice_note">Voice Note (MP3/WAV/M4A)</Label>
                <Input
                  id="voice_note"
                  type="file"
                  accept="audio/mp3,audio/wav,audio/m4a"
                  onChange={(e) => setFormData({ ...formData, voice_note: e.target.files?.[0] || null })}
                  className="mt-2"
                />
                {brandGuide?.voice_note_url && (
                  <audio src={brandGuide.voice_note_url} controls className="mt-4 w-full" />
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Brand Description</CardTitle>
              <CardDescription>Describe your brand identity</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe your brand, values, and voice..."
                rows={4}
              />
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Keywords</CardTitle>
              <CardDescription>Comma-separated keywords that represent your brand</CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                value={formData.keywords}
                onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                placeholder="professional, trustworthy, innovative, customer-focused"
              />
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Script Examples</CardTitle>
              <CardDescription>Example scripts that demonstrate your brand voice</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.script_examples}
                onChange={(e) => setFormData({ ...formData, script_examples: e.target.value })}
                placeholder="Example: 'Thank you for calling [Company Name]. How can I assist you today?'"
                rows={6}
              />
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 flex justify-end">
          <Button type="submit" disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Brand Guide'}
          </Button>
        </div>
      </form>
    </div>
  )
}

