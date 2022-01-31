import { CosmWasmClient } from "@cosmjs/cosmwasm-stargate"
import { Keplr } from "@keplr-wallet/types"

let client: CosmWasmClient | null = null
export const getClient = async () => {
  if (client == null) {
    client = await CosmWasmClient.connect("https://rpc.uni.junomint.com:443")
  }
  return client
}

export const getKeplr = async (): Promise<Keplr | undefined> => {
  if (window.keplr) return window.keplr

  if (document.readyState === "complete") return window.keplr

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

export const connect = async () => {}
