import { CosmWasmClient } from "@cosmjs/cosmwasm-stargate"

import {
  densContractAddress,
  denyListContractAddress,
  featuredListContractAddress,
  rpcEndpoint,
} from "@/config"
import { escrowAddressRegex, parseError } from "@/helpers"
import { CommonError } from "@/types"

export const getClient = async () => CosmWasmClient.connect(rpcEndpoint)

export const getWalletTokenBalance = async (
  client: CosmWasmClient,
  tokenAddress: string,
  walletAddress: string
) => {
  const { balance } = await client.queryContractSmart(tokenAddress, {
    balance: { address: walletAddress },
  })
  return Number(balance) / 1e6
}

export const getFeaturedAddresses = async (client: CosmWasmClient) =>
  (
    (await client.queryContractSmart(featuredListContractAddress, {
      list_members: {},
    })) as AddressPriorityListResponse
  ).members.map(({ addr }) => addr)

export const getDenyListAddresses = async (client: CosmWasmClient) =>
  (
    (await client.queryContractSmart(denyListContractAddress, {
      list_members: {},
    })) as AddressPriorityListResponse
  ).members.map(({ addr }) => addr)

export const getCampaignState = async (
  client: CosmWasmClient,
  campaignAddress: string
) =>
  client.queryContractSmart(campaignAddress, {
    dump_state: {},
  })

export const getTokenInfo = async (
  client: CosmWasmClient,
  tokenAddress: string
) =>
  client.queryContractSmart(tokenAddress, {
    token_info: {},
  })

export const getDENSAddress = async (client: CosmWasmClient, name: string) => {
  // DENS does not exist on testnet.
  if (!densContractAddress) return null

  try {
    const {
      extension: { public_name },
    } = await client.queryContractSmart(densContractAddress, {
      nft_info: {
        token_id: `dao-up::${name}`,
      },
    })

    // Ensure public_name is a valid contract address.
    if (
      typeof public_name !== "string" ||
      !escrowAddressRegex.test(public_name)
    )
      return null

    return public_name
  } catch (error) {
    console.error(
      parseError(
        error,
        {
          source: "getDENSAddress",
          name,
        },
        {
          [CommonError.NotFound]: "Name service lookup failed.",
        }
      )
    )
    return null
  }
}
