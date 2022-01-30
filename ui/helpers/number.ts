// Convert number to string with a given precision, and chop all trailing zeroes.
export const toMaxDecimals = (value: number, decimals: number): string =>
  Number(value.toFixed(decimals)).toString()
