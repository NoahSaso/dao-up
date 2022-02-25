import cn from "classnames"
import { FunctionComponent } from "react"

import {
  ButtonLink,
  CampaignFavoriteToggle,
  CampaignProgress,
  CampaignStatusIndicator,
  CardWrapper,
} from "@/components"
import { payTokenSymbol } from "@/config"
import { prettyPrintDecimal } from "@/helpers"

interface CampaignInfoCardProps {
  campaign: Campaign
  className?: string
}

export const CampaignInfoCard: FunctionComponent<CampaignInfoCardProps> = ({
  campaign,
  className,
}) => {
  const {
    pledged,
    goal,
    dao: { url: daoUrl },
  } = campaign

  return (
    <CardWrapper
      className={cn("flex flex-col items-start max-w-full relative", className)}
    >
      <div className="flex flex-row justify-between items-center self-stretch mb-4">
        <CampaignStatusIndicator campaign={campaign} />
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
    </CardWrapper>
  )
}
