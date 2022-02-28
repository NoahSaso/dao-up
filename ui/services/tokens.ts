import {
  minPayTokenSymbol,
  payTokenSymbol,
  swapFee,
  swapSlippage,
} from "@/config"

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

export const getPayTokenLabel = (denom: string) =>
  payTokens.find(({ denom: d }) => d === denom)?.symbol ?? "Unknown"

export const getNextPayTokenDenom = (denom: string) =>
  payTokens[
    (payTokens.findIndex(({ denom: d }) => d === denom) + 1) % payTokens.length
  ].denom

// swapPrice is in payToken/baseToken (i.e. price of 1 baseToken in payToken)
export const getBaseTokenForDesiredAmount = (
  minOutput: number,
  swapPrice: number
) =>
  // Take into account slippage and fee.
  minOutput / swapPrice / (1 - swapSlippage) / (1 - swapFee)
