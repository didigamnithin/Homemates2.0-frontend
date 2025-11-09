'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { apiClient } from '@/lib/api/client'
import { Mail, Calendar, CheckCircle2, XCircle, Link2 } from 'lucide-react'

interface Integration {
  id: string
  tool_type: string
  status: string
  last_sync?: string
  created_at: string
}

export default function ToolsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchIntegrations()
  }, [])

  const fetchIntegrations = async () => {
    try {
      const response = await apiClient.get('/tools')
      setIntegrations(response.data.integrations || [])
    } catch (error) {
      console.error('Failed to fetch integrations:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleConnect = async (toolType: 'gmail' | 'calendar') => {
    try {
      localStorage.setItem('oauth_tool_type', toolType)
      const response = await apiClient.get(`/tools/oauth/google?tool_type=${toolType}`)
      window.location.href = response.data.auth_url
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to get OAuth URL')
    }
  }

  const handleDisconnect = async (toolType: string) => {
    if (!confirm(`Are you sure you want to disconnect ${toolType}?`)) return
    try {
      await apiClient.delete(`/tools/${toolType}`)
      fetchIntegrations()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to disconnect')
    }
  }

  const getIntegration = (toolType: string) => {
    return integrations.find((i) => i.tool_type === toolType)
  }

  const isConnected = (toolType: string) => {
    const integration = getIntegration(toolType)
    return integration?.status === 'connected'
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
        <h1 className="text-3xl font-bold">Tools</h1>
        <p className="text-muted-foreground mt-2">Connect productivity tools to enhance your agents</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="h-8 w-8 text-primary" />
                <div>
                  <CardTitle>Gmail</CardTitle>
                  <CardDescription>Read and send emails</CardDescription>
                </div>
              </div>
              {isConnected('gmail') ? (
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              ) : (
                <XCircle className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isConnected('gmail') ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Status: <span className="text-green-600 font-medium">Connected</span>
                </p>
                {getIntegration('gmail')?.last_sync && (
                  <p className="text-sm text-muted-foreground">
                    Last sync: {new Date(getIntegration('gmail')!.last_sync!).toLocaleString()}
                  </p>
                )}
                <Button
                  variant="destructive"
                  onClick={() => handleDisconnect('gmail')}
                  className="w-full mt-4"
                >
                  Disconnect
                </Button>
              </div>
            ) : (
              <Button onClick={() => handleConnect('gmail')} className="w-full">
                <Link2 className="h-4 w-4 mr-2" />
                Connect Gmail
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Calendar className="h-8 w-8 text-primary" />
                <div>
                  <CardTitle>Google Calendar</CardTitle>
                  <CardDescription>View and create events</CardDescription>
                </div>
              </div>
              {isConnected('calendar') ? (
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              ) : (
                <XCircle className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isConnected('calendar') ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Status: <span className="text-green-600 font-medium">Connected</span>
                </p>
                {getIntegration('calendar')?.last_sync && (
                  <p className="text-sm text-muted-foreground">
                    Last sync: {new Date(getIntegration('calendar')!.last_sync!).toLocaleString()}
                  </p>
                )}
                <Button
                  variant="destructive"
                  onClick={() => handleDisconnect('calendar')}
                  className="w-full mt-4"
                >
                  Disconnect
                </Button>
              </div>
            ) : (
              <Button onClick={() => handleConnect('calendar')} className="w-full">
                <Link2 className="h-4 w-4 mr-2" />
                Connect Calendar
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

