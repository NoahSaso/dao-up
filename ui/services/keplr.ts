import { Keplr } from "@keplr-wallet/types"

import { chainId } from "../helpers/config"

const get = async (): Promise<Keplr | undefined> => {
  if (window.keplr || document.readyState === "complete") return window.keplr

  return new Promise((resolve) => {
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
}

export const getOfflineSigner = async () => {
  const keplr = await get()
  if (!keplr) return

  await keplr.enable(chainId)
  return await keplr.getOfflineSignerAuto(chainId)
}
