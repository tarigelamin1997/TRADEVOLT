import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <SignIn 
        appearance={{
          elements: {
            formButtonPrimary: 'bg-black hover:bg-gray-800',
            footerActionLink: 'text-black hover:text-gray-800'
          }
        }}
        redirectUrl="/dashboard"
      />
    </div>
  )
}