declare module 'react-calendar-heatmap' {
  import { ComponentType } from 'react'

  export interface CalendarHeatmapValue {
    date: string | Date
    count?: number
    [key: string]: any
  }

  export interface CalendarHeatmapProps {
    values: CalendarHeatmapValue[]
    startDate: Date
    endDate: Date
    classForValue?: (value: CalendarHeatmapValue | null) => string
    titleForValue?: (value: CalendarHeatmapValue | null) => string
    tooltipDataAttrs?: (value: CalendarHeatmapValue | null) => Record<string, any> | null
    showWeekdayLabels?: boolean
    showMonthLabels?: boolean
    showOutOfRangeDays?: boolean
    horizontal?: boolean
    monthLabels?: string[]
    weekdayLabels?: string[]
    onClick?: (value: CalendarHeatmapValue | null) => void
    onMouseOver?: (event: React.MouseEvent, value: CalendarHeatmapValue | null) => void
    onMouseLeave?: (event: React.MouseEvent, value: CalendarHeatmapValue | null) => void
    transformDayElement?: (element: React.ReactElement, value: CalendarHeatmapValue | null, index: number) => React.ReactElement
  }

  const CalendarHeatmap: ComponentType<CalendarHeatmapProps>
  export default CalendarHeatmap
}

declare module 'react-calendar-heatmap/dist/styles.css' {
  const content: any
  export default content
}