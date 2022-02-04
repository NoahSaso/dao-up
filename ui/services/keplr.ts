import { Keplr } from "@keplr-wallet/types"

const mainChainId = "juno-1"
const testChainId = "uni-1"
// const chainId = process.env.NODE_ENV === "development" ? testChainId : mainChainId
export const chainId = testChainId
export const endpoint = "https://rpc.uni.junomint.com:443"

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

export const fetchWalletAddress = async (
  signer: Awaited<ReturnType<typeof getOfflineSigner>>
) => {
  if (!signer) throw new Error("No signer.")
  const [{ address }] = await signer.getAccounts()
  return address
}
