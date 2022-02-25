import {
  CosmWasmClient,
  SigningCosmWasmClient,
} from "@cosmjs/cosmwasm-stargate"
import { findAttribute } from "@cosmjs/stargate/build/logs"

import {
  densContractAddress,
  densRootTokenName,
  densRootTokenOwner,
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
): Promise<CampaignDumpStateResponse> =>
  client.queryContractSmart(campaignAddress, {
    dump_state: {},
  })

export const getTokenInfo = async (
  client: CosmWasmClient,
  tokenAddress: string
): Promise<TokenInfoResponse> =>
  client.queryContractSmart(tokenAddress, {
    token_info: {},
  })

export const getDENSAddress = async (client: CosmWasmClient, name: string) => {
  // DENS does not exist on testnet.
  if (!densContractAddress || !densRootTokenName) return null

  try {
    const {
      extension: { public_bio },
    } = await client.queryContractSmart(densContractAddress, {
      nft_info: {
        token_id: `${densRootTokenName}::${name.toLowerCase()}`,
      },
    })

    // Ensure public_bio is a valid contract address.
    if (
      typeof public_bio !== "string" ||
      !escrowAddressRegex.test(public_bio)
    ) {
      return null
    }

    return public_bio
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

export const getDENSNames = async (
  client: CosmWasmClient
): Promise<string[]> => {
  // DENS does not exist on testnet.
  if (!densContractAddress || !densRootTokenName) return []

  try {
    const { tokens } = await client.queryContractSmart(densContractAddress, {
      paths_for_token: {
        token_id: densRootTokenName,
        owner: densRootTokenOwner,
      },
    })

    if (!Array.isArray(tokens)) return []

    // Strip root path from beginning.
    return tokens.map((token: string) =>
      token.replace(`${densRootTokenName}::`, "")
    )
  } catch (error) {
    console.error(parseError(error, { source: "getDENSNames" }))
    return []
  }
}

export const createDENSAddressMap = (
  names: string[],
  addresses: (string | null)[]
): DENSAddressMap =>
  addresses.reduce(
    (map, address, index) => ({
      ...map,
      ...(address ? { [address]: names[index] } : {}),
    }),
    {}
  )

export const createDAOProposalForCampaign = async (
  client: SigningCosmWasmClient,
  walletAddress: string,
  campaign: Campaign,
  // Response of DAO's get_config.
  dao: any,
  msg: any
) => {
  const daoProposalDeposit = Number(dao.config?.proposal_deposit)
  if (!isNaN(daoProposalDeposit) && daoProposalDeposit > 0)
    await client.execute(
      walletAddress,
      campaign.govToken.address,
      {
        increase_allowance: {
          amount: dao.config.proposal_deposit,
          spender: campaign.dao.address,
        },
      },
      "auto"
    )

  const response = await client.execute(
    walletAddress,
    campaign.dao.address,
    msg,
    "auto"
  )

  return findAttribute(response.logs, "wasm", "proposal_id").value
}
