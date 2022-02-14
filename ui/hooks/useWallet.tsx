import { ReactNode, useCallback, useEffect, useState } from "react"
import { useRecoilValue, useSetRecoilState } from "recoil"

import { InstallWalletMessage } from "../components"
import { chainId } from "../config"
import { fetchKeplr, keplrKeystoreIdAtom, walletAddress } from "../state"

export const useWallet = () => {
  const keplr = useRecoilValue(fetchKeplr)
  const address = useRecoilValue(walletAddress)
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
      await keplr.enable(chainId)
      // If connection succeeds, propagate client to selector dependency chain.
      setKeplrKeystoreId((id) => id + 1)
    } catch (error) {
      // Otherwise set disconnected so we don't try to connect again without manual action.
      setKeplrKeystoreId(-1)

      // Ignore rejected requests since the user knows they rejected.
      if (!(error instanceof Error) || error.message !== "Request rejected") {
        // TODO: Handle non-rejection errors better.
        console.log(error)
        setConnectError(`${error}`)
      }
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
    walletAddress: address,
    connected: !!address,
    connect,
    connectError,
    installed: !!keplr,
    keplr,
  }
}
