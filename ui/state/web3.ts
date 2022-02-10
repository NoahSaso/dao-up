import {
  CosmWasmClient,
  SigningCosmWasmClient,
} from "@cosmjs/cosmwasm-stargate"
import { Keplr } from "@keplr-wallet/types"
import { atom, selector } from "recoil"

import { chainId, endpoint } from "../helpers/config"
import { localStorageEffect } from "./effects"

export const fetchKeplr = selector({
  key: "fetchKeplr",
  get: async () => {
    if (window.keplr || document.readyState === "complete") return window.keplr

    return new Promise<Keplr | undefined>((resolve) => {
      const documentStateChange = (event: Event) => {
        if (
          event.target &&
          (event.target as Document).readyState === "complete"
        ) {
          document.removeEventListener("readystatechange", documentStateChange)
          resolve(window.keplr)
        }
      }

      document.addEventListener("readystatechange", documentStateChange)
    })
  },
})

export const keplrConnectedBeforeKey = "keplrConnectedBefore"
// Change keplrKeystoreId to trigger Keplr refresh/connect.
// Set to -1 to disable connection.
export const keplrKeystoreIdAtom = atom({
  key: "keplrKeystoreId",
  default: -1,
  effects: [
    // Store whether previously connected, but restart at 0 on each page load instead of infinitely increment a value in their local storage.
    localStorageEffect(
      keplrConnectedBeforeKey,
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

    const keplr = get(fetchKeplr)
    if (!keplr) return

    try {
      await keplr.enable(chainId)
      return await keplr.getOfflineSignerAuto(chainId)
    } catch (error) {
      console.error(error)

      // If failed to connect and was previously connected, stop trying to connect automatically in the future.
      if (localStorage.getItem(keplrConnectedBeforeKey) === "true") {
        localStorage.removeItem(keplrConnectedBeforeKey)
      }
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
