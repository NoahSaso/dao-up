// Convert number to string with a given precision, and chop all trailing zeroes.
export const toMaxDecimals = (
  value: number | string,
  decimals: number
): string =>
  Number(value).toLocaleString(undefined, {
    maximumFractionDigits: decimals,
  })
