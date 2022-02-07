import fuzzysort from "fuzzysort"
import { useEffect, useState } from "react"
import { useRecoilValue, waitForAll } from "recoil"

import { campaignsFromResponses } from "../services/campaigns"
import { escrowContractAddresses, fetchCampaign } from "../state/campaigns"

let campaignsFilterId = 0
export const useGetCampaigns = (filter?: string, includeHidden = false) => {
  const { addresses, error: escrowContractAddressesError } = useRecoilValue(
    escrowContractAddresses
  )
  const campaignResponses = useRecoilValue(
    waitForAll(addresses.map((address) => fetchCampaign(address)))
  )

  const [campaigns, setCampaigns] = useState(
    campaignsFromResponses(campaignResponses, includeHidden)
  )
  const [filtering, setFiltering] = useState(false)
  const [filterError, setFilterError] = useState(null as string | null)

  useEffect(() => {
    const updateCampaigns = async () => {
      if (!filter)
        return setCampaigns(
          campaignsFromResponses(campaignResponses, includeHidden)
        )

      setFiltering(true)
      setFilterError(null)

      try {
        let id = ++campaignsFilterId

        const relevantCampaigns = campaignsFromResponses(
          campaignResponses,
          includeHidden
        )

        const filtered = (
          await fuzzysort.goAsync(filter, relevantCampaigns, {
            keys: ["name", "description"],
            allowTypo: true,
          })
        ).map(({ obj }) => obj)

        // If another filter has been kicked off, ignore this one.
        if (campaignsFilterId !== id) return

        setCampaigns(filtered)
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
  }, [campaignResponses, filter, setCampaigns, setFiltering, includeHidden])

  const firstError =
    escrowContractAddressesError ??
    filterError ??
    campaignResponses.find(({ error }) => !!error)?.error ??
    null

  return { filtering, campaigns, error: firstError }
}
