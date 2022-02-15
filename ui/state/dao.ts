import { selectorFamily } from "recoil"

import { chainName } from "@/config"
import { parseError } from "@/helpers"
import { cosmWasmClient } from "@/state"
import { CommonError } from "@/types"

export const daoConfig = selectorFamily<DAOConfigResponse, string | undefined>({
  key: "daoConfig",
  get:
    (address) =>
    async ({ get }) => {
      const client = get(cosmWasmClient)

      if (!address)
        return {
          config: null,
          error: CommonError.InvalidAddress,
        }
      if (!client)
        return {
          config: null,
          error: CommonError.GetClientFailed,
        }

      try {
        const config = await client.queryContractSmart(address, {
          get_config: {},
        })

        return { config, error: null }
      } catch (error) {
        console.error(error)
        return {
          config: null,
          error: parseError(error, {
            // Give more specific error for invalid addresses.
            [CommonError.InvalidAddress]: `DAO cannot be found. Ensure you are providing a DAO address (not a token or wallet address) that exists on the ${chainName} chain.`,
          }),
        }
      }
    },
})
