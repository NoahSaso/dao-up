export const rpcEndpoint = process.env.NEXT_PUBLIC_RPC_ENDPOINT!
export const restEndpoint = process.env.NEXT_PUBLIC_REST_ENDPOINT!

export const chainId = process.env.NEXT_PUBLIC_CHAIN_ID!
export const cw20CodeId = parseInt(process.env.NEXT_PUBLIC_CW20_CODE_ID!)

// List of Code IDs separated by commas.
export const escrowContractCodeIds = process.env
  .NEXT_PUBLIC_ESCROW_CONTRACT_CODE_IDS!.split(",")
  .map((codeId) => parseInt(codeId))
// Use last code ID for new campaigns.
export const currentEscrowContractCodeId =
  escrowContractCodeIds[escrowContractCodeIds.length - 1]

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
export const featuredListContractAddress =
  process.env.NEXT_PUBLIC_FEATURED_LIST_ADDRESS!

export const densContractAddress = process.env.NEXT_PUBLIC_DENS_CONTRACT_ADDRESS
export const densRootTokenName = process.env.NEXT_PUBLIC_DENS_ROOT_TOKEN_NAME
export const densRootTokenOwner = process.env.NEXT_PUBLIC_DENS_ROOT_TOKEN_OWNER

export const sentryDSN = process.env.NEXT_PUBLIC_SENTRY_DSN!

export const gasPrice = process.env.NEXT_PUBLIC_GAS_PRICE!

export const title = "DAO Up!"
export const description =
  "DAO Up! is a crowdfunding tool for communities. Refunds are guaranteed if a project doesn't hit its funding goal, and successful campaigns have their treasury transferred to a DAO controlled by the backers."
export const baseUrl = `http${
  process.env.NODE_ENV === "development" ? "" : "s"
}://${
  process.env.NEXT_PUBLIC_VERCEL_URL ??
  process.env.NEXT_PUBLIC_DOMAIN ??
  "daoup.zone"
}`
export const imageUrl = `${baseUrl}/images/banner.jpg`
