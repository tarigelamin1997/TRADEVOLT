declare module 'react-gauge-chart' {
  import { ComponentType } from 'react'

  export interface GaugeChartProps {
    id?: string
    className?: string
    style?: React.CSSProperties
    marginInPercent?: number
    cornerRadius?: number
    nrOfLevels?: number
    percent?: number
    arcPadding?: number
    arcWidth?: number
    colors?: string[]
    textColor?: string
    needleColor?: string
    needleBaseColor?: string
    hideText?: boolean
    arcsLength?: number[]
    animate?: boolean
    animDelay?: number
    formatTextValue?: (value: string) => string
    fontSize?: string
    animateDuration?: number
  }

  const GaugeChart: ComponentType<GaugeChartProps>
  export default GaugeChart
}