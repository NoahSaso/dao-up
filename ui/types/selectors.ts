type AsyncSelectorResponse<T> = T & {
  error: string | null
}

declare global {
  interface PageInfo {
    startIndex: number
    endIndex: number
    // So this interface can be used as a Recoil selectorFamily argument type...
    [key: string]: number
  }

  type CampaignStateResponse = AsyncSelectorResponse<{
    state: CampaignDumpStateResponse | null
  }>

  type CampaignResponse = AsyncSelectorResponse<{ campaign: Campaign | null }>
  type CampaignsResponse = AsyncSelectorResponse<{
    campaigns: Campaign[] | null
    hasMore: boolean
  }>

  type TokenInfoSelectorResponse = AsyncSelectorResponse<{
    info: TokenInfoResponse | null
  }>

  type TokenBalanceResponse = AsyncSelectorResponse<{
    balance: number | null
  }>

  type EscrowContractAddressesResponse = AsyncSelectorResponse<{
    addresses: string[]
  }>

  type CampaignActionsResponse = AsyncSelectorResponse<{
    actions: CampaignAction[] | null
  }>

  type DAOConfigResponse = AsyncSelectorResponse<{ config: any | null }>
  type DAOValidationResponse = AsyncSelectorResponse<{ valid: boolean }>
}

export {}
