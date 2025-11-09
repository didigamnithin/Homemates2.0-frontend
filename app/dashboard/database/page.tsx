'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { apiClient } from '@/lib/api/client'
import { Upload, Trash2, Database, FileSpreadsheet, Download, Search } from 'lucide-react'

interface Dataset {
  id: string
  file_name: string
  file_url: string
  data_type: string
  row_count: number
  agent_id?: string
  uploaded_at: string
}

export default function DatabasePage() {
  const [datasets, setDatasets] = useState<Dataset[]>([])
  const [agents, setAgents] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [isIngestOpen, setIsIngestOpen] = useState(false)
  const [isIngesting, setIsIngesting] = useState(false)
  const [ingestResults, setIngestResults] = useState<any>(null)
  const [ingestCity, setIngestCity] = useState('Hyderabad')
  const [uploadData, setUploadData] = useState({
    file: null as File | null,
    data_type: 'leads',
    agent_id: ''
  })

  useEffect(() => {
    fetchDatasets()
    fetchAgents()
  }, [])

  const fetchDatasets = async () => {
    try {
      const response = await apiClient.get('/database')
      setDatasets(response.data.datasets || [])
    } catch (error) {
      console.error('Failed to fetch datasets:', error)
    } finally {
      setIsLoading(false)
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

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!uploadData.file) {
      alert('Please select a file')
      return
    }

    try {
      const formData = new FormData()
      formData.append('file', uploadData.file)
      formData.append('data_type', uploadData.data_type)
      if (uploadData.agent_id) {
        formData.append('agent_id', uploadData.agent_id)
      }

      const response = await apiClient.post('/database/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      setIsUploadOpen(false)
      setUploadData({ file: null, data_type: 'leads', agent_id: '' })
      fetchDatasets()
      alert(`File uploaded successfully! ${response.data.data_health?.total_rows || 0} rows processed.`)
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to upload file')
    }
  }

  const handleDelete = async (datasetId: string) => {
    if (!confirm('Are you sure you want to delete this dataset?')) return
    try {
      await apiClient.delete(`/database/${datasetId}`)
      fetchDatasets()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete dataset')
    }
  }

  const handleIngest = async () => {
    setIsIngesting(true)
    setIngestResults(null)
    try {
      const response = await apiClient.post('/database/ingest', {
        city: ingestCity || 'Hyderabad'
      })
      
      setIngestResults(response.data)
      fetchDatasets() // Refresh datasets list
      alert(`Successfully ingested ${response.data.total_listings || 0} listings!`)
    } catch (error: any) {
      console.error('Failed to ingest listings:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Failed to ingest listings'
      alert(`Failed to ingest listings: ${errorMessage}\n\nPlease check:\n1. Your Perplexity API key is set in backend/.env\n2. Your backend is running\n3. You have internet connection`)
    } finally {
      setIsIngesting(false)
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
          <h1 className="text-3xl font-bold">Database</h1>
          <p className="text-muted-foreground mt-2">Manage customer data and leads</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsIngestOpen(true)}>
            <Search className="h-4 w-4 mr-2" />
            Ingest
          </Button>
          <Button onClick={() => setIsUploadOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Upload Dataset
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {datasets.map((dataset) => (
          <Card key={dataset.id}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">{dataset.file_name}</CardTitle>
              </div>
              <CardDescription>{dataset.data_type}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Rows:</span>
                  <span className="font-medium">{dataset.row_count.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Uploaded:</span>
                  <span className="font-medium">
                    {new Date(dataset.uploaded_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDelete(dataset.id)}
                className="w-full"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {datasets.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No datasets yet. Upload your first CSV or Excel file to get started.</p>
          </CardContent>
        </Card>
      )}

      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Dataset</DialogTitle>
            <DialogDescription>
              Upload CSV or Excel file with customer data, leads, or FAQs
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpload}>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="file">File (CSV or Excel)</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={(e) => setUploadData({ ...uploadData, file: e.target.files?.[0] || null })}
                  required
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="data_type">Data Type</Label>
                <Select
                  id="data_type"
                  value={uploadData.data_type}
                  onChange={(e) => setUploadData({ ...uploadData, data_type: e.target.value })}
                  required
                >
                  <option value="leads">Leads</option>
                  <option value="customers">Customers</option>
                  <option value="faqs">FAQs</option>
                  <option value="other">Other</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="agent_id">Assign to Agent (Optional)</Label>
                <Select
                  id="agent_id"
                  value={uploadData.agent_id}
                  onChange={(e) => setUploadData({ ...uploadData, agent_id: e.target.value })}
                >
                  <option value="">None</option>
                  {agents.map((agent) => (
                    <option key={agent.agent_id} value={agent.agent_id}>
                      {agent.custom_name || agent.name}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsUploadOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Upload</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isIngestOpen} onOpenChange={setIsIngestOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ingest Listings from Perplexity</DialogTitle>
            <DialogDescription>
              Search and extract real estate listings from multiple sources
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                type="text"
                value={ingestCity}
                onChange={(e) => setIngestCity(e.target.value)}
                placeholder="Hyderabad"
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Enter the city name to search for listings (e.g., Hyderabad, Mumbai, Bangalore)
              </p>
            </div>
            
            <Button
              onClick={handleIngest}
              disabled={isIngesting}
              className="w-full"
            >
              {isIngesting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Ingesting...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Start Ingest
                </>
              )}
            </Button>

            {ingestResults && (
              <div className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Ingestion Results</CardTitle>
                    <CardDescription>
                      Found {ingestResults.total_results || 0} search results and extracted {ingestResults.total_listings || 0} structured listings
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total Results:</span>
                        <span className="font-medium">{ingestResults.total_results || 0}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Structured Listings:</span>
                        <span className="font-medium">{ingestResults.total_listings || 0}</span>
                      </div>
                      {ingestResults.dataset && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Dataset Created:</span>
                          <span className="font-medium">{ingestResults.dataset.file_name}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {ingestResults.listings && ingestResults.listings.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Extracted Listings</CardTitle>
                      <CardDescription>
                        Preview of structured listing data
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4 max-h-96 overflow-y-auto">
                        {ingestResults.listings.slice(0, 10).map((listing: any, index: number) => (
                          <div key={index} className="border rounded-lg p-4 space-y-2">
                            {listing.title && (
                              <div className="font-semibold">{listing.title}</div>
                            )}
                            {listing.project_name && (
                              <div className="text-sm">
                                <span className="text-muted-foreground">Project: </span>
                                <span>{listing.project_name}</span>
                              </div>
                            )}
                            {listing.price && (
                              <div className="text-sm">
                                <span className="text-muted-foreground">Price: </span>
                                <span>{listing.price}</span>
                              </div>
                            )}
                            {listing.area_sqft && (
                              <div className="text-sm">
                                <span className="text-muted-foreground">Area: </span>
                                <span>{listing.area_sqft} sqft</span>
                              </div>
                            )}
                            {listing.location && (
                              <div className="text-sm">
                                <span className="text-muted-foreground">Location: </span>
                                <span>{listing.location}</span>
                              </div>
                            )}
                            {listing.bhk_configuration && (
                              <div className="text-sm">
                                <span className="text-muted-foreground">BHK: </span>
                                <span>{listing.bhk_configuration}</span>
                              </div>
                            )}
                            {listing.source_url && (
                              <div className="text-sm">
                                <a href={listing.source_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                  View Source
                                </a>
                              </div>
                            )}
                          </div>
                        ))}
                        {ingestResults.listings.length > 10 && (
                          <p className="text-sm text-muted-foreground text-center">
                            Showing first 10 of {ingestResults.listings.length} listings
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {ingestResults.results && ingestResults.results.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Search Results</CardTitle>
                      <CardDescription>
                        Raw search results from Perplexity
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {ingestResults.results.slice(0, 10).map((result: any, index: number) => (
                          <div key={index} className="border rounded-lg p-3 space-y-1">
                            {result.title && (
                              <div className="font-medium text-sm">{result.title}</div>
                            )}
                            {result.url && (
                              <div className="text-xs">
                                <a href={result.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                  {result.url}
                                </a>
                              </div>
                            )}
                            {result.snippet && (
                              <div className="text-xs text-muted-foreground line-clamp-2">
                                {result.snippet}
                              </div>
                            )}
                          </div>
                        ))}
                        {ingestResults.results.length > 10 && (
                          <p className="text-sm text-muted-foreground text-center">
                            Showing first 10 of {ingestResults.results.length} results
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => {
              setIsIngestOpen(false)
              setIngestResults(null)
            }}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

