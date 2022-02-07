import { useCallback, useEffect } from "react"
import { useRecoilValue, useSetRecoilState } from "recoil"

import { keplrKeystoreIdAtom, walletAddress } from "../state/web3"

const useWallet = () => {
  const address = useRecoilValue(walletAddress)
  const setKeplrKeystoreId = useSetRecoilState(keplrKeystoreIdAtom)

  const connect = useCallback(
    () => setKeplrKeystoreId((id) => id + 1),
    [setKeplrKeystoreId]
  )

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
