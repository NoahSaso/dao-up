import {
  CosmWasmClient,
  SigningCosmWasmClient,
} from "@cosmjs/cosmwasm-stargate"
import { Keplr } from "@keplr-wallet/types"
import { SetterOrUpdater } from "recoil"

type SetWalletFunction = SetterOrUpdater<WalletState>

const mainChainId = "juno-1"
const testChainId = "uni-1"
// const chainId = process.env.NODE_ENV === "development" ? testChainId : mainChainId
const chainId = testChainId
const endpoint = "https://rpc.uni.junomint.com:443"

let client: CosmWasmClient | undefined
let keplr: Keplr | undefined
let keplrListener: (() => void) | undefined

export const loadClient = async (
  setWallet: SetWalletFunction,
  reset = false,
  silent = false
): Promise<CosmWasmClient> => {
  if (process.env.NODE_ENV === "development") {
    if (!silent) {
      // simulate loading
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }

    setWallet({
      connected: true,
      address: "junowallet1",
    })

    throw new Error("Development.")
  }

  if (client && !reset) return client

  await loadKeplr()
  if (!keplr) throw new Error("Keplr is not available")
  if (!silent) await keplr.enable(chainId)

  const signer = await keplr.getOfflineSignerAuto(chainId)

  try {
    client = await SigningCosmWasmClient.connectWithSigner(endpoint, signer)
  } catch (err) {
    console.error(err)
    // TODO: Display error message.
    throw new Error("Failed to connect.")
  }

  const accounts = await signer.getAccounts()
  setWallet({
    connected: true,
    address: accounts[0].address,
  })

  // Listen for keplr keystore change
  if (keplrListener)
    window.removeEventListener("keplr_keystorechange", keplrListener)

  // TODO: setWallet comes from the page that first connected, so can it still be used if this event occurs on another page?
  keplrListener = () => {
    console.log("Keplr keystore changed, reloading client.")
    client = undefined
    loadClient(setWallet)
  }
  window.addEventListener("keplr_keystorechange", keplrListener)

  return client
}

const loadKeplr = async (): Promise<Keplr | undefined> => {
  const saveAndReturnKeplr = (newKeplr: Keplr | undefined) => {
    keplr = newKeplr
    return keplr
  }

  if (window.keplr || document.readyState === "complete")
    return saveAndReturnKeplr(window.keplr)

  return new Promise((resolve) => {
    const documentStateChange = (event: Event) => {
      if (
        event.target &&
        (event.target as Document).readyState === "complete"
      ) {
        document.removeEventListener("readystatechange", documentStateChange)
        resolve(saveAndReturnKeplr(window.keplr))
      }
    }

    document.addEventListener("readystatechange", documentStateChange)
  })
}
