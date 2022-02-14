import { Keplr } from "@keplr-wallet/types"

import { chainId } from "@/config"

export const suggestToken = async (keplr: Keplr, address: string) =>
  keplr
    .suggestToken(chainId, address)
    .then(() => true)
    .catch(() => false)
