import cn from "classnames"
import Link from "next/link"
import { FC } from "react"

import { toMaxDecimals } from "../helpers/number"

interface CampaignProps {
  campaign: Campaign
  className?: string
}

export const CampaignStatus: FC<CampaignProps> = ({
  campaign: { open, pledged, goal },
  className,
}) => {
  const funded = pledged >= goal

  return (
    <div className={cn("flex flex-row items-center", className)}>
      <div
        className={cn("w-2.5 h-2.5 rounded-full", {
          "bg-green": open && !funded,
          "bg-orange": open && funded,
          "bg-placeholder": !open,
        })}
      ></div>
      <p className="ml-1 text-sm">
        {open && !funded
          ? "Active"
          : open && funded
          ? "Goal Reached"
          : "Closed"}
      </p>
    </div>
  )
}

export const CampaignProgress: FC<CampaignProps> = ({
  campaign: { open, pledged, goal },
  className,
}) => {
  const fundedPercent = (100 * pledged) / goal

  return (
    <div
      className={cn(
        "bg-dark overflow-hidden w-full h-[12px] rounded-full",
        className
      )}
    >
      {open ? (
        <div
          className="bg-green h-full"
          style={{
            width: `${Math.min(fundedPercent, 100).toFixed(0)}%`,
          }}
        ></div>
      ) : (
        <div className="bg-placeholder h-full w-full"></div>
      )}
    </div>
  )
}

export const AllCampaignsCard: FC<CampaignProps> = ({
  campaign: { id, name, pledged, asset, goal, description },
  className,
}) => (
  <Link href={`/campaign/${id}`}>
    <a
      className={cn(
        "flex flex-row justify-start items-stretch",
        "bg-card p-10 rounded-3xl",
        "border border-card hover:border-green",
        "transition",
        "cursor-pointer",
        className
      )}
    >
      <div className="bg-green w-[135px] h-[135px]"></div>
      <div className="ml-5">
        <h2 className="font-medium text-xl">{name}</h2>
        <p className="text-lg text-green">
          {pledged.toLocaleString()} {asset} pledged
        </p>
        <p className="text-lg text-white">
          {toMaxDecimals((100 * pledged) / goal, 0)}% funded
        </p>
        <p className="mt-5">{description}</p>
      </div>
    </a>
  </Link>
)

export const CreatorCampaignCard: FC<CampaignProps> = ({
  campaign,
  className,
}) => {
  const { id, name, pledged, asset, goal } = campaign

  return (
    <Link href={`/campaign/${id}`}>
      <a
        className={cn(
          "flex flex-row justify-start items-stretch",
          "bg-card p-10 rounded-3xl",
          "border border-card hover:border-green",
          "transition",
          "cursor-pointer",
          className
        )}
      >
        <div className="bg-green w-[135px] h-[135px]"></div>
        <div className="ml-5">
          <h2 className="font-medium text-xl">{name}</h2>
          <CampaignStatus campaign={campaign} className="" />

          <p className="text-xl text-green font-medium mt-8">
            {toMaxDecimals((100 * pledged) / goal, 0)}%{" "}
            <span className="text-base font-light">Funded</span>
          </p>
          <p className="text-placeholder">
            {pledged.toLocaleString()} {asset} pledged
          </p>
        </div>
      </a>
    </Link>
  )
}

export const ContributorCampaignCard: FC<CampaignProps> = ({
  campaign,
  className,
}) => {
  const { id, name, pledged, goal, supply } = campaign
  const funded = pledged >= goal

  const userTokens = 200

  return (
    <Link href={`/campaign/${id}`}>
      <a
        className={cn(
          "flex flex-row justify-start items-center",
          "bg-card p-10 rounded-3xl",
          "border border-card hover:border-green",
          "transition",
          "cursor-pointer",
          className
        )}
      >
        <div className="bg-green w-[135px] h-[135px] shrink-0"></div>
        <div className="ml-5">
          <h2 className="font-medium text-xl">{name}</h2>
          <div
            className={cn(
              "font-light text-white",
              "flex flex-col sm:flex-row sm:flex-wrap",
              "mt-2 sm:mt-0"
            )}
          >
            <p className="sm:mr-3">
              {toMaxDecimals((100 * pledged) / goal, 0)}% funded
            </p>
            <CampaignStatus campaign={campaign} className="shrink-0" />
          </div>

          <div className="flex flex-row items-end text-green mt-8">
            <p className="text-xl font-medium">{userTokens.toLocaleString()}</p>
            <p className="text-base font-light ml-1">Tokens</p>
          </div>
          <p className="text-placeholder">
            {toMaxDecimals((100 * userTokens) / supply, 2)}% of total supply
          </p>
        </div>
      </a>
    </Link>
  )
}
