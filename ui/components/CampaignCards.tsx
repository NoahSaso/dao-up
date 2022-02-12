import cn from "classnames"
import Link from "next/link"
import { FC, PropsWithChildren } from "react"
import ReactMarkdown from "react-markdown"
import { useRecoilValueLoadable } from "recoil"

import { prettyPrintDecimal } from "../helpers/number"
import { campaignWalletBalance } from "../state/campaigns"
import {
  CampaignFavoriteToggle,
  CampaignImage,
  CampaignProgress,
  CampaignStatus,
  Loader,
} from "."

interface CampaignCardWrapperProps extends PropsWithChildren<CampaignProps> {
  contentClassName?: string
}
const CampaignCardWrapper: FC<CampaignCardWrapperProps> = ({
  campaign,
  className,
  children,
  contentClassName,
}) => {
  return (
    <div
      className={cn(
        "bg-card rounded-3xl",
        "border border-card hover:border-green",
        "transition",
        "cursor-pointer",
        "relative",
        className
      )}
    >
      <CampaignFavoriteToggle
        campaign={campaign}
        className="absolute top-4 right-4"
      />
      <Link href={`/campaign/${campaign.address}`}>
        {/* The campaigns list splits into two columns at lg, and these cards become narrow again, so reduce padding and then increase again. */}
        <a className="flex flex-col justify-start items-stretch sm:flex-row p-6 sm:p-8 lg:p-6 2xl:p-8">
          <CampaignImage imageUrl={campaign.imageUrl} />
          <div
            className={cn(
              "flex flex-col items-stretch flex-1",
              "ml-0 mt-4 sm:ml-5 sm:mt-0",
              "overflow-hidden",
              contentClassName
            )}
          >
            <h2 className="font-medium text-xl pr-6 text-ellipsis overflow-hidden whitespace-nowrap break-words">
              {campaign.name}
            </h2>
            {children}
          </div>
        </a>
      </Link>
    </div>
  )
}

export const AllCampaignsCard: FC<CampaignProps> = ({
  campaign,
  className,
}) => (
  <CampaignCardWrapper campaign={campaign} className={className}>
    <CampaignProgress
      campaign={campaign}
      className="mt-2"
      showPledged
      hidePercent
    />
    <ReactMarkdown
      children={campaign.description}
      linkTarget="_blank"
      className="mt-2 line-clamp-2"
    />
  </CampaignCardWrapper>
)

export const CreatorCampaignCard: FC<CampaignProps> = ({
  campaign,
  className,
}) => (
  <CampaignCardWrapper campaign={campaign} className={className}>
    <CampaignStatus campaign={campaign} />

    <CampaignProgress campaign={campaign} className="mt-4" showPledged />
  </CampaignCardWrapper>
)

export const FavoriteCampaignCard: FC<CampaignProps> = ({
  campaign,
  className,
}) => {
  const {
    fundingToken: { symbol, supply },
  } = campaign

  const { state, contents } = useRecoilValueLoadable(
    campaignWalletBalance(campaign?.address)
  )
  const balance = state === "hasValue" ? contents.balance : undefined
  const balancePercent = balance && supply && (100 * balance) / supply

  return (
    <CampaignCardWrapper campaign={campaign} className={className}>
      <CampaignStatus campaign={campaign} className="shrink-0" />
      <CampaignProgress campaign={campaign} thin />

      <div className="flex flex-row items-end gap-2 mt-5">
        {typeof balance === "number" ? (
          <>
            <p className="text-green">
              <span className="text-xl font-medium mr-1">
                {prettyPrintDecimal(balance)}
              </span>
              <span className="text-base font-light">{symbol}</span>
            </p>
            <p className="text-placeholder font-sm text-right">
              {prettyPrintDecimal(balancePercent, 2)}% of total supply
            </p>
          </>
        ) : (
          <Loader size={32} />
        )}
      </div>
    </CampaignCardWrapper>
  )
}
