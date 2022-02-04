import { useAtom } from "jotai"
import { useEffect } from "react"

import { refreshKeplrAtom, walletAddressAtom } from "../state/web3"

const useWallet = () => {
  const [, connect] = useAtom(refreshKeplrAtom)
  const [walletAddress] = useAtom(walletAddressAtom)

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

  // Attempt to connect to wallet automatically.
  // TODO: Auto popups may be interpreted as spam by some users, maybe worth requiring a button click to connect if can't connect silently.
  useEffect(() => {
    connect()
  }, [connect])

  return { walletAddress, connect }
}

export default useWallet
