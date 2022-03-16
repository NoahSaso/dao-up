// Convert number to string with a given precision, and chop all trailing zeroes.
export const prettyPrintDecimal = (
  value: number | string,
  maximumFractionDigits: number,
  unit?: string
): string =>
  Number(value).toLocaleString(undefined, {
    maximumFractionDigits,
  }) +
  // Add space only if not percent.
  (unit ? (unit !== "%" ? " " : "") + unit : "")

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

// Juno block times are normally in the 6 to 6.5 second
// range. This really doesn't need to be terribly accurate.
export const blockHeightToSeconds = (blockHeight: number): number =>
  blockHeight * 6.3

export const secondsToBlockHeight = (seconds: number): number =>
  Math.round(seconds / 6.3)
