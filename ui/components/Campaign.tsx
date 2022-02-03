import cn from "classnames"
import Link from "next/link"
import { FC, PropsWithChildren } from "react"

import { prettyPrintDecimal } from "../helpers/number"
import { Color, Status } from "../types"
import { StatusIndicator } from "."

interface CampaignProps {
  campaign: Campaign
  className?: string
}

export const CampaignStatus: FC<CampaignProps> = ({
  campaign: { status, pledged, goal },
  className,
}) => {
  const funded = pledged >= goal
  const open = status === Status.Active

  const color =
    open && !funded
      ? Color.Green
      : open && funded
      ? Color.Orange
      : // default, and !open
        Color.Placeholder
  const label =
    open && !funded ? "Active" : open && funded ? "Goal Reached" : "Closed"

  return (
    <StatusIndicator
      color={color}
      label={label}
      containerClassName={className}
    />
  )
}

export const CampaignProgress: FC<CampaignProps> = ({
  campaign: { status, pledged, goal },
  className,
}) => {
  const fundedPercent = (100 * pledged) / goal
  const open = status === Status.Active

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

const CampaignCardWrapper: FC<PropsWithChildren<CampaignProps>> = ({
  campaign: { address },
  className,
  children,
}) => (
  <Link href={`/campaign/${address}`}>
    <a
      className={cn(
        "flex flex-col justify-start items-stretch xs:flex-row",
        "bg-card rounded-3xl p-6 sm:p-10",
        "border border-card hover:border-green",
        "transition",
        "cursor-pointer",
        className
      )}
    >
      {children}
    </a>
  </Link>
)

interface CampaignImageProps extends CampaignProps {
  size?: number
}
export const CampaignImage: FC<CampaignImageProps> = ({
  campaign: { imageUrl },
  className,
  size = 135,
}) => (
  <div
    className={cn("bg-green shrink-0", className)}
    style={{ width: size, height: size }}
  >
    {/* eslint-disable-next-line @next/next/no-img-element */}
    {!!imageUrl && <img src={imageUrl} alt="image" className="w-full h-full" />}
  </div>
)

export const AllCampaignsCard: FC<CampaignProps> = ({
  campaign,
  className,
}) => {
  const { name, description, pledged, tokenSymbol, goal } = campaign

  return (
    <CampaignCardWrapper campaign={campaign} className={className}>
      <CampaignImage campaign={campaign} />
      <div className="ml-0 mt-4 xs:ml-5 xs:mt-0">
        <h2 className="font-medium text-xl">{name}</h2>
        <p className="sm:text-lg text-green">
          {pledged.toLocaleString()} {tokenSymbol} pledged
        </p>
        <p className="sm:text-lg text-white">
          {prettyPrintDecimal((100 * pledged) / goal, 0)}% funded
        </p>
        <p className="mt-5">{description}</p>
      </div>
    </CampaignCardWrapper>
  )
}

export const CreatorCampaignCard: FC<CampaignProps> = ({
  campaign,
  className,
}) => {
  const { name, pledged, tokenSymbol, goal } = campaign

  return (
    <CampaignCardWrapper campaign={campaign} className={className}>
      <CampaignImage campaign={campaign} />
      <div className="ml-5">
        <h2 className="font-medium text-xl">{name}</h2>
        <CampaignStatus campaign={campaign} className="" />

        <p className="text-xl text-green font-medium mt-8">
          {prettyPrintDecimal((100 * pledged) / goal, 0)}%{" "}
          <span className="text-base font-light">Funded</span>
        </p>
        <p className="text-placeholder">
          {pledged.toLocaleString()} {tokenSymbol} pledged
        </p>
      </div>
    </CampaignCardWrapper>
  )
}

export const ContributorCampaignCard: FC<CampaignProps> = ({
  campaign,
  className,
}) => {
  const { name, pledged, goal, supply } = campaign

  const userTokens = 200

  return (
    <CampaignCardWrapper campaign={campaign} className={className}>
      <CampaignImage campaign={campaign} />
      <div className="ml-5">
        <h2 className="font-medium text-xl">{name}</h2>
        <div
          className={cn(
            "font-light text-white",
            "flex flex-col xs:flex-row xs:flex-wrap",
            "mt-2 xs:mt-0"
          )}
        >
          <p className="xs:mr-3">
            {prettyPrintDecimal((100 * pledged) / goal, 0)}% funded
          </p>
          <CampaignStatus campaign={campaign} className="shrink-0" />
        </div>

        <div className="flex flex-row items-end text-green mt-8">
          <p className="text-xl font-medium">{userTokens.toLocaleString()}</p>
          <p className="text-base font-light ml-1">Tokens</p>
        </div>
        <p className="text-placeholder">
          {prettyPrintDecimal((100 * userTokens) / supply, 2)}% of total supply
        </p>
      </div>
    </CampaignCardWrapper>
  )
}
