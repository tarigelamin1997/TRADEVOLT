'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { ChevronRight, ChevronLeft, X, Zap, Upload, Target, Rocket } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { quickToast } from '@/lib/toast-utils'

interface OnboardingStep {
  id: number
  title: string
  description: string
  icon: React.ElementType
  action?: {
    label: string
    onClick: () => void
  }
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 1,
    title: 'Welcome to TradeVolt!',
    description: 'Your professional trading journal to track, analyze, and improve your trading performance. Let\'s get you started in just a few steps.',
    icon: Rocket,
  },
  {
    id: 2,
    title: 'Import Your Trades',
    description: 'You can import trades from a CSV file, connect to your broker, or manually enter trades. We support all major markets including stocks, options, futures, forex, and crypto.',
    icon: Upload,
    action: {
      label: 'Import Trades',
      onClick: () => window.location.href = '/journal'
    }
  },
  {
    id: 3,
    title: 'Set Your Goals',
    description: 'Define your trading goals and risk parameters. TradeVolt will help you track your progress and maintain discipline.',
    icon: Target,
    action: {
      label: 'Set Goals',
      onClick: () => window.location.href = '/settings'
    }
  },
  {
    id: 4,
    title: 'You\'re All Set!',
    description: 'Start tracking your trades and watch your performance improve. Remember to log your trades daily for the best insights.',
    icon: Zap,
  }
]

export function OnboardingWizard() {
  const [isOpen, setIsOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const router = useRouter()

  useEffect(() => {
    // Check if user has completed onboarding
    const hasCompletedOnboarding = localStorage.getItem('onboarding_completed')
    const isNewUser = !hasCompletedOnboarding
    
    // Show onboarding for new users
    if (isNewUser) {
      // Small delay to let the page load first
      setTimeout(() => setIsOpen(true), 500)
    }
  }, [])

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      completeOnboarding()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSkip = () => {
    completeOnboarding()
  }

  const completeOnboarding = () => {
    localStorage.setItem('onboarding_completed', 'true')
    setIsOpen(false)
    quickToast.saved()
    
    // Optional: Load sample data for new users
    const loadSampleData = window.confirm('Would you like to load sample trades to explore the features?')
    if (loadSampleData) {
      // This would trigger loading sample data
      router.push('/dashboard?load_sample=true')
    }
  }

  const progress = ((currentStep + 1) / ONBOARDING_STEPS.length) * 100
  const step = ONBOARDING_STEPS[currentStep]
  const Icon = step.icon

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-lg">
        <DialogHeader className="relative">
          {/* Skip button */}
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0"
            onClick={handleSkip}
          >
            Skip
            <X className="h-4 w-4 ml-1" />
          </Button>
          
          {/* Progress bar */}
          <div className="mb-6">
            <div className="flex justify-between text-xs text-muted-foreground mb-2">
              <span>Step {currentStep + 1} of {ONBOARDING_STEPS.length}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Step content */}
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
              <Icon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          
          <DialogTitle className="text-center text-2xl">
            {step.title}
          </DialogTitle>
          
          <DialogDescription className="text-center mt-2">
            {step.description}
          </DialogDescription>
        </DialogHeader>

        {/* Quick action button if available */}
        {step.action && (
          <div className="mt-6">
            <Button
              variant="outline"
              className="w-full"
              onClick={step.action.onClick}
            >
              {step.action.label}
            </Button>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          
          <Button
            onClick={handleNext}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {currentStep === ONBOARDING_STEPS.length - 1 ? 'Get Started' : 'Next'}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}