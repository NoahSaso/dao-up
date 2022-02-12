import cn from "classnames"
import { FC } from "react"

import { payTokenSymbol } from "../helpers/config"
import { prettyPrintDecimal } from "../helpers/number"
import {
  ButtonLink,
  CampaignFavoriteToggle,
  CampaignProgress,
  CampaignStatus,
} from "."

interface CampaignStateCardProps {
  campaign: Campaign
}

export const CampaignStateCard: FC<CampaignStateCardProps> = ({ campaign }) => {
  const {
    pledged,
    goal,
    dao: { url: daoUrl },
  } = campaign

  return (
    <div className="bg-card rounded-3xl p-8 flex flex-col items-start max-w-full relative">
      <div className="flex flex-row justify-between items-center self-stretch mb-4">
        <CampaignStatus campaign={campaign} />
        <CampaignFavoriteToggle campaign={campaign} />
      </div>

      {!!daoUrl && (
        <ButtonLink href={daoUrl} className="self-stretch my-2" cardOutline>
          Visit the DAO
        </ButtonLink>
      )}

      <CampaignProgress campaign={campaign} className="mt-2 text-md" />

      <h3 className="mt-2 text-green text-3xl">
        {prettyPrintDecimal(pledged)} {payTokenSymbol}
      </h3>
      <p className="text-light text-sm">
        pledged out of {goal.toLocaleString()} {payTokenSymbol} goal.
      </p>
      {/* TODO: Display backers. */}
      {/* <h3 className="mt-6 text-green text-3xl">{backers.toLocaleString()}</h3>
      <p className="text-light text-sm">Backers</p> */}
    </div>
  )
}
