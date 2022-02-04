import { useAtom } from "jotai"
import type { NextPage } from "next"

import {
  AllCampaignsCard,
  CenteredColumn,
  Input,
  ResponsiveDecoration,
} from "../components"
import useWallet from "../hooks/useWallet"
import {
  campaignFilterAtom,
  filteredVisibleCampaignsAtom,
} from "../state/campaigns"

const Campaigns: NextPage = () => {
  useWallet()
  const [filter, setFilter] = useAtom(campaignFilterAtom)
  const [campaigns] = useAtom(filteredVisibleCampaignsAtom)

  return (
    <>
      <ResponsiveDecoration
        name="campaigns_orange_blur.png"
        width={406}
        height={626}
        className="top-0 right-0 opacity-70"
      />

      <CenteredColumn className="pt-5">
        <h1 className="font-semibold text-4xl">All Campaigns</h1>

        <Input
          containerClassName="mt-4 mb-6"
          className="w-full"
          type="text"
          placeholder="Search all campaigns..."
          value={filter}
          onChange={({ target: { value } }) => setFilter(value)}
        />

        {campaigns.length === 0 && (
          <p className="text-orange">No campaigns found.</p>
        )}

        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          {campaigns.map((campaign) => (
            <AllCampaignsCard key={campaign.address} campaign={campaign} />
          ))}
        </div>
      </CenteredColumn>
    </>
  )
}

export default Campaigns
