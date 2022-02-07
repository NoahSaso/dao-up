import cn from "classnames"
import Link from "next/link"
import { FC, PropsWithChildren } from "react"
import { IconType } from "react-icons"
import TimeAgo from "react-timeago"

import { payTokenSymbol } from "../helpers/config"
import { prettyPrintDecimal } from "../helpers/number"
import { CampaignActionType, Color, Status } from "../types"
import { StatusIndicator } from "."

interface CampaignProps {
  campaign: Campaign
  className?: string
}

export const CampaignStatus: FC<CampaignProps> = ({
  campaign: { status, pledged, goal },
  className,
}) => {
  let color: Color
  let label: string
  switch (status) {
    case Status.Open:
      const funded = pledged >= goal
      color = funded ? Color.Orange : Color.Green
      label = funded ? "Goal Reached" : "Active"
      break
    case Status.Pending:
      color = Color.Placeholder
      label = "Pending"
      break
    case Status.Cancelled:
      color = Color.Placeholder
      label = "Cancelled"
      break
    case Status.Funded:
      color = Color.Placeholder
      label = "Funded"
      break
    default:
      color = Color.Placeholder
      label = "Unknown"
      break
  }

  return (
    <StatusIndicator
      color={color}
      label={label}
      containerClassName={className}
    />
  )
}

interface CampaignProgressProps extends CampaignProps {
  thin?: boolean
}
export const CampaignProgress: FC<CampaignProgressProps> = ({
  campaign: { status, pledged, goal },
  className,
  thin,
}) => {
  const fundedPercent = (100 * pledged) / goal
  const open = status === Status.Open

  return (
    <div
      className={cn(
        "bg-dark overflow-hidden w-full rounded-full",
        {
          "h-[12px]": !thin,
          "h-[8px]": thin,
        },
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

interface CampaignCardWrapperProps extends PropsWithChildren<CampaignProps> {
  contentClassName?: string
}
const CampaignCardWrapper: FC<CampaignCardWrapperProps> = ({
  campaign,
  className,
  children,
  contentClassName,
}) => (
  <Link href={`/campaign/${campaign.address}`}>
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
      <CampaignImage campaign={campaign} />
      <div
        className={cn(
          "flex flex-col items-stretch flex-1",
          "ml-0 mt-4 xs:ml-5 xs:mt-0",
          contentClassName
        )}
      >
        {children}
      </div>
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
    className={cn("bg-green shrink-0 overflow-hidden rounded-md", className)}
    style={{ width: size, height: size }}
  >
    {!!imageUrl && (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={imageUrl} alt="image" className="w-full h-full object-cover" />
    )}
  </div>
)

export const AllCampaignsCard: FC<CampaignProps> = ({
  campaign,
  className,
}) => {
  const {
    name,
    description,
    pledged,
    fundingToken: { symbol },
    goal,
  } = campaign

  return (
    <CampaignCardWrapper campaign={campaign} className={className}>
      <h2 className="font-medium text-xl">{name}</h2>
      <p className="sm:text-lg text-green">
        {pledged.toLocaleString()} {symbol} pledged
      </p>
      <p className="sm:text-lg text-white">
        {prettyPrintDecimal((100 * pledged) / goal, 0)}% funded
      </p>
      <CampaignProgress campaign={campaign} className="mt-2" />
      <p className="mt-5">{description}</p>
    </CampaignCardWrapper>
  )
}

export const CreatorCampaignCard: FC<CampaignProps> = ({
  campaign,
  className,
}) => {
  const {
    name,
    pledged,
    fundingToken: { symbol },
    goal,
  } = campaign

  return (
    <CampaignCardWrapper campaign={campaign} className={className}>
      <h2 className="font-medium text-xl">{name}</h2>
      <CampaignStatus campaign={campaign} className="" />

      <p className="text-xl text-green font-medium mt-8">
        {prettyPrintDecimal((100 * pledged) / goal, 0)}%{" "}
        <span className="text-base font-light">Funded</span>
      </p>
      <p className="text-placeholder">
        {pledged.toLocaleString()} {symbol} pledged
      </p>
    </CampaignCardWrapper>
  )
}

export const ContributorCampaignCard: FC<CampaignProps> = ({
  campaign,
  className,
}) => {
  const {
    name,
    pledged,
    goal,
    fundingToken: { supply },
  } = campaign

  const userTokens = 200

  return (
    <CampaignCardWrapper campaign={campaign} className={className}>
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
    </CampaignCardWrapper>
  )
}

interface CampaignLinkProps {
  href: string
  label: string
  Icon?: IconType
}
export const CampaignLink: FC<CampaignLinkProps> = ({ href, label, Icon }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className={cn(
      "mr-4 last:mr-0",
      "flex flex-row items-center",
      "hover:opacity-70"
    )}
  >
    {!!Icon && <Icon className="mr-1" size={18} />}
    {label}
  </a>
)

interface CampaignActionProps {
  action: CampaignAction
}
export const CampaignAction: FC<CampaignActionProps> = ({
  action: { when, address, amount, type },
}) => (
  <div className={cn("py-5", "border-b border-light")}>
    <div className="flex flex-row justify-between items-center">
      <p
        className={cn("font-semibold", {
          "text-green": type === CampaignActionType.Fund,
          "text-orange": type === CampaignActionType.Refund,
        })}
      >
        {type === CampaignActionType.Fund ? "+" : "-"} {amount * 10 ** -6}{" "}
        {payTokenSymbol}
      </p>
      {!!when && <TimeAgo date={when} />}
    </div>
    <p className="text-sm font-mono mt-1">{address}</p>
  </div>
)
