import { selector } from "recoil"

import { parseError } from "@/helpers"
import { getFeeManagerConfig } from "@/services"
import { cosmWasmClient } from "@/state"

export const feeManagerConfig = selector<FeeManagerConfigResponse | null>({
  key: "feeManagerConfig",
  get: async ({ get }) => {
    const client = get(cosmWasmClient)
    if (!client) return null

    try {
      return await getFeeManagerConfig(client)
    } catch (error) {
      console.error(
        parseError(error, {
          source: "feeManagerConfig",
        })
      )
      return null
    }
  },
})
