import { Keplr } from "@keplr-wallet/types"
import { FC } from "react"

import { chainId } from "../helpers/config"

export const suggestToken = async (keplr: Keplr, address: string) =>
  keplr
    .suggestToken(chainId, address)
    .then(() => true)
    .catch(() => false)

export const InstallWalletMessage: FC = () => (
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
