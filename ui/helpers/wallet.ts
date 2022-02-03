import { useCallback, useEffect } from "react"
import { useRecoilState } from "recoil"

import { walletState } from "../services/state"
import * as Web3Service from "../services/web3"

export const useWallet = () => {
  const [wallet, setWallet] = useRecoilState(walletState)

  const connect = useCallback(
    () => Web3Service.loadClient(setWallet),
    [setWallet]
  )

  // Attempt to connect to wallet automatically.
  // TODO: Auto popups may be interpreted as spam by some users, maybe worth requiring a button click to connect if can't connect silently.
  useEffect(() => {
    connect().catch(console.error)
  }, [connect])

  return { wallet, setWallet, connect }
}
