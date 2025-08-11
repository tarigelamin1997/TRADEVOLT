'use client'

import { useState, useEffect } from 'react'
import { SidebarLayout } from '@/components/sidebar-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from 'react-hot-toast'
import { 
  MessageSquare,
  Bug,
  Lightbulb,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  User,
  Calendar,
  Filter,
  Eye,
  MessageCircle,
  TrendingUp,
  Loader2,
  ExternalLink,
  Globe,
  Monitor,
  Smartphone
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'

interface FeedbackItem {
  id: string
  type: 'bug' | 'feature' | 'general'
  title: string
  description: string
  severity?: string
  status: string
  priority: number
  screenshotUrl?: string
  systemInfo?: any
  appContext?: any
  userId?: string
  userEmail?: string
  createdAt: string
  updatedAt: string
  resolution?: string
  internalNotes?: string
  assignedTo?: string
  githubIssueUrl?: string
}

export default function FeedbackAdminPage() {
  const [feedback, setFeedback] = useState<FeedbackItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [filterType, setFilterType] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterSeverity, setFilterSeverity] = useState<string>('all')
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)

  useEffect(() => {
    fetchFeedback()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterType, filterStatus, filterSeverity])

  const fetchFeedback = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filterType !== 'all') params.append('type', filterType)
      if (filterStatus !== 'all') params.append('status', filterStatus)
      if (filterSeverity !== 'all') params.append('severity', filterSeverity)

      const response = await fetch(`/api/feedback?${params.toString()}`)
      
      if (!response.ok) {
        // Don't show error for empty feedback, just set empty array
        console.log('No feedback available or error fetching')
        setFeedback([])
        return
      }

      const data = await response.json()
      setFeedback(data.feedback || [])
    } catch (error) {
      console.error('Error fetching feedback:', error)
      // Only show error toast for actual errors, not empty feedback
      setFeedback([])
    } finally {
      setLoading(false)
    }
  }

  const updateFeedbackStatus = async (feedbackId: string, newStatus: string) => {
    try {
      setUpdatingStatus(feedbackId)
      const response = await fetch('/api/feedback', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feedbackId,
          status: newStatus
        })
      })

      if (!response.ok) throw new Error('Failed to update status')

      toast.success('Status updated successfully')
      fetchFeedback() // Refresh the list
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Failed to update status')
    } finally {
      setUpdatingStatus(null)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'bug': return <Bug className="h-4 w-4" />
      case 'feature': return <Lightbulb className="h-4 w-4" />
      default: return <MessageSquare className="h-4 w-4" />
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new': return <AlertCircle className="h-4 w-4" />
      case 'triaged': return <Clock className="h-4 w-4" />
      case 'in_progress': return <Loader2 className="h-4 w-4 animate-spin" />
      case 'resolved': return <CheckCircle className="h-4 w-4" />
      case 'closed': return <XCircle className="h-4 w-4" />
      default: return <MessageCircle className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'triaged': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'in_progress': return 'bg-purple-100 text-purple-700 border-purple-200'
      case 'resolved': return 'bg-green-100 text-green-700 border-green-200'
      case 'closed': return 'bg-gray-100 text-gray-700 border-gray-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-700 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-200'
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'low': return 'bg-blue-100 text-blue-700 border-blue-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getDeviceIcon = (systemInfo: any) => {
    if (!systemInfo) return <Monitor className="h-4 w-4" />
    const userAgent = systemInfo.userAgent || ''
    if (userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iPhone')) {
      return <Smartphone className="h-4 w-4" />
    }
    return <Monitor className="h-4 w-4" />
  }

  // Group feedback by type for stats
  const stats = {
    total: feedback.length,
    bugs: feedback.filter(f => f.type === 'bug').length,
    features: feedback.filter(f => f.type === 'feature').length,
    general: feedback.filter(f => f.type === 'general').length,
    new: feedback.filter(f => f.status === 'new').length,
    inProgress: feedback.filter(f => f.status === 'in_progress').length,
    resolved: feedback.filter(f => f.status === 'resolved').length
  }

  if (loading) {
    return (
      <SidebarLayout currentPath="/admin/feedback">
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </SidebarLayout>
    )
  }

  return (
    <SidebarLayout currentPath="/admin/feedback">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Feedback Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            View and manage user feedback, bug reports, and feature requests
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Feedback</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-gray-500 mt-1">All submissions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Bug className="h-4 w-4 text-red-500" />
                Bug Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.bugs}</div>
              <p className="text-xs text-gray-500 mt-1">
                {stats.new} new, {stats.inProgress} in progress
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-blue-500" />
                Feature Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.features}</div>
              <p className="text-xs text-gray-500 mt-1">User suggestions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Resolved
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.resolved}</div>
              <p className="text-xs text-gray-500 mt-1">Completed items</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <Label>Type</Label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="bug">Bugs</SelectItem>
                    <SelectItem value="feature">Features</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 min-w-[200px]">
                <Label>Status</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="triaged">Triaged</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 min-w-[200px]">
                <Label>Severity</Label>
                <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severities</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Feedback List */}
        <Card>
          <CardHeader>
            <CardTitle>Feedback Items</CardTitle>
            <CardDescription>
              Click on any item to view details and update status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {feedback.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  No feedback yet
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Feedback submitted by users will appear here
                </p>
                <p className="text-sm text-gray-400">
                  Try submitting feedback using the button in the bottom-right corner
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {feedback.map((item) => (
                  <div
                    key={item.id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => {
                      setSelectedFeedback(item)
                      setShowDetails(true)
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getTypeIcon(item.type)}
                          <h3 className="font-semibold">{item.title}</h3>
                          {item.severity && (
                            <Badge className={cn("text-xs", getSeverityColor(item.severity))}>
                              {item.severity}
                            </Badge>
                          )}
                          <Badge className={cn("text-xs", getStatusColor(item.status))}>
                            {getStatusIcon(item.status)}
                            <span className="ml-1">{item.status.replace('_', ' ')}</span>
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {item.description}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {item.userEmail || item.userId || 'Anonymous'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                          </span>
                          {item.systemInfo && (
                            <span className="flex items-center gap-1">
                              {getDeviceIcon(item.systemInfo)}
                              {item.systemInfo.browser} on {item.systemInfo.os}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedFeedback(item)
                          setShowDetails(true)
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Detail Modal */}
        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            {selectedFeedback && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    {getTypeIcon(selectedFeedback.type)}
                    {selectedFeedback.title}
                  </DialogTitle>
                  <DialogDescription>
                    Submitted {formatDistanceToNow(new Date(selectedFeedback.createdAt), { addSuffix: true })}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 mt-4">
                  {/* Status and Actions */}
                  <div className="flex items-center gap-2">
                    <Label>Status:</Label>
                    <Select 
                      value={selectedFeedback.status} 
                      onValueChange={(value) => updateFeedbackStatus(selectedFeedback.id, value)}
                      disabled={updatingStatus === selectedFeedback.id}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="triaged">Triaged</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                    {updatingStatus === selectedFeedback.id && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                  </div>

                  {/* Description */}
                  <div>
                    <Label>Description</Label>
                    <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      {selectedFeedback.description}
                    </div>
                  </div>

                  {/* Screenshot */}
                  {selectedFeedback.screenshotUrl && (
                    <div>
                      <Label>Screenshot</Label>
                      <div className="mt-2">
                        <img 
                          src={selectedFeedback.screenshotUrl} 
                          alt="User screenshot" 
                          className="w-full rounded-lg border"
                        />
                      </div>
                    </div>
                  )}

                  {/* User Info */}
                  <div>
                    <Label>User Information</Label>
                    <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm space-y-1">
                      <p><strong>Email:</strong> {selectedFeedback.userEmail || 'Not provided'}</p>
                      <p><strong>User ID:</strong> {selectedFeedback.userId || 'Anonymous'}</p>
                    </div>
                  </div>

                  {/* System Info */}
                  {selectedFeedback.systemInfo && (
                    <div>
                      <Label>System Information</Label>
                      <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm space-y-1">
                        <p><strong>Browser:</strong> {selectedFeedback.systemInfo.browser}</p>
                        <p><strong>OS:</strong> {selectedFeedback.systemInfo.os}</p>
                        <p><strong>Viewport:</strong> {selectedFeedback.systemInfo.viewport?.width} x {selectedFeedback.systemInfo.viewport?.height}</p>
                      </div>
                    </div>
                  )}

                  {/* App Context */}
                  {selectedFeedback.appContext && (
                    <div>
                      <Label>App Context</Label>
                      <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm space-y-1">
                        <p><strong>Page:</strong> {selectedFeedback.appContext.currentPath}</p>
                        <p><strong>Time:</strong> {new Date(selectedFeedback.appContext.timestamp).toLocaleString()}</p>
                      </div>
                    </div>
                  )}

                  {/* Priority Score */}
                  <div>
                    <Label>Priority Score</Label>
                    <div className="mt-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                            style={{ width: `${selectedFeedback.priority}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{selectedFeedback.priority}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </SidebarLayout>
  )
}