import { ReactNode, useCallback, useEffect, useState } from "react"
import { useRecoilValue, useSetRecoilState } from "recoil"

import { getOfflineSigner } from "../services/keplr"
import { keplrKeystoreIdAtom, walletAddress } from "../state/web3"

export const useWallet = () => {
  const address = useRecoilValue(walletAddress)
  const setKeplrKeystoreId = useSetRecoilState(keplrKeystoreIdAtom)
  const [connectError, setConnectError] = useState(null as ReactNode | null)

  const connect = useCallback(async () => {
    setConnectError(null)

    let errorSet = false
    let signer
    // Attempt to connect and update keystore accordingly.
    try {
      signer = await getOfflineSigner()
    } catch (error) {
      // Ignore rejected requests since the user knows they rejected.
      if (!(error instanceof Error) || error.message !== "Request rejected") {
        // TODO: Handle non-rejection errors better.
        console.log(error)
        setConnectError(`${error}`)
        errorSet = true
      }
    }

    // If connection succeeds, propagate client to selector dependency chain.
    if (signer) setKeplrKeystoreId((id) => id + 1)
    // Otherwise set disconnected so we don't try to connect again without manual action.
    else {
      setKeplrKeystoreId(-1)
      if (!errorSet)
        setConnectError(
          <>
            Install the{" "}
            <a
              href="https://www.keplr.app"
              target="_blank"
              rel="noopener noreferrer"
              className="inline underline text-green hover:opacity-70"
            >
              Keplr browser extension
            </a>{" "}
            on Google Chrome to interact with DAO Up!
          </>
        )
    }
  }, [setKeplrKeystoreId, setConnectError])

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

  return { walletAddress: address, connected: !!address, connect, connectError }
}
