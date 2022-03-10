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
  rpcEndpoint,
} from "@/config"
import {
  blockHeightToSeconds,
  CommonError,
  convertDenomToMicroDenom,
  convertMicroDenomToDenom,
  escrowAddressRegex,
  parseError,
} from "@/helpers"
import { baseToken, getBaseTokenForMinPayToken } from "@/services"
import { CampaignActionType } from "@/types"

export const getClient = async () => CosmWasmClient.connect(rpcEndpoint)

export const getSigningClient = async (
  signer: Awaited<ReturnType<Keplr["getOfflineSignerAuto"]>>
) =>
  SigningCosmWasmClient.connectWithSigner(rpcEndpoint, signer, {
    gasPrice: GasPrice.fromString(gasPrice),
    broadcastTimeoutMs: 1000 * 60 * 2, // 2 minutes
  })

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

export const contractInstantiationBlockHeight = async (
  client: CosmWasmClient,
  address: string
): Promise<number | null> => {
  try {
    const events = await client.searchTx({
      tags: [{ key: "instantiate._contract_address", value: address }],
    })
    if (!events.length) {
      return null
    }

    return events[0].height
  } catch (error) {
    console.error(
      parseError(error, {
        source: "contractInstantiationBlockHeight",
        campaign: address,
      })
    )
    return null
  }
}

export const getDateFromBlockHeight = async (
  client: CosmWasmClient,
  blockHeight: number
): Promise<Date | null> => {
  try {
    const block = await client.getBlock(blockHeight)
    return new Date(Date.parse(block.header.time))
  } catch (error) {
    console.error(
      parseError(error, {
        source: "getDateFromBlockHeight",
        blockHeight,
      })
    )
    return null
  }
}

export const getCampaignActions = async (
  client: CosmWasmClient,
  campaign: Campaign,
  currentBlockHeight: number | null,
  minBlockHeight?: number,
  maxBlockHeight?: number
): Promise<CampaignAction[]> => {
  // Get all of the wasm messages involving this contract.
  const events = await client.searchTx(
    {
      tags: [{ key: "wasm._contract_address", value: campaign.address }],
    },
    {
      minHeight: minBlockHeight && Math.max(minBlockHeight, 0),
      maxHeight: maxBlockHeight,
    }
  )

  const wasms = events
    // Parse their logs.
    .map((e) => ({
      log: JSON.parse(e.rawLog),
      height: e.height,
    }))
    // Get the wasm components of their logs.
    .map((l) => ({
      wasm: l.log[0].events.find((e: any) => e.type === "wasm"),
      height: l.height,
    }))
    .filter((w) => !!w.wasm)

  // Get the messages that are fund messages.
  const funds = wasms.filter((wasm) =>
    wasm.wasm.attributes.some((a: any) => a.value === "fund")
  )

  // Get the messages that are refund messages.
  const refunds = wasms.filter((wasm) =>
    wasm.wasm.attributes.some((a: any) => a.value === "refund")
  )

  // Extract the amount and sender.
  const fundActions: CampaignAction[] = funds.map((fund) => {
    let amount = convertMicroDenomToDenom(
      fund.wasm.attributes.find((a: any) => a.key === "amount")?.value,
      campaign.payToken.decimals
    )
    let address = fund.wasm.attributes.find((a: any) => a.key === "sender")
      ?.value as string

    let when
    if (currentBlockHeight !== null) {
      const elapsedTime = blockHeightToSeconds(currentBlockHeight - fund.height)
      when = new Date()
      when.setSeconds(when.getSeconds() - elapsedTime)
    }

    return {
      type: CampaignActionType.Fund,
      address,
      amount,
      when,
    }
  })
  const refundActions: CampaignAction[] = refunds.map((fund) => {
    let amount = convertMicroDenomToDenom(
      fund.wasm.attributes.find((a: any) => a.key === "native_returned")?.value,
      campaign.payToken.decimals
    )
    let address = fund.wasm.attributes.find((a: any) => a.key === "sender")
      ?.value as string

    let when
    if (currentBlockHeight !== null) {
      const elapsedTime = blockHeightToSeconds(currentBlockHeight - fund.height)
      when = new Date()
      when.setSeconds(when.getSeconds() - elapsedTime)
    }

    return {
      type: CampaignActionType.Refund,
      address,
      amount,
      when,
    }
  })

  // Combine and sort descending (most recent first).
  const actions = [...refundActions, ...fundActions].sort((a, b) => {
    if (a.when === undefined) return 1
    if (b.when === undefined) return -1
    return b.when.getTime() - a.when.getTime()
  })

  return actions
}
