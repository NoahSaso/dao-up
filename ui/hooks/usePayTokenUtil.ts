import { useCallback, useEffect, useState } from "react"
import { useRecoilValue, useSetRecoilState } from "recoil"

import { parseError } from "@/helpers"
import { useWallet } from "@/hooks"
import { baseToken, getTokenPricePerBase, swapToken } from "@/services"
import {
  globalLoadingAtom,
  nativeWalletTokenBalance,
  signedCosmWasmClient,
  tokenBalanceId,
} from "@/state"

export const usePayTokenUtil = (outputToken: PayToken) => {
  const client = useRecoilValue(signedCosmWasmClient)
  const { walletAddress } = useWallet()

  const { balance } = useRecoilValue(
    nativeWalletTokenBalance(outputToken.denom)
  )
  const setTokenBalanceId = useSetRecoilState(tokenBalanceId(outputToken.denom))

  const setLoading = useSetRecoilState(globalLoadingAtom)
  const [swapError, setSwapError] = useState<string | null>(null)

  const isBase = outputToken.denom === baseToken.denom

  // Update swap price every 30 seconds.
  const [swapPrice, setSwapPrice] = useState<number>()
  useEffect(() => {
    if (!client || isBase) return

    const fetchSwapPrice = async () => {
      try {
        setSwapPrice(await getTokenPricePerBase(client, outputToken, 1))
      } catch (err) {
        console.error(err)
        return setSwapError(
          parseError(err, {
            source: "useTokenSwap fetchSwapPrice",
            ...outputToken,
          })
        )
      }
    }
    fetchSwapPrice()

    const interval = setInterval(fetchSwapPrice, 30000)
    return () => clearInterval(interval)
  }, [client, outputToken, setSwapPrice, isBase])

  // Swap and receive at least the given amount of the desired token.
  const swapForAtLeast = useCallback(
    async (minOutput: number) => {
      setSwapError(null)

      if (!client) {
        setSwapError("Failed to get signing client.")
        return false
      }
      if (!walletAddress) {
        setSwapError("Wallet not connected.")
        return false
      }
      if (!swapPrice) {
        setSwapError("Swap price not available.")
        return false
      }

      setLoading(true)

      try {
        await swapToken(
          client,
          walletAddress,
          outputToken,
          minOutput,
          swapPrice
        )
      } catch (err) {
        console.error(err)
        setSwapError(
          parseError(err, {
            source: "useTokenSwap swap swapToken",
            wallet: walletAddress,
            minOutput,
            swapPrice,
            ...outputToken,
          })
        )
        setLoading(false)
        return false
      }

      // Update pay token balance for wallet after swap completes.
      setTokenBalanceId((id) => id + 1)

      setLoading(false)

      return true
    },
    [
      client,
      outputToken,
      walletAddress,
      setLoading,
      setTokenBalanceId,
      swapPrice,
    ]
  )

  return {
    swapForAtLeast,
    swapError,
    swapPrice,
    balance,
    isBase,
    canSwap: !isBase && !!swapPrice && swapPrice > 0,
  }
}
