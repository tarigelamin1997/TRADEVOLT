// Safe formatting utilities to prevent undefined errors

export function safeToFixed(value: number | null | undefined, decimals: number = 1): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '0'.padEnd(decimals > 0 ? decimals + 2 : 1, decimals > 0 ? '.0' : '')
  }
  return value.toFixed(decimals)
}

export function safePercent(value: number | null | undefined, decimals: number = 1): string {
  return safeToFixed(value, decimals) + '%'
}

export function safeCurrency(value: number | null | undefined, prefix: string = '$', decimals: number = 2): string {
  const formatted = safeToFixed(value, decimals)
  const num = parseFloat(formatted)
  if (num >= 0) {
    return prefix + formatted
  }
  return '-' + prefix + Math.abs(num).toFixed(decimals)
}

export function safeNumber(value: number | null | undefined, defaultValue: number = 0): number {
  if (value === null || value === undefined || isNaN(value)) {
    return defaultValue
  }
  return value
}