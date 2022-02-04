import {
  CosmWasmClient,
  SigningCosmWasmClient,
} from "@cosmjs/cosmwasm-stargate"
import { atom, selector } from "recoil"

import * as Keplr from "../services/keplr"

// Increment keplrKeystoreId to trigger Keplr refresh/connect.
export const keplrKeystoreIdAtom = atom({
  key: "keplrKeystoreId",
  default: 0,
})

export const keplrOfflineSignerAtom = selector({
  key: "keplrOfflineSigner",
  get: async ({ get }) => {
    // Subscribe to keystore ID changes so we propagate new wallet selection.
    get(keplrKeystoreIdAtom)

    return await Keplr.getOfflineSigner()
  },
})

export const cosmWasmClientAtom = selector({
  key: "cosmWasmClient",
  get: () => CosmWasmClient.connect(Keplr.endpoint),
})

export const signedCosmWasmClientAtom = selector({
  key: "signedCosmWasmClient",
  get: async ({ get }) => {
    const signer = get(keplrOfflineSignerAtom)
    if (!signer) return

    return await SigningCosmWasmClient.connectWithSigner(Keplr.endpoint, signer)
  },
  // DAO DAO:
  // We have to do this because of how SigningCosmWasmClient
  // will update its internal chainId
  dangerouslyAllowMutability: true,
})

export const walletAddressAtom = selector({
  key: "walletAddress",
  get: async ({ get }) => {
    const client = get(keplrOfflineSignerAtom)
    if (!client) return

    const [{ address }] = await client.getAccounts()
    return address
  },
})
