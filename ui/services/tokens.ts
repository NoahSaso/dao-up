import {
  minPayTokenSymbol,
  payTokenSymbol,
  swapFee,
  swapSlippage,
} from "@/config"
import { convertMicroDenomToDenom } from "@/helpers"

import tokenList from "./token_list.json"

const allowedTokens = ["UST"]

// Default chain symbol (probably juno(x))
export const baseToken: PayToken = {
  symbol: payTokenSymbol,
  denom: minPayTokenSymbol,
  decimals: 6,
  swapAddress: "",
}

export const payTokens: PayToken[] = [
  baseToken,
  ...tokenList.tokens
    .filter(({ symbol }) => allowedTokens.includes(symbol))
    .map(({ symbol, denom, decimals, swap_address: swapAddress }) => ({
      symbol,
      denom,
      decimals,
      swapAddress,
    })),
]

export const findPayTokenByDenom = (denom: string) =>
  payTokens.find(({ denom: d }) => d === denom)

export const getPayTokenLabel = (denom: string) =>
  findPayTokenByDenom(denom)?.symbol ?? "Unknown"

export const getNextPayTokenDenom = (denom: string) =>
  payTokens[
    (payTokens.findIndex(({ denom: d }) => d === denom) + 1) % payTokens.length
  ].denom

// swapPrice is in payToken/baseToken (i.e. price of 1 baseToken in payToken)
export const getBaseTokenForMinPayToken = (
  minPayToken: number,
  swapPrice: number,
  decimals: number
) =>
  Number(
    // Take into account slippage and fee.
    (
      minPayToken / swapPrice / (1 - swapSlippage) / (1 - swapFee) +
      // Add the smallest unit in case of nonzero decimals after the truncation to ensure sufficient balance.
      convertMicroDenomToDenom(1, decimals)
    ).toFixed(decimals)
  )

// swapPrice is in payToken/baseToken (i.e. price of 1 baseToken in payToken)
export const getMinPayTokenForBaseToken = (
  baseToken: number,
  swapPrice: number,
  decimals: number
) =>
  Number(
    // Take into account slippage and fee.
    (
      (baseToken -
        // Subtract the smallest unit in case of nonzero decimals after the truncation to ensure sufficient balance.
        convertMicroDenomToDenom(1, decimals)) *
      swapPrice *
      (1 - swapSlippage) *
      (1 - swapFee)
    ).toFixed(decimals)
  )
