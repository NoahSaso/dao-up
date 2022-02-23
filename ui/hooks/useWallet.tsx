import { ReactNode, useCallback, useEffect, useState } from "react"
import { useRecoilValueLoadable, useSetRecoilState } from "recoil"

import { InstallWalletMessage } from "@/components"
import { chainId } from "@/config"
import { parseError } from "@/helpers"
import { suggestChain } from "@/services"
import { fetchKeplr, keplrKeystoreIdAtom, walletAddress } from "@/state"

export const useWallet = () => {
  // Load in background.
  const { state: keplrState, contents: keplrContents } =
    useRecoilValueLoadable(fetchKeplr)
  const keplr = keplrState === "hasValue" ? keplrContents : undefined

  // Load in background.
  const { state: walletAddressState, contents: walletAddressContents } =
    useRecoilValueLoadable(walletAddress)
  const address =
    walletAddressState === "hasValue" ? walletAddressContents : undefined

  const setKeplrKeystoreId = useSetRecoilState(keplrKeystoreIdAtom)
  const [connectError, setConnectError] = useState(null as ReactNode | null)

  const connect = useCallback(async () => {
    // Set install message error if keplr not installed.
    if (!keplr) {
      setKeplrKeystoreId(-1)
      return setConnectError(<InstallWalletMessage />)
    }

    setConnectError(null)

    // Attempt to connect and update keystore accordingly.
    try {
      // Suggest chain.
      await suggestChain(keplr)

      await keplr.enable(chainId)

      // If connection succeeds, propagate client to selector dependency chain.
      setKeplrKeystoreId((id) => id + 1)
    } catch (error) {
      console.error(error)
      setConnectError(
        parseError(error, {
          source: "connect",
        })
      )

      // Set disconnected so we don't try to connect again without manual action.
      setKeplrKeystoreId(-1)
    }
  }, [setKeplrKeystoreId, setConnectError, keplr])

  // Listen for keplr keystore changes and update as needed.
  useEffect(() => {
    const keplrListener = () => {
      console.log("Keplr keystore changed, reloading client.")
      connect()
    }
    window.addEventListener("keplr_keystorechange", keplrListener)

    return () =>
      window.removeEventListener("keplr_keystorechange", keplrListener)
  }, [connect])

  return {
    loading: keplrState === "loading" || walletAddressState === "loading",
    walletAddress: address,
    connected: !!address,
    connect,
    connectError,
    installed: !!keplr,
    keplr,
  }
}
