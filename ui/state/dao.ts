import { selectorFamily } from "recoil"

import { chainName } from "@/config"
import { CommonError, parseError } from "@/helpers"
import { cosmWasmClient } from "@/state"

const InvalidDAOError = `DAO cannot be found. Ensure you are providing a DAO address (not a token or wallet address) that exists on the ${chainName} chain.`

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
          error: parseError(
            error,
            {
              source: "daoConfig",
              campaign: address,
            },
            undefined,
            {
              // Give more specific error for invalid addresses.
              [CommonError.InvalidAddress]: InvalidDAOError,
            }
          ),
        }
      }
    },
})

export const validateDAO = selectorFamily<
  DAOValidationResponse,
  string | undefined
>({
  key: "validateDAO",
  get:
    (address) =>
    async ({ get }) => {
      const { config, error } = get(daoConfig(address))
      if (!config || error)
        return {
          valid: false,
          error,
        }

      if (
        config.hasOwnProperty("config") &&
        config.hasOwnProperty("gov_token") &&
        config.hasOwnProperty("staking_contract")
      )
        return {
          valid: true,
          error: null,
        }

      if (config.hasOwnProperty("unstaking_duration"))
        return {
          valid: false,
          error:
            "This looks like a staked token contract. Please provide a DAO address instead.",
        }

      return {
        valid: false,
        error: InvalidDAOError,
      }
    },
})
