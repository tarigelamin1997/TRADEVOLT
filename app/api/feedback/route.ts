import { NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Helper to check if we're using the database
const isDatabaseConfigured = !!process.env.DATABASE_URL

// In-memory storage for demo/fallback mode
let inMemoryFeedback: any[] = []

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      type,
      title,
      description,
      severity,
      screenshot,
      systemInfo,
      appContext,
      userEmail
    } = body

    // Get current user if authenticated
    let userId = null
    try {
      const user = await currentUser()
      userId = user?.id || null
    } catch (error) {
      // User not authenticated, that's okay
    }

    // Calculate initial priority based on type and severity
    let priority = 0
    if (type === 'bug') {
      switch (severity) {
        case 'critical': priority = 100; break
        case 'high': priority = 75; break
        case 'medium': priority = 50; break
        case 'low': priority = 25; break
      }
    } else if (type === 'feature') {
      priority = 30
    } else {
      priority = 10
    }

    const feedbackData = {
      userId,
      userEmail: userEmail || null,
      type,
      title,
      description,
      severity: type === 'bug' ? severity : null,
      screenshotUrl: screenshot || null,
      systemInfo: systemInfo || null,
      appContext: appContext || null,
      status: 'new',
      priority,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    let savedFeedback
    
    if (isDatabaseConfigured) {
      try {
        // Save to database
        savedFeedback = await prisma.feedback.create({
          data: feedbackData
        })
      } catch (dbError) {
        console.error('Database error, falling back to in-memory:', dbError)
        // Fallback to in-memory
        savedFeedback = {
          ...feedbackData,
          id: `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        }
        inMemoryFeedback.push(savedFeedback)
      }
    } else {
      // Use in-memory storage for demo mode
      savedFeedback = {
        ...feedbackData,
        id: `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }
      inMemoryFeedback.push(savedFeedback)
    }

    // Log feedback for monitoring (in production, this could be sent to a logging service)
    console.log('New feedback received:', {
      id: savedFeedback.id,
      type,
      severity,
      title,
      userId,
      userEmail
    })

    return NextResponse.json({ 
      success: true, 
      feedbackId: savedFeedback.id,
      message: 'Thank you for your feedback! We will review it soon.'
    })
  } catch (error) {
    console.error('Error saving feedback:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to submit feedback' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    // For demo mode or development, allow access without authentication
    let userId = 'demo-user'
    try {
      const user = await currentUser()
      if (user) {
        userId = user.id
      }
    } catch (error) {
      // Continue with demo user
      console.log('No authenticated user, using demo mode')
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const status = searchParams.get('status')
    const severity = searchParams.get('severity')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let feedback

    if (isDatabaseConfigured) {
      try {
        // Build filter conditions
        const where: any = {}
        if (type) where.type = type
        if (status) where.status = status
        if (severity) where.severity = severity

        // Fetch from database
        feedback = await prisma.feedback.findMany({
          where,
          orderBy: [
            { priority: 'desc' },
            { createdAt: 'desc' }
          ],
          skip: offset,
          take: limit,
          include: {
            votes: true
          }
        })

        // Get total count for pagination
        const total = await prisma.feedback.count({ where })

        return NextResponse.json({
          feedback,
          total,
          limit,
          offset
        })
      } catch (dbError) {
        console.error('Database error:', dbError)
        // Fallback to in-memory
        feedback = inMemoryFeedback
      }
    } else {
      // Use in-memory storage
      feedback = inMemoryFeedback
    }

    // Apply filters to in-memory data
    let filtered = [...feedback]
    if (type) filtered = filtered.filter(f => f.type === type)
    if (status) filtered = filtered.filter(f => f.status === status)
    if (severity) filtered = filtered.filter(f => f.severity === severity)

    // Sort by priority and date
    filtered.sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    // Apply pagination
    const paginated = filtered.slice(offset, offset + limit)

    return NextResponse.json({
      feedback: paginated,
      total: filtered.length,
      limit,
      offset
    })
  } catch (error) {
    console.error('Error fetching feedback:', error)
    return NextResponse.json(
      { error: 'Failed to fetch feedback' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    // Check if user is authenticated
    const user = await currentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { feedbackId, status, internalNotes, assignedTo, resolution } = body

    if (!feedbackId) {
      return NextResponse.json(
        { error: 'Feedback ID is required' },
        { status: 400 }
      )
    }

    const updateData: any = {
      updatedAt: new Date()
    }

    if (status) updateData.status = status
    if (internalNotes !== undefined) updateData.internalNotes = internalNotes
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo
    
    if (resolution !== undefined) {
      updateData.resolution = resolution
      updateData.resolvedAt = new Date()
      updateData.resolvedBy = user.id
    }

    let updatedFeedback

    if (isDatabaseConfigured) {
      try {
        updatedFeedback = await prisma.feedback.update({
          where: { id: feedbackId },
          data: updateData
        })
      } catch (dbError) {
        console.error('Database error:', dbError)
        // Fallback to in-memory
        const index = inMemoryFeedback.findIndex(f => f.id === feedbackId)
        if (index !== -1) {
          inMemoryFeedback[index] = { ...inMemoryFeedback[index], ...updateData }
          updatedFeedback = inMemoryFeedback[index]
        }
      }
    } else {
      // Update in-memory storage
      const index = inMemoryFeedback.findIndex(f => f.id === feedbackId)
      if (index !== -1) {
        inMemoryFeedback[index] = { ...inMemoryFeedback[index], ...updateData }
        updatedFeedback = inMemoryFeedback[index]
      }
    }

    if (!updatedFeedback) {
      return NextResponse.json(
        { error: 'Feedback not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      feedback: updatedFeedback
    })
  } catch (error) {
    console.error('Error updating feedback:', error)
    return NextResponse.json(
      { error: 'Failed to update feedback' },
      { status: 500 }
    )
  }
}