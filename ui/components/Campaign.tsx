import cn from "classnames"
import Link from "next/link"
import { FC, PropsWithChildren, ReactNode, useCallback } from "react"
import { IconType } from "react-icons"
import { IoHeart, IoHeartOutline } from "react-icons/io5"
import ReactMarkdown from "react-markdown"
import TimeAgo from "react-timeago"
import { useRecoilState } from "recoil"

import { payTokenSymbol } from "../helpers/config"
import { prettyPrintDecimal } from "../helpers/number"
import { favoriteCampaignAddressesAtom } from "../state/campaigns"
import { CampaignActionType, Color, Status } from "../types"
import { Button, StatusIndicator } from "."

interface CampaignProps {
  campaign: Campaign
  className?: string
}

export const CampaignStatus: FC<CampaignProps> = ({
  campaign: { status },
  className,
}) => {
  let color: Color = Color.Placeholder
  let label: string
  switch (status) {
    case Status.Pending:
      label = "Pending"
      break
    case Status.Open:
      color = Color.Orange
      label = "Open"
      break
    case Status.Funded:
      color = Color.Green
      label = "Funded"
      break
    case Status.Cancelled:
      label = "Cancelled"
      break
    default:
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
  leftItem?: ReactNode
  hidePercent?: boolean
}
export const CampaignProgress: FC<CampaignProgressProps> = ({
  campaign: { status, pledged, goal },
  className,
  thin,
  leftItem,
  hidePercent = false,
}) => {
  const fundedPercent = (100 * pledged) / goal
  const showProgress = status === Status.Open || status === Status.Funded

  return (
    <div className={cn("flex flex-col justify-start w-full", className)}>
      {(!hidePercent || !!leftItem) && (
        <div
          className={cn("self-stretch flex flex-row items-end gap-2", {
            "justify-between": leftItem,
            "justify-end": !leftItem,
          })}
        >
          {leftItem}
          {!hidePercent && (
            <p className="text-placeholder italic text-right">
              {prettyPrintDecimal((100 * pledged) / goal, 0)}% funded
            </p>
          )}
        </div>
      )}
      <div
        className={cn("bg-dark overflow-hidden w-full rounded-full mt-1", {
          "h-[12px]": !thin,
          "h-[8px]": thin,
        })}
      >
        {showProgress ? (
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
    </div>
  )
}

export const CampaignFavoriteToggle: FC<CampaignProps> = ({
  campaign,
  className,
}) => {
  const [favoriteAddresses, setFavoriteAddresses] = useRecoilState(
    favoriteCampaignAddressesAtom
  )
  const toggleFavorite = useCallback(
    (address: string) =>
      setFavoriteAddresses((addresses) =>
        addresses.includes(address)
          ? addresses.filter((a) => a !== address)
          : [...addresses, address]
      ),
    [setFavoriteAddresses]
  )
  const isFavorite = !!favoriteAddresses?.includes(campaign.address)
  const FavoriteIcon = isFavorite ? IoHeart : IoHeartOutline

  return (
    <Button
      onClick={() => toggleFavorite(campaign.address)}
      bare
      className={className}
    >
      <FavoriteIcon size={24} className="text-green" />
    </Button>
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
              contentClassName
            )}
          >
            {children}
          </div>
        </a>
      </Link>
    </div>
  )
}

interface CampaignImageProps {
  size?: number
  imageUrl?: string
  className?: string
}
export const CampaignImage: FC<CampaignImageProps> = ({
  imageUrl,
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
  } = campaign

  return (
    <CampaignCardWrapper campaign={campaign} className={className}>
      <h2 className="font-medium text-xl pr-6">{name}</h2>
      <CampaignProgress
        campaign={campaign}
        className="mt-2"
        leftItem={
          <p className="sm:text-lg text-green">
            {pledged.toLocaleString()} {payTokenSymbol} pledged
          </p>
        }
        hidePercent
      />
      <ReactMarkdown
        children={description}
        linkTarget="_blank"
        className="mt-2 line-clamp-2"
      />
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
      <h2 className="font-medium text-xl pr-6">{name}</h2>
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
      <h2 className="font-medium text-xl pr-6">{name}</h2>
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
        className={cn("font-semibold pr-2", {
          "text-white": type === CampaignActionType.Fund,
          "text-orange": type === CampaignActionType.Refund,
        })}
      >
        {type === CampaignActionType.Fund ? "+" : "-"}{" "}
        {prettyPrintDecimal(amount)} {payTokenSymbol}
      </p>
      {!!when && <TimeAgo date={when} className="text-placeholder" />}
    </div>
    <p className="text-xs sm:text-sm text-placeholder font-mono break-all mt-1">
      {address}
    </p>
  </div>
)
