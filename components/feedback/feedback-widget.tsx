'use client'

import { useState, useRef, useCallback } from 'react'
import { useScreenshot } from 'use-react-screenshot'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'react-hot-toast'
import { 
  MessageSquare, 
  Bug, 
  Lightbulb, 
  Send, 
  Camera,
  X,
  Loader2,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthUser } from '@/lib/auth-wrapper'
import { useRouter, usePathname } from 'next/navigation'

type FeedbackType = 'bug' | 'feature' | 'general'
type BugSeverity = 'critical' | 'high' | 'medium' | 'low'

interface FeedbackData {
  type: FeedbackType
  title: string
  description: string
  severity?: BugSeverity
  screenshot?: string
  systemInfo?: {
    browser: string
    os: string
    viewport: { width: number; height: number }
    userAgent: string
  }
  appContext?: {
    currentPath: string
    timestamp: string
  }
  userEmail?: string
}

export function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('general')
  const [severity, setSeverity] = useState<BugSeverity>('medium')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [screenshot, setScreenshot] = useState<string | null>(null)
  
  const screenshotRef = useRef<HTMLDivElement>(null)
  const [image, takeScreenshot] = useScreenshot()
  const { user } = useAuthUser()
  const pathname = usePathname()
  const router = useRouter()

  const captureScreenshot = useCallback(() => {
    // Hide the feedback dialog temporarily
    setIsOpen(false)
    
    // Wait a bit for dialog to close, then capture
    setTimeout(() => {
      takeScreenshot(document.body as any).then((img) => {
        setScreenshot(img as string)
        setIsOpen(true)
      })
    }, 300)
  }, [takeScreenshot])

  const getSystemInfo = () => {
    const userAgent = navigator.userAgent
    let browser = 'Unknown'
    let os = 'Unknown'

    // Detect browser
    if (userAgent.indexOf('Firefox') > -1) {
      browser = 'Firefox'
    } else if (userAgent.indexOf('Chrome') > -1) {
      browser = 'Chrome'
    } else if (userAgent.indexOf('Safari') > -1) {
      browser = 'Safari'
    } else if (userAgent.indexOf('Edge') > -1) {
      browser = 'Edge'
    }

    // Detect OS
    if (userAgent.indexOf('Windows') > -1) {
      os = 'Windows'
    } else if (userAgent.indexOf('Mac') > -1) {
      os = 'macOS'
    } else if (userAgent.indexOf('Linux') > -1) {
      os = 'Linux'
    } else if (userAgent.indexOf('Android') > -1) {
      os = 'Android'
    } else if (userAgent.indexOf('iOS') > -1) {
      os = 'iOS'
    }

    return {
      browser,
      os,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      userAgent
    }
  }

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      toast.error('Please provide a title and description')
      return
    }

    setIsSubmitting(true)

    const feedbackData: FeedbackData = {
      type: feedbackType,
      title,
      description,
      severity: feedbackType === 'bug' ? severity : undefined,
      screenshot,
      systemInfo: getSystemInfo(),
      appContext: {
        currentPath: pathname,
        timestamp: new Date().toISOString()
      },
      userEmail: userEmail || user?.email || undefined
    }

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedbackData)
      })

      if (!response.ok) throw new Error('Failed to submit feedback')

      toast.success('Thank you for your feedback! We\'ll review it soon.')
      
      // Reset form
      setTitle('')
      setDescription('')
      setUserEmail('')
      setScreenshot(null)
      setFeedbackType('general')
      setSeverity('medium')
      setIsOpen(false)
    } catch (error) {
      console.error('Error submitting feedback:', error)
      toast.error('Failed to submit feedback. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getFeedbackIcon = () => {
    switch (feedbackType) {
      case 'bug':
        return <Bug className="h-4 w-4" />
      case 'feature':
        return <Lightbulb className="h-4 w-4" />
      default:
        return <MessageSquare className="h-4 w-4" />
    }
  }

  const getSeverityColor = (sev: BugSeverity) => {
    switch (sev) {
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'high':
        return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'low':
        return 'text-blue-600 bg-blue-50 border-blue-200'
    }
  }

  return (
    <>
      {/* Floating Feedback Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 z-40",
          "bg-gradient-to-r from-blue-600 to-purple-600",
          "text-white rounded-full p-4",
          "shadow-lg hover:shadow-xl",
          "transition-all duration-300",
          "hover:scale-110",
          "group"
        )}
        aria-label="Send feedback"
      >
        <MessageSquare className="h-5 w-5" />
        <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Send Feedback
        </span>
      </button>

      {/* Feedback Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {getFeedbackIcon()}
              Send Feedback
            </DialogTitle>
            <DialogDescription>
              Help us improve TradeVolt by sharing your feedback, reporting bugs, or suggesting features.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Feedback Type Selector */}
            <div className="space-y-2">
              <Label>Feedback Type</Label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setFeedbackType('bug')}
                  className={cn(
                    "flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all",
                    feedbackType === 'bug' 
                      ? "border-red-500 bg-red-50 text-red-700" 
                      : "border-gray-200 hover:border-gray-300"
                  )}
                >
                  <Bug className="h-4 w-4" />
                  <span className="font-medium">Bug Report</span>
                </button>
                <button
                  onClick={() => setFeedbackType('feature')}
                  className={cn(
                    "flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all",
                    feedbackType === 'feature' 
                      ? "border-blue-500 bg-blue-50 text-blue-700" 
                      : "border-gray-200 hover:border-gray-300"
                  )}
                >
                  <Lightbulb className="h-4 w-4" />
                  <span className="font-medium">Feature Request</span>
                </button>
                <button
                  onClick={() => setFeedbackType('general')}
                  className={cn(
                    "flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all",
                    feedbackType === 'general' 
                      ? "border-green-500 bg-green-50 text-green-700" 
                      : "border-gray-200 hover:border-gray-300"
                  )}
                >
                  <MessageSquare className="h-4 w-4" />
                  <span className="font-medium">General Feedback</span>
                </button>
              </div>
            </div>

            {/* Bug Severity (only for bugs) */}
            {feedbackType === 'bug' && (
              <div className="space-y-2">
                <Label>Severity</Label>
                <Select value={severity} onValueChange={(v) => setSeverity(v as BugSeverity)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">
                      <div className="flex items-center gap-2">
                        <div className={cn("px-2 py-1 rounded text-xs font-medium", getSeverityColor('critical'))}>
                          Critical
                        </div>
                        <span className="text-sm text-gray-500">- App is unusable</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="high">
                      <div className="flex items-center gap-2">
                        <div className={cn("px-2 py-1 rounded text-xs font-medium", getSeverityColor('high'))}>
                          High
                        </div>
                        <span className="text-sm text-gray-500">- Major feature broken</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="medium">
                      <div className="flex items-center gap-2">
                        <div className={cn("px-2 py-1 rounded text-xs font-medium", getSeverityColor('medium'))}>
                          Medium
                        </div>
                        <span className="text-sm text-gray-500">- Minor feature issue</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="low">
                      <div className="flex items-center gap-2">
                        <div className={cn("px-2 py-1 rounded text-xs font-medium", getSeverityColor('low'))}>
                          Low
                        </div>
                        <span className="text-sm text-gray-500">- Cosmetic issue</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder={
                  feedbackType === 'bug' 
                    ? "Brief description of the issue"
                    : feedbackType === 'feature'
                    ? "What feature would you like to see?"
                    : "What's on your mind?"
                }
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder={
                  feedbackType === 'bug'
                    ? "Please describe the issue in detail. What were you trying to do? What happened instead?"
                    : feedbackType === 'feature'
                    ? "Describe the feature and how it would help your trading workflow"
                    : "Share your thoughts, suggestions, or concerns"
                }
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
              />
            </div>

            {/* Email (optional) */}
            {!user?.email && (
              <div className="space-y-2">
                <Label htmlFor="email">Email (optional)</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  Provide your email if you'd like us to follow up on your feedback
                </p>
              </div>
            )}

            {/* Screenshot Section */}
            <div className="space-y-2">
              <Label>Screenshot (optional)</Label>
              {screenshot ? (
                <div className="relative">
                  <img 
                    src={screenshot} 
                    alt="Screenshot" 
                    className="w-full rounded-lg border"
                  />
                  <button
                    onClick={() => setScreenshot(null)}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={captureScreenshot}
                  className="w-full"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Capture Screenshot
                </Button>
              )}
              <p className="text-xs text-gray-500">
                {feedbackType === 'bug' 
                  ? "A screenshot helps us understand the issue better"
                  : "Include a screenshot to illustrate your feedback"
                }
              </p>
            </div>

            {/* System Info Notice */}
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-gray-500 mt-0.5" />
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  We'll automatically include your browser, OS, and current page information to help us better understand your feedback.
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !title.trim() || !description.trim()}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Submit Feedback
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}