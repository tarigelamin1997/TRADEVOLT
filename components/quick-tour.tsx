'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { X, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TourStep {
  target: string // CSS selector for the target element
  title: string
  description: string
  position: 'top' | 'bottom' | 'left' | 'right'
}

const TOUR_STEPS: TourStep[] = [
  {
    target: '[data-tour="add-trade"]',
    title: 'Add Your First Trade',
    description: 'Click here to manually add a trade or import from CSV',
    position: 'bottom'
  },
  {
    target: '[data-tour="stats"]',
    title: 'Your Performance Stats',
    description: 'See your key metrics at a glance',
    position: 'bottom'
  },
  {
    target: '[data-tour="analytics"]',
    title: 'Detailed Analytics',
    description: 'Dive deep into your trading performance with advanced charts',
    position: 'top'
  }
]

export function QuickTour() {
  const [isActive, setIsActive] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [position, setPosition] = useState({ top: 0, left: 0 })

  useEffect(() => {
    // Check if user has seen the tour
    const hasSeenTour = localStorage.getItem('tour_completed')
    const hasCompletedOnboarding = localStorage.getItem('onboarding_completed')
    
    // Show tour after onboarding is completed and tour hasn't been seen
    if (hasCompletedOnboarding && !hasSeenTour) {
      setTimeout(() => setIsActive(true), 1000)
    }
  }, [])

  useEffect(() => {
    if (isActive && TOUR_STEPS[currentStep]) {
      const step = TOUR_STEPS[currentStep]
      const element = document.querySelector(step.target)
      
      if (element) {
        const rect = element.getBoundingClientRect()
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft

        let top = rect.top + scrollTop
        let left = rect.left + scrollLeft

        // Adjust position based on direction
        switch (step.position) {
          case 'bottom':
            top += rect.height + 10
            left += rect.width / 2
            break
          case 'top':
            top -= 100
            left += rect.width / 2
            break
          case 'left':
            left -= 250
            top += rect.height / 2
            break
          case 'right':
            left += rect.width + 10
            top += rect.height / 2
            break
        }

        setPosition({ top, left })

        // Highlight the element
        element.classList.add('tour-highlight')
      }
    }

    return () => {
      // Clean up highlights
      document.querySelectorAll('.tour-highlight').forEach(el => {
        el.classList.remove('tour-highlight')
      })
    }
  }, [isActive, currentStep])

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      completeTour()
    }
  }

  const completeTour = () => {
    localStorage.setItem('tour_completed', 'true')
    setIsActive(false)
    // Clean up any remaining highlights
    document.querySelectorAll('.tour-highlight').forEach(el => {
      el.classList.remove('tour-highlight')
    })
  }

  if (!isActive || !TOUR_STEPS[currentStep]) return null

  const step = TOUR_STEPS[currentStep]

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={completeTour} />
      
      {/* Tooltip */}
      <div 
        className={cn(
          "fixed z-50 bg-white dark:bg-gray-900 rounded-lg shadow-xl p-4 max-w-xs",
          "animate-in fade-in slide-in-from-bottom-2"
        )}
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
          transform: 'translateX(-50%)'
        }}
      >
        <Button
          variant="ghost"
          size="icon"
          className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-gray-100 dark:bg-gray-800"
          onClick={completeTour}
        >
          <X className="h-3 w-3" />
        </Button>
        
        <h3 className="font-semibold text-sm mb-1">{step.title}</h3>
        <p className="text-xs text-muted-foreground mb-3">{step.description}</p>
        
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Step {currentStep + 1} of {TOUR_STEPS.length}
          </span>
          
          <Button
            size="sm"
            onClick={handleNext}
            className="h-7 text-xs"
          >
            {currentStep === TOUR_STEPS.length - 1 ? 'Finish' : 'Next'}
            <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </div>
    </>
  )
}

// Add this CSS to your global styles
export const tourStyles = `
  .tour-highlight {
    position: relative;
    z-index: 41;
    box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5);
    animation: pulse 2s infinite;
  }
  
  @keyframes pulse {
    0% {
      box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5), 0 0 0 0 rgba(59, 130, 246, 0.7);
    }
    70% {
      box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5), 0 0 0 10px rgba(59, 130, 246, 0);
    }
    100% {
      box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5), 0 0 0 0 rgba(59, 130, 246, 0);
    }
  }
`