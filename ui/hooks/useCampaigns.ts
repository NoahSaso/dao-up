import { useEffect, useState } from "react"
import { useRecoilValue, waitForAll } from "recoil"

import { campaignsFromResponses, filterCampaigns } from "../services/campaigns"
import { fetchCampaign, pagedEscrowContractAddresses } from "../state/campaigns"

interface UseCampaignsParameters {
  filter?: string
  includeHidden?: boolean
  includePending?: boolean
  page?: number | null
  size?: number
}

let campaignsFilterId = 0
export const useCampaigns = ({
  filter,
  includeHidden = false,
  includePending = true,
  page = 1,
  size = 20,
}: UseCampaignsParameters) => {
  const { addresses, error: escrowContractAddressesError } = useRecoilValue(
    pagedEscrowContractAddresses({ page, size })
  )

  const campaignResponses = useRecoilValue(
    waitForAll(addresses.map((address) => fetchCampaign(address)))
  )

  const [campaigns, setCampaigns] = useState(
    campaignsFromResponses(campaignResponses, includeHidden, includePending)
  )
  const [filtering, setFiltering] = useState(false)
  const [filterError, setFilterError] = useState(null as string | null)

  useEffect(() => {
    const updateCampaigns = async () => {
      setFiltering(true)
      setFilterError(null)

      let relevantCampaigns = campaignsFromResponses(
        campaignResponses,
        includeHidden,
        includePending
      )

      try {
        let id = ++campaignsFilterId

        relevantCampaigns = await filterCampaigns(relevantCampaigns, filter)

        // If another filter has been kicked off, ignore this one.
        if (campaignsFilterId !== id) return

        setCampaigns(relevantCampaigns)
      } catch (error) {
        console.error(error)
        // TODO: Display error.
        setFilterError(`${error}`)
      } finally {
        setFiltering(false)
      }
    }

    // Debounce filter input (wait 350ms before refiltering campaigns).
    const timer = setTimeout(() => updateCampaigns(), 350)
    return () => clearTimeout(timer)
  }, [
    campaignResponses,
    filter,
    setCampaigns,
    setFiltering,
    includeHidden,
    includePending,
  ])

  const firstError =
    escrowContractAddressesError ??
    filterError ??
    campaignResponses.find(({ error }) => !!error)?.error ??
    null

  return { filtering, campaigns, error: firstError }
}
