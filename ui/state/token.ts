import { atomFamily, selectorFamily } from "recoil"

import { parseError } from "@/helpers"
import { cosmWasmClient, walletAddress } from "@/state"
import { CommonError } from "@/types"

export const tokenAddressBalanceId = atomFamily<number, string | undefined>({
  key: "tokenAddressBalanceId",
  default: 0,
})

export const tokenBalance = selectorFamily<
  TokenBalanceResponse,
  {
    tokenAddress: string | undefined | null
    walletAddress: string | undefined | null
  }
>({
  key: "tokenBalance",
  get:
    ({ tokenAddress, walletAddress }) =>
    async ({ get }) => {
      if (!tokenAddress || !walletAddress) return { balance: null, error: null }

      // Allow us to manually refresh balance for given token.
      get(tokenAddressBalanceId(tokenAddress))

      const client = get(cosmWasmClient)

      if (!client)
        return {
          balance: null,
          error: CommonError.GetClientFailed,
        }

      try {
        const { balance } = await client.queryContractSmart(tokenAddress, {
          balance: { address: walletAddress },
        })

        return {
          balance: Number(balance) / 1e6,
          error: null,
        }
      } catch (error) {
        console.error(error)
        return { balance: null, error: parseError(error) }
      }
    },
})

export const walletTokenBalance = selectorFamily<
  TokenBalanceResponse,
  string | undefined | null
>({
  key: "walletTokenBalance",
  get:
    (tokenAddress) =>
    async ({ get }) => {
      const address = get(walletAddress)

      if (!address) return { balance: null, error: null }

      const { balance, error: tokenBalanceError } = get(
        tokenBalance({
          tokenAddress,
          walletAddress: address,
        })
      )
      if (tokenBalanceError || balance === null)
        return { balance: null, error: tokenBalanceError }

      return { balance, error: null }
    },
})
