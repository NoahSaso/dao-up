import cn from "classnames"
import { FunctionComponent } from "react"
import { CampaignContractVersion } from "types/campaign"

import {
  Button,
  ButtonLink,
  CampaignFavoriteToggle,
  CampaignProgress,
  CampaignStatusIndicator,
  CardWrapper,
  PencilIcon,
} from "@/components"
import { prettyPrintDecimal } from "@/helpers"

interface CampaignInfoCardProps {
  campaign: Campaign
  hasGovToken: boolean
  showEdit: () => void
  className?: string
}

export const CampaignInfoCard: FunctionComponent<CampaignInfoCardProps> = ({
  campaign,
  hasGovToken,
  showEdit,
  className,
}) => {
  const {
    version,
    payToken,
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
        <div className="flex flex-row items-center gap-4">
          {/* v1 contracts cannot be edited. */}
          {hasGovToken && version !== CampaignContractVersion.v1 && (
            <Button
              className="flex justify-center items-center"
              onClick={showEdit}
              bare
            >
              <PencilIcon className="fill-green text-lg" />
            </Button>
          )}
          <CampaignFavoriteToggle campaign={campaign} />
        </div>
      </div>

      {!!daoUrl && (
        <ButtonLink href={daoUrl} className="self-stretch my-2" cardOutline>
          Visit the DAO
        </ButtonLink>
      )}

      <CampaignProgress campaign={campaign} className="mt-2 text-md" />

      <h3 className="mt-2 text-green text-3xl">
        {prettyPrintDecimal(pledged)} {payToken.symbol}
      </h3>
      <p className="text-light text-sm">
        pledged out of {goal.toLocaleString()} {payToken.symbol} goal.
      </p>
      {/* TODO: Display backers. */}
      {/* <h3 className="mt-6 text-green text-3xl">{backers.toLocaleString()}</h3>
      <p className="text-light text-sm">Backers</p> */}
    </CardWrapper>
  )
}
