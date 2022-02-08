import {
  CosmWasmClient,
  SigningCosmWasmClient,
} from "@cosmjs/cosmwasm-stargate"
import { atom, selector } from "recoil"

import { endpoint } from "../helpers/config"
import { getOfflineSigner } from "../services/keplr"
import { localStorageEffect } from "./effects"

// Change keplrKeystoreId to trigger Keplr refresh/connect.
// Set to -1 to disable connection.
// TODO: Figure out how to unset localStore if they reject in the future.
const keplrKeystoreIdKey = "keplrKeystoreId"
export const keplrKeystoreIdAtom = atom({
  key: keplrKeystoreIdKey,
  default: -1,
  effects: [
    // Store whether previously connected, but restart at 0 on each page load instead of infinitely increment a value in their local storage.
    localStorageEffect(
      keplrKeystoreIdKey,
      (id) => (id > -1).toString(),
      (saved) => (saved === "true" ? 0 : -1)
    ),
  ],
})

export const keplrOfflineSigner = selector({
  key: "keplrOfflineSigner",
  get: async ({ get }) => {
    // Subscribe to keystore ID changes so we propagate new wallet selection.
    const id = get(keplrKeystoreIdAtom)
    if (id < 0) return

    try {
      return await getOfflineSigner()
    } catch (error) {
      console.error(error)
      // TODO: Handle error.
    }
  },
})

export const cosmWasmClient = selector({
  key: "cosmWasmClient",
  get: async () => {
    try {
      return await CosmWasmClient.connect(endpoint)
    } catch (error) {
      console.error(error)
      // TODO: Display error.
    }
  },
})

export const signedCosmWasmClient = selector({
  key: "signedCosmWasmClient",
  get: async ({ get }) => {
    const signer = get(keplrOfflineSigner)
    if (!signer) return

    try {
      return await SigningCosmWasmClient.connectWithSigner(endpoint, signer)
    } catch (error) {
      console.error(error)
      // TODO: Display error.
    }
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
