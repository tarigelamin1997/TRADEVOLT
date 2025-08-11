import toast from 'react-hot-toast'
import { CheckCircle, XCircle, AlertCircle, Info, Loader2 } from 'lucide-react'

// Custom styled toast with icons
export const showToast = {
  success: (message: string) => {
    toast.custom((t) => (
      <div className={`${
        t.visible ? 'animate-enter' : 'animate-leave'
      } max-w-md w-full bg-white dark:bg-gray-900 shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}>
        <div className="flex-1 w-0 p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 pt-0.5">
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Success
              </p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {message}
              </p>
            </div>
          </div>
        </div>
        <div className="flex border-l border-gray-200 dark:border-gray-700">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            Close
          </button>
        </div>
      </div>
    ))
  },

  error: (message: string) => {
    toast.custom((t) => (
      <div className={`${
        t.visible ? 'animate-enter' : 'animate-leave'
      } max-w-md w-full bg-white dark:bg-gray-900 shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}>
        <div className="flex-1 w-0 p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 pt-0.5">
              <XCircle className="h-5 w-5 text-red-500" />
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Error
              </p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {message}
              </p>
            </div>
          </div>
        </div>
        <div className="flex border-l border-gray-200 dark:border-gray-700">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            Close
          </button>
        </div>
      </div>
    ))
  },

  warning: (message: string) => {
    toast.custom((t) => (
      <div className={`${
        t.visible ? 'animate-enter' : 'animate-leave'
      } max-w-md w-full bg-white dark:bg-gray-900 shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}>
        <div className="flex-1 w-0 p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 pt-0.5">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Warning
              </p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {message}
              </p>
            </div>
          </div>
        </div>
      </div>
    ))
  },

  info: (message: string) => {
    toast.custom((t) => (
      <div className={`${
        t.visible ? 'animate-enter' : 'animate-leave'
      } max-w-md w-full bg-white dark:bg-gray-900 shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}>
        <div className="flex-1 w-0 p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 pt-0.5">
              <Info className="h-5 w-5 text-blue-500" />
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Info
              </p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {message}
              </p>
            </div>
          </div>
        </div>
      </div>
    ))
  },

  loading: (message: string) => {
    return toast.custom((t) => (
      <div className={`${
        t.visible ? 'animate-enter' : 'animate-leave'
      } max-w-md w-full bg-white dark:bg-gray-900 shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}>
        <div className="flex-1 w-0 p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 pt-0.5">
              <Loader2 className="h-5 w-5 text-gray-500 animate-spin" />
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Loading
              </p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {message}
              </p>
            </div>
          </div>
        </div>
      </div>
    ), { duration: Infinity })
  },

  promise: <T,>(
    promise: Promise<T>,
    msgs: {
      loading: string
      success: string | ((data: T) => string)
      error: string | ((err: any) => string)
    }
  ) => {
    return toast.promise(promise, {
      loading: msgs.loading,
      success: msgs.success,
      error: msgs.error,
    })
  }
}

// Quick actions
export const quickToast = {
  // Success messages
  saved: () => showToast.success('Changes saved successfully'),
  deleted: () => showToast.success('Item deleted successfully'),
  copied: () => showToast.success('Copied to clipboard'),
  tradeSaved: () => showToast.success('Trade saved successfully'),
  tradeDeleted: () => showToast.success('Trade deleted successfully'),
  importSuccess: (count: number) => showToast.success(`Successfully imported ${count} trades`),
  exportSuccess: () => showToast.success('Export completed successfully'),
  settingsUpdated: () => showToast.success('Settings updated successfully'),
  
  // Error messages
  error: (message: string) => showToast.error(message),
  
  // Warning messages
  warning: (message: string) => showToast.warning(message),
  
  // Info messages
  info: (message: string) => showToast.info(message),
  
  // Generic success
  success: (message: string) => showToast.success(message),
}