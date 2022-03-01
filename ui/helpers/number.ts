// Convert number to string with a given precision, and chop all trailing zeroes.
export const prettyPrintDecimal = (
  value: number | string,
  maximumFractionDigits: number = 6,
  minimumFractionDigits?: number
): string =>
  Number(value).toLocaleString(undefined, {
    minimumFractionDigits,
    maximumFractionDigits,
  })

export const protectAgainstNaN = (value: number) => (isNaN(value) ? 0 : value)

export const convertMicroDenomToDenom = (
  value: number | string,
  decimals: number
): number => {
  if (decimals === 0) return Number(value)

  return protectAgainstNaN(Number(value) / Math.pow(10, decimals))
}

export const convertDenomToMicroDenom = (
  value: number | string,
  decimals: number
): number => {
  if (decimals === 0) return Number(value)

  return protectAgainstNaN(
    parseInt((Number(value) * Math.pow(10, decimals)).toFixed(decimals), 10)
  )
}
