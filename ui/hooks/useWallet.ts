import { useCallback, useEffect } from "react"
import { useRecoilValue, useSetRecoilState } from "recoil"

import { keplrKeystoreIdAtom, walletAddress } from "../state/web3"

const useWallet = (autoConnect = true) => {
  const address = useRecoilValue(walletAddress)
  const setKeplrKeystoreId = useSetRecoilState(keplrKeystoreIdAtom)

  const connect = useCallback(
    () => setKeplrKeystoreId((id) => id + 1),
    [setKeplrKeystoreId]
  )

  // Attempt to connect to wallet automatically.
  // TODO: Auto popups may be interpreted as spam by some users, maybe worth requiring a button click to connect if can't connect silently.
  useEffect(() => {
    if (autoConnect) connect()
  }, [connect, autoConnect])

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

  return { walletAddress: address, connected: !!address, connect }
}

export default useWallet
