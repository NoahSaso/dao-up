import {
  CosmWasmClient,
  SigningCosmWasmClient,
} from "@cosmjs/cosmwasm-stargate"
import { coin, GasPrice } from "@cosmjs/stargate"
import { findAttribute } from "@cosmjs/stargate/build/logs"
import { Keplr } from "@keplr-wallet/types"

import {
  densContractAddress,
  densRootTokenName,
  densRootTokenOwner,
  denyListContractAddress,
  featuredListContractAddress,
  gasPrice,
  rpcEndpoints,
} from "@/config"
import {
  CommonError,
  convertDenomToMicroDenom,
  convertMicroDenomToDenom,
  escrowAddressRegex,
  parseError,
} from "@/helpers"
import { baseToken, getBaseTokenForMinPayToken } from "@/services"

export const getClient = async () => {
  let rpcIndex = 0
  while (rpcIndex < rpcEndpoints.length) {
    try {
      return await CosmWasmClient.connect(rpcEndpoints[rpcIndex])
    } catch (err) {
      console.error(
        parseError(
          err,
          {
            source: "getClient",
            rpcIndex,
            rpcEndpoint: rpcEndpoints[rpcIndex],
          },
          undefined,
          {
            // When connecting to the RPC node, an invalid JSON response indicates a problem with the node (e.g. the node is down).
            [CommonError.InvalidJSONResponse]: CommonError.Network,
          },
          undefined,
          // Don't capture invalid JSON response since we know it indicates RPC node error.
          {
            [CommonError.InvalidJSONResponse]: false,
          }
        )
      )
      rpcIndex++
      // If last RPC node threw error, rethrow.
      if (rpcIndex === rpcEndpoints.length) {
        throw err
      }
    }
  }
}

export const getSigningClient = async (
  signer: Awaited<ReturnType<Keplr["getOfflineSignerAuto"]>>
) => {
  let rpcIndex = 0
  while (rpcIndex < rpcEndpoints.length) {
    try {
      return await SigningCosmWasmClient.connectWithSigner(
        rpcEndpoints[rpcIndex],
        signer,
        {
          gasPrice: GasPrice.fromString(gasPrice),
          broadcastTimeoutMs: 1000 * 60 * 2, // 2 minutes
        }
      )
    } catch (err) {
      console.error(
        parseError(
          err,
          {
            source: "getSigningClient",
            rpcIndex,
            rpcEndpoint: rpcEndpoints[rpcIndex],
          },
          undefined,
          {
            // When connecting to the RPC node, an invalid JSON response indicates a problem with the node (e.g. the node is down).
            [CommonError.InvalidJSONResponse]: CommonError.Network,
          },
          undefined,
          // Don't capture invalid JSON response since we know it indicates RPC node error.
          {
            [CommonError.InvalidJSONResponse]: false,
          }
        )
      )
      rpcIndex++
      // If last RPC node threw error, rethrow.
      if (rpcIndex === rpcEndpoints.length) {
        throw err
      }
    }
  }
}

export const getCW20WalletTokenBalance = async (
  client: CosmWasmClient,
  tokenAddress: string,
  walletAddress: string
) => {
  const { balance } = await client.queryContractSmart(tokenAddress, {
    balance: { address: walletAddress },
  })
  return convertMicroDenomToDenom(balance, 6)
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
        undefined,
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

export const getNativeTokenBalance = async (
  client: SigningCosmWasmClient,
  walletAddress: string,
  token: PayToken
): Promise<number> => {
  const coin = await client.getBalance(walletAddress, token.denom)
  return convertMicroDenomToDenom(coin?.amount ?? 0, token.decimals)
}

// Price of token in baseToken.
export const getTokenPricePerBase = async (
  client: CosmWasmClient,
  token: PayToken,
  baseAmount: number
): Promise<number> => {
  const { token2_amount } = await client.queryContractSmart(token.swapAddress, {
    token1_for_token2_price: {
      token1_amount: convertDenomToMicroDenom(
        baseAmount,
        baseToken.decimals
      ).toString(),
    },
  })
  return convertMicroDenomToDenom(token2_amount, token.decimals)
}

// Swaps baseToken for outputToken and receive at least minOutput outputTokens.
export const swapToken = async (
  client: SigningCosmWasmClient,
  walletAddress: string,
  outputToken: PayToken,
  minOutput: number,
  swapPrice: number
): Promise<any> => {
  // Get base token amount that will yield at least the desired minOutput.
  const inputAmount = getBaseTokenForMinPayToken(
    minOutput,
    swapPrice,
    baseToken.decimals
  )

  const microInputAmount = convertDenomToMicroDenom(
    inputAmount,
    baseToken.decimals
  ).toString()
  const microMinOutputAmount = convertDenomToMicroDenom(
    minOutput,
    outputToken.decimals
  ).toString()

  const msg = {
    swap: {
      input_token: "Token1",
      input_amount: microInputAmount,
      min_output: microMinOutputAmount,
    },
  }
  const response = await client.execute(
    walletAddress,
    outputToken.swapAddress,
    msg,
    "auto",
    undefined,
    [coin(microInputAmount, baseToken.denom)]
  )
  return response
}
