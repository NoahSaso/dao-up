export const rpcEndpoint = process.env.NEXT_PUBLIC_RPC_ENDPOINT!
export const restEndpoint = process.env.NEXT_PUBLIC_REST_ENDPOINT!

export const chainId = process.env.NEXT_PUBLIC_CHAIN_ID!
export const cw20CodeId = parseInt(process.env.NEXT_PUBLIC_CW20_CODE_ID!)
export const escrowContractCodeId = parseInt(
  process.env.NEXT_PUBLIC_ESCROW_CONTRACT_CODE_ID!
)

export const minPayTokenSymbol = process.env.NEXT_PUBLIC_MIN_PAY_TOKEN_SYMBOL!
export const payTokenSymbol = process.env.NEXT_PUBLIC_PAY_TOKEN_SYMBOL!

export const daoUrlPrefix = process.env.NEXT_PUBLIC_DAO_URL_PREFIX!

export const daoUpFee = process.env.NEXT_PUBLIC_DAO_UP_FEE!
export const daoUpFeeNum = Number(daoUpFee)
export const daoUpDAOAddress = process.env.NEXT_PUBLIC_DAO_UP_DAO_ADDRESS!

export const chainPrefix = process.env.NEXT_PUBLIC_CHAIN_BECH32_PREFIX!
export const chainName = process.env.NEXT_PUBLIC_CHAIN_NAME!

export const denyListContractAddress =
  process.env.NEXT_PUBLIC_DENY_LIST_ADDRESS!

export const sentryDSN = process.env.NEXT_PUBLIC_SENTRY_DSN!

export const gasPrice = process.env.NEXT_PUBLIC_GAS_PRICE!
