declare module 'use-react-screenshot' {
  import { RefObject } from 'react'

  type UseScreenshot = () => [
    string | null,
    (ref?: RefObject<HTMLElement> | HTMLElement) => Promise<string | null>
  ]

  export const useScreenshot: UseScreenshot
}