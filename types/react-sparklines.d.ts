declare module 'react-sparklines' {
  import { ComponentType, ReactNode } from 'react'

  export interface SparklinesProps {
    data: number[]
    limit?: number
    width?: number
    height?: number
    svgWidth?: number
    svgHeight?: number
    preserveAspectRatio?: string
    margin?: number
    style?: React.CSSProperties
    max?: number
    min?: number
    children?: ReactNode
  }

  export interface SparklinesLineProps {
    color?: string
    style?: React.CSSProperties
  }

  export interface SparklinesSpotsProps {
    size?: number
    style?: React.CSSProperties
    spotColors?: Record<number, string>
  }

  export interface SparklinesReferenceLineProps {
    type?: 'max' | 'min' | 'mean' | 'avg' | 'median' | 'custom'
    value?: number
    style?: React.CSSProperties
  }

  export interface SparklinesNormalBandProps {
    style?: React.CSSProperties
  }

  export interface SparklinesBarsProps {
    style?: React.CSSProperties
    barWidth?: number
    margin?: number
  }

  export const Sparklines: ComponentType<SparklinesProps>
  export const SparklinesLine: ComponentType<SparklinesLineProps>
  export const SparklinesSpots: ComponentType<SparklinesSpotsProps>
  export const SparklinesReferenceLine: ComponentType<SparklinesReferenceLineProps>
  export const SparklinesNormalBand: ComponentType<SparklinesNormalBandProps>
  export const SparklinesBars: ComponentType<SparklinesBarsProps>
}