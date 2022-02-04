import {
  CosmWasmClient,
  SigningCosmWasmClient,
} from "@cosmjs/cosmwasm-stargate"
import { atom } from "jotai"

import * as Keplr from "../services/keplr"

export const keplrKeystoreIdAtom = atom(0)
// Increment keplrKeystoreId to trigger Keplr refresh/connect.
export const refreshKeplrAtom = atom(
  (get) => get(keplrKeystoreIdAtom),
  (get, set) => set(keplrKeystoreIdAtom, get(keplrKeystoreIdAtom) + 1)
)

export const keplrOfflineSignerAtom = atom(async (get) => {
  // Subscribe to keystore ID changes so we propagate new wallet selection.
  get(keplrKeystoreIdAtom)

  return await Keplr.getOfflineSigner()
})

export const cosmWasmClientAtom = atom(() =>
  CosmWasmClient.connect(Keplr.endpoint)
)

export const signedCosmWasmClientAtom = atom(async (get) => {
  const signer = get(keplrOfflineSignerAtom)
  if (!signer) return

  return await SigningCosmWasmClient.connectWithSigner(Keplr.endpoint, signer)
})

export const walletAddressAtom = atom(async (get) => {
  const client = get(keplrOfflineSignerAtom)
  if (!client) return

  const [{ address }] = await client.getAccounts()
  return address
})
