import {
  CosmWasmClient,
  SigningCosmWasmClient,
} from "@cosmjs/cosmwasm-stargate"
import { atom, selector } from "recoil"

import { endpoint } from "../helpers/config"
import { getOfflineSigner } from "../services/keplr"

// Change keplrKeystoreId to trigger Keplr refresh/connect.
// Set to -1 to disable connection.
export const keplrKeystoreIdAtom = atom({
  key: "keplrKeystoreId",
  default: 0,
})

export const keplrOfflineSigner = selector({
  key: "keplrOfflineSigner",
  get: async ({ get }) => {
    // Subscribe to keystore ID changes so we propagate new wallet selection.
    const id = get(keplrKeystoreIdAtom)
    if (id < 0) return

    return await getOfflineSigner()
  },
})

export const cosmWasmClient = selector({
  key: "cosmWasmClient",
  get: () => {
    return CosmWasmClient.connect(endpoint)
  },
})

export const signedCosmWasmClient = selector({
  key: "signedCosmWasmClient",
  get: async ({ get }) => {
    const signer = get(keplrOfflineSigner)
    if (!signer) return

    return await SigningCosmWasmClient.connectWithSigner(endpoint, signer)
  },
  // DAO DAO:
  // We have to do this because of how SigningCosmWasmClient
  // will update its internal chainId
  dangerouslyAllowMutability: true,
})

export const walletAddress = selector({
  key: "walletAddress",
  get: async ({ get }) => {
    const client = get(keplrOfflineSigner)
    if (!client) return

    const [{ address }] = await client.getAccounts()
    return address
  },
})
