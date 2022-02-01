import {
  CosmWasmClient,
  SigningCosmWasmClient,
} from "@cosmjs/cosmwasm-stargate"
import { Keplr } from "@keplr-wallet/types"
import { SetterOrUpdater } from "recoil"

const mainChainId = "juno-1"
const testChainId = "uni-1"
// const chainId = process.env.NODE_ENV === "development" ? testChainId : mainChainId
const chainId = testChainId
const endpoint = "https://rpc.uni.junomint.com:443"

let client: CosmWasmClient | undefined
let keplr: Keplr | undefined
let keplrListener: (() => void) | undefined

export const getClient = async (
  setWallet: SetterOrUpdater<{
    connected: boolean
    address: string
  }>,
  reset = false
): Promise<CosmWasmClient> => {
  if (client && !reset) return client

  keplr = await getKeplr()
  if (!keplr) throw new Error("Keplr is not available")
  await keplr.enable(chainId)

  const signer = await keplr.getOfflineSignerAuto(chainId)

  client = await SigningCosmWasmClient.connectWithSigner(endpoint, signer)

  const accounts = await signer.getAccounts()
  setWallet({
    connected: true,
    address: accounts[0].address,
  })

  // Listen for keplr keystore change
  if (keplrListener)
    window.removeEventListener("keplr_keystorechange", keplrListener)

  keplrListener = () => {
    console.log("Keplr keystore changed, reloading client.")
    client = undefined
    getClient(setWallet)
  }
  window.addEventListener("keplr_keystorechange", keplrListener)

  return client
}

const getKeplr = async (): Promise<Keplr | undefined> => {
  if (window.keplr || document.readyState === "complete") return window.keplr

  return new Promise((resolve) => {
    const documentStateChange = (event: Event) => {
      if (
        event.target &&
        (event.target as Document).readyState === "complete"
      ) {
        resolve(window.keplr)
        document.removeEventListener("readystatechange", documentStateChange)
      }
    }

    document.addEventListener("readystatechange", documentStateChange)
  })
}
