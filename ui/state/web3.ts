import {
  CosmWasmClient,
  SigningCosmWasmClient,
} from "@cosmjs/cosmwasm-stargate"
import { atom, selector } from "recoil"

import * as Keplr from "../services/keplr"

// Increment keplrKeystoreId to trigger Keplr refresh/connect.
export const keplrKeystoreId = atom({
  key: "keplrKeystoreId",
  default: 0,
})

export const keplrOfflineSigner = selector({
  key: "keplrOfflineSigner",
  get: async ({ get }) => {
    // Subscribe to keystore ID changes so we propagate new wallet selection.
    get(keplrKeystoreId)

    return await Keplr.getOfflineSigner()
  },
})

export const cosmWasmClient = selector({
  key: "cosmWasmClient",
  get: () => {
    // TODO: remove
    return true
    // return CosmWasmClient.connect(Keplr.endpoint)
  },
})

export const signedCosmWasmClient = selector({
  key: "signedCosmWasmClient",
  get: async ({ get }) => {
    // TODO: remove
    return true

    // const signer = get(keplrOfflineSigner)
    // if (!signer) return

    // return await SigningCosmWasmClient.connectWithSigner(Keplr.endpoint, signer)
  },
  // DAO DAO:
  // We have to do this because of how SigningCosmWasmClient
  // will update its internal chainId
  dangerouslyAllowMutability: true,
})

export const walletAddress = selector({
  key: "walletAddress",
  get: async ({ get }) => {
    // TODO: remove
    return "junowallet1"

    // const client = get(keplrOfflineSigner)
    // if (!client) return

    // const [{ address }] = await client.getAccounts()
    // return address
  },
})
