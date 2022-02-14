import { coins, StdFee } from "@cosmjs/stargate"

export const endpoint = process.env.NEXT_PUBLIC_RPC_ENDPOINT!

export const chainId = process.env.NEXT_PUBLIC_CHAIN_ID!
export const cw20CodeId = parseInt(process.env.NEXT_PUBLIC_CW20_CODE_ID!)
export const escrowContractCodeId = parseInt(
  process.env.NEXT_PUBLIC_ESCROW_CONTRACT_CODE_ID!
)
export const fundingTokenDenom = process.env.NEXT_PUBLIC_FUNDING_TOKEN_DENOM!
const feeDenom = process.env.NEXT_PUBLIC_FEE_DENOM!
export const payTokenSymbol = process.env.NEXT_PUBLIC_PAY_TOKEN_SYMBOL!
export const daoUrlPrefix = process.env.NEXT_PUBLIC_DAO_URL_PREFIX!
export const daoUpFee = process.env.NEXT_PUBLIC_DAO_UP_FEE!
export const daoUpFeeNum = Number(daoUpFee)
export const daoUpDAOAddress = process.env.NEXT_PUBLIC_DAO_UP_DAO_ADDRESS!
export const chainPrefix = process.env.NEXT_PUBLIC_CHAIN_BECH32_PREFIX!

export const denyListContractAddress =
  process.env.NEXT_PUBLIC_DENY_LIST_ADDRESS!

export const defaultExecuteFee: StdFee = {
  amount: coins(100000, feeDenom),
  // TODO: Calibrate.
  gas: "666666",
}
