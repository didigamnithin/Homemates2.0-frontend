'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { apiClient } from '@/lib/api/client'
import { Upload, Plus, FileText } from 'lucide-react'

export default function PropertiesOwnerPage() {
  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showManualForm, setShowManualForm] = useState(false)
  const [formData, setFormData] = useState({
    property_code: '',
    title: '',
    address: '',
    city: 'Hyderabad',
    locality: '',
    rent: '',
    available_from: '',
    bedrooms: '',
    bathrooms: '',
    area_sqft: '',
    amenities: '',
    furnishing: '',
    description: '',
    photos: ''
  })

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await apiClient.post('/properties/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      alert(`Successfully uploaded ${response.data.total} properties!`)
      // Redirect to properties view
      window.location.href = '/dashboard/properties'
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to upload CSV file')
    } finally {
      setIsUploading(false)
    }
  }

  const handleImportDatabase = async () => {
    setIsUploading(true)
    try {
      const response = await apiClient.post('/properties/import-database')
      alert(`Successfully imported ${response.data.total} properties from database/flats.csv!`)
      // Redirect to properties view
      window.location.href = '/dashboard/properties'
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to import from database/flats.csv')
    } finally {
      setIsUploading(false)
    }
  }

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await apiClient.post('/properties', {
        ...formData,
        status: 'available',
        owner_phone: '7095288950'
      })

      alert('Property added successfully!')
      setFormData({
        property_code: '',
        title: '',
        address: '',
        city: 'Hyderabad',
        locality: '',
        rent: '',
        available_from: '',
        bedrooms: '',
        bathrooms: '',
        area_sqft: '',
        amenities: '',
        furnishing: '',
        description: '',
        photos: ''
      })
      setShowManualForm(false)
      // Redirect to properties view
      window.location.href = '/dashboard/properties'
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to add property')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Add Properties</h1>
        <p className="text-muted-foreground mt-2">Upload CSV file or add property manually</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CSV Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload CSV File
            </CardTitle>
            <CardDescription>
              Upload your flats.csv file. It will be appended to the master database.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="csv-upload">Select CSV File</Label>
                <Input
                  id="csv-upload"
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  CSV format: Name, Mobile, Locality, Budget, BHKtype, Amenities, SFT
                </p>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm font-medium mb-2">Or import from database:</p>
                <Button
                  onClick={handleImportDatabase}
                  disabled={isUploading}
                  variant="outline"
                  className="w-full"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Import from database/flats.csv
                </Button>
              </div>
              {isUploading && (
                <div className="text-sm text-muted-foreground">
                  Processing...
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Manual Entry */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add Property Manually
            </CardTitle>
            <CardDescription>
              Enter property details manually
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!showManualForm ? (
              <Button
                onClick={() => setShowManualForm(true)}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New Property
              </Button>
            ) : (
              <form onSubmit={handleManualSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="property_code">Property Code *</Label>
                    <Input
                      id="property_code"
                      required
                      value={formData.property_code}
                      onChange={(e) => setFormData({ ...formData, property_code: e.target.value })}
                      placeholder="e.g., PROP001"
                    />
                  </div>
                  <div>
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g., Sunrise Apartments"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Full address"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      required
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="locality">Locality *</Label>
                    <Input
                      id="locality"
                      required
                      value={formData.locality}
                      onChange={(e) => setFormData({ ...formData, locality: e.target.value })}
                      placeholder="e.g., Madhapur"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="rent">Rent (₹) *</Label>
                    <Input
                      id="rent"
                      type="number"
                      required
                      value={formData.rent}
                      onChange={(e) => setFormData({ ...formData, rent: e.target.value })}
                      placeholder="25000"
                    />
                  </div>
                  <div>
                    <Label htmlFor="bedrooms">BHK *</Label>
                    <Select
                      id="bedrooms"
                      required
                      value={formData.bedrooms}
                      onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
                    >
                      <option value="">Select</option>
                      <option value="1">1 BHK</option>
                      <option value="2">2 BHK</option>
                      <option value="3">3 BHK</option>
                      <option value="4">4 BHK</option>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="area_sqft">Area (sqft) *</Label>
                    <Input
                      id="area_sqft"
                      type="number"
                      required
                      value={formData.area_sqft}
                      onChange={(e) => setFormData({ ...formData, area_sqft: e.target.value })}
                      placeholder="1200"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="amenities">Amenities</Label>
                  <Input
                    id="amenities"
                    value={formData.amenities}
                    onChange={(e) => setFormData({ ...formData, amenities: e.target.value })}
                    placeholder="Parking, Lift, Security, Gym (separate with commas)"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="furnishing">Furnishing</Label>
                    <Select
                      id="furnishing"
                      value={formData.furnishing}
                      onChange={(e) => setFormData({ ...formData, furnishing: e.target.value })}
                    >
                      <option value="">Select</option>
                      <option value="Furnished">Furnished</option>
                      <option value="Semi-Furnished">Semi-Furnished</option>
                      <option value="Unfurnished">Unfurnished</option>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="available_from">Available From</Label>
                    <Input
                      id="available_from"
                      type="date"
                      value={formData.available_from}
                      onChange={(e) => setFormData({ ...formData, available_from: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    placeholder="Property description..."
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1"
                  >
                    {isSubmitting ? 'Adding...' : 'Add Property'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowManualForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

