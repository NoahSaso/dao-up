import { Keplr } from "@keplr-wallet/types"

import {
  chainId,
  chainName,
  chainPrefix,
  minPayTokenSymbol,
  payTokenSymbol,
  restEndpoint,
  rpcEndpoint,
} from "@/config"

export const suggestToken = async (keplr: Keplr, address: string) =>
  keplr
    .suggestToken(chainId, address)
    .then(() => true)
    .catch(() => false)

// Stolen from DAO DAO, with love <3
export const suggestChain = async (keplr: Keplr) =>
  keplr.experimentalSuggestChain({
    // Chain-id of the Cosmos SDK chain.
    chainId,
    // The name of the chain to be displayed to the user.
    chainName,
    // RPC endpoint of the chain.
    rpc: rpcEndpoint,
    // REST endpoint of the chain.
    rest: restEndpoint,
    // Staking coin information
    stakeCurrency: {
      // Coin denomination to be displayed to the user.
      coinDenom: payTokenSymbol,
      // Actual denom (i.e. uatom, uscrt) used by the blockchain.
      coinMinimalDenom: minPayTokenSymbol,
      // # of decimal points to convert minimal denomination to user-facing denomination.
      coinDecimals: 6,
      // (Optional) Keplr can show the fiat value of the coin if a coingecko id is provided.
      // You can get id from https://api.coingecko.com/api/v3/coins/list if it is listed.
      // coinGeckoId: ""
    },
    // (Optional) If you have a wallet webpage used to stake the coin then provide the url to the website in `walletUrlForStaking`.
    // The 'stake' button in Keplr extension will link to the webpage.
    // walletUrlForStaking: "",
    // The BIP44 path.
    bip44: {
      // You can only set the coin type of BIP44.
      // 'Purpose' is fixed to 44.
      coinType: 118,
    },
    // Bech32 configuration to show the address to user.
    bech32Config: {
      bech32PrefixAccAddr: chainPrefix,
      bech32PrefixAccPub: `${chainPrefix}pub`,
      bech32PrefixValAddr: `${chainPrefix}valoper`,
      bech32PrefixValPub: `${chainPrefix}valoperpub`,
      bech32PrefixConsAddr: `${chainPrefix}valcons`,
      bech32PrefixConsPub: `${chainPrefix}valconspub`,
    },
    // List of all coin/tokens used in this chain.
    currencies: [
      {
        // Coin denomination to be displayed to the user.
        coinDenom: payTokenSymbol,
        // Actual denom (i.e. uatom, uscrt) used by the blockchain.
        coinMinimalDenom: minPayTokenSymbol,
        // # of decimal points to convert minimal denomination to user-facing denomination.
        coinDecimals: 6,
        // (Optional) Keplr can show the fiat value of the coin if a coingecko id is provided.
        // You can get id from https://api.coingecko.com/api/v3/coins/list if it is listed.
        // coinGeckoId: ""
      },
    ],
    // List of coin/tokens used as a fee token in this chain.
    feeCurrencies: [
      {
        // Coin denomination to be displayed to the user.
        coinDenom: payTokenSymbol,
        // Actual denom (i.e. uatom, uscrt) used by the blockchain.
        coinMinimalDenom: minPayTokenSymbol,
        // # of decimal points to convert minimal denomination to user-facing denomination.
        coinDecimals: 6,
        // (Optional) Keplr can show the fiat value of the coin if a coingecko id is provided.
        // You can get id from https://api.coingecko.com/api/v3/coins/list if it is listed.
        // coinGeckoId: ""
      },
    ],
    // (Optional) The number of the coin type.
    // This field is only used to fetch the address from ENS.
    // Ideally, it is recommended to be the same with BIP44 path's coin type.
    // However, some early chains may choose to use the Cosmos Hub BIP44 path of '118'.
    // So, this is separated to support such chains.
    coinType: 118,
    // (Optional) This is used to set the fee of the transaction.
    // If this field is not provided, Keplr extension will set the default gas price as (low: 0.01, average: 0.025, high: 0.04).
    // Currently, Keplr doesn't support dynamic calculation of the gas prices based on on-chain data.
    // Make sure that the gas prices are higher than the minimum gas prices accepted by chain validators and RPC/REST endpoint.
    gasPriceStep: {
      low: 0.03,
      average: 0.04,
      high: 0.05,
    },
  })
