import { atomFamily, selectorFamily } from "recoil"

import { CommonError, parseError } from "@/helpers"
import {
  findPayTokenByDenom,
  getCW20WalletTokenBalance,
  getNativeTokenBalance,
} from "@/services"
import { cosmWasmClient, signedCosmWasmClient, walletAddress } from "@/state"

export const tokenBalanceId = atomFamily<number, string | undefined>({
  key: "tokenBalanceId",
  default: 0,
})

export const cw20TokenBalance = selectorFamily<
  TokenBalanceResponse,
  {
    tokenAddress: string | undefined | null
    walletAddress: string | undefined | null
  }
>({
  key: "cw20TokenBalance",
  get:
    ({ tokenAddress, walletAddress }) =>
    async ({ get }) => {
      if (!tokenAddress || !walletAddress) return { balance: null, error: null }

      // Allow us to manually refresh balance for given token.
      get(tokenBalanceId(tokenAddress))

      const client = get(cosmWasmClient)

      if (!client)
        return {
          balance: null,
          error: CommonError.GetClientFailed,
        }

      try {
        return {
          balance: await getCW20WalletTokenBalance(
            client,
            tokenAddress,
            walletAddress
          ),
          error: null,
        }
      } catch (error) {
        console.error(error)
        return {
          balance: null,
          error: parseError(error, {
            source: "cw20TokenBalance",
            wallet: walletAddress,
            token: tokenAddress,
          }),
        }
      }
    },
})

export const cw20WalletTokenBalance = selectorFamily<
  TokenBalanceResponse,
  string | undefined | null
>({
  key: "cw20WalletTokenBalance",
  get:
    (tokenAddress) =>
    async ({ get }) => {
      const address = get(walletAddress)

      if (!address) return { balance: null, error: null }

      const { balance, error: tokenBalanceError } = get(
        cw20TokenBalance({
          tokenAddress,
          walletAddress: address,
        })
      )
      if (tokenBalanceError || balance === null)
        return { balance: null, error: tokenBalanceError }

      return { balance, error: null }
    },
})

export const nativeWalletTokenBalance = selectorFamily<
  TokenBalanceResponse,
  string | undefined | null
>({
  key: "nativeWalletTokenBalance",
  get:
    (tokenDenom) =>
    async ({ get }) => {
      if (!tokenDenom) return { balance: null, error: null }

      // Allow us to manually refresh balance for given token.
      get(tokenBalanceId(tokenDenom))

      const address = get(walletAddress)
      const payToken = findPayTokenByDenom(tokenDenom)

      if (!address || !payToken) return { balance: null, error: null }

      const client = get(signedCosmWasmClient)
      if (!client)
        return {
          balance: null,
          error: CommonError.GetClientFailed,
        }

      try {
        return {
          balance: await getNativeTokenBalance(client, address, payToken),
          error: null,
        }
      } catch (error) {
        console.error(error)
        return {
          balance: null,
          error: parseError(error, {
            source: "nativeWalletTokenBalance",
            wallet: address,
            tokenDenom,
            ...payToken,
          }),
        }
      }
    },
})
