import { CosmWasmClient } from "@cosmjs/cosmwasm-stargate"

let client: CosmWasmClient | null = null
export const getClient = async () => {
  if (client == null) {
    client = await CosmWasmClient.connect("https://rpc.uni.junomint.com:443")
  }
  return client
}
