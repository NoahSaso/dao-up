import { ReactNode, useCallback, useEffect, useState } from "react"
import { useRecoilValue, useSetRecoilState } from "recoil"

import { chainId } from "../helpers/config"
import { InstallWalletMessage } from "../services/keplr"
import { fetchKeplr, keplrKeystoreIdAtom, walletAddress } from "../state/web3"

export const useWallet = () => {
  const keplr = useRecoilValue(fetchKeplr)
  const address = useRecoilValue(walletAddress)
  const setKeplrKeystoreId = useSetRecoilState(keplrKeystoreIdAtom)
  const [connectError, setConnectError] = useState(null as ReactNode | null)

  const connect = useCallback(async () => {
    setConnectError(null)

    let shouldSetInstallError = true
    let enabled = false
    // Attempt to connect and update keystore accordingly.
    try {
      if (keplr) {
        await keplr.enable(chainId)
        enabled = true
      }
    } catch (error) {
      // Ignore rejected requests since the user knows they rejected.
      shouldSetInstallError = false
      if (!(error instanceof Error) || error.message !== "Request rejected") {
        // TODO: Handle non-rejection errors better.
        console.log(error)
        setConnectError(`${error}`)
      }
    }

    // If connection succeeds, propagate client to selector dependency chain.
    if (enabled) setKeplrKeystoreId((id) => id + 1)
    // Otherwise set disconnected so we don't try to connect again without manual action.
    else {
      setKeplrKeystoreId(-1)
      if (shouldSetInstallError) setConnectError(<InstallWalletMessage />)
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
