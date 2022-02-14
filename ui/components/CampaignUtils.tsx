import cn from "classnames"
import { FunctionComponent, useCallback } from "react"
import { IconType } from "react-icons"
import { IoHeart, IoHeartOutline } from "react-icons/io5"
import TimeAgo from "react-timeago"
import { useRecoilState } from "recoil"

import { Button, StatusIndicator } from "@/components"
import { payTokenSymbol } from "@/config"
import { prettyPrintDecimal } from "@/helpers"
import { favoriteCampaignAddressesAtom } from "@/state"
import { CampaignActionType, Color, Status } from "@/types"

export const CampaignStatus: FunctionComponent<CampaignProps> = ({
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
  showPledged?: boolean
  hidePercent?: boolean
}
export const CampaignProgress: FunctionComponent<CampaignProgressProps> = ({
  campaign: { status, pledged, goal },
  className,
  thin,
  showPledged = false,
  hidePercent = false,
}) => {
  // Round down so we don't say 100% funded until it has actually been funded.
  const fundedPercent = Math.floor((100 * pledged) / goal)
  const showProgress = status === Status.Open || status === Status.Funded

  return (
    <div className={cn("flex flex-col justify-start w-full", className)}>
      {(!hidePercent || showPledged) && (
        <div
          className={cn("self-stretch flex flex-row items-end gap-2", {
            "justify-between": showPledged,
            "justify-end": !showPledged,
          })}
        >
          {showPledged && (
            <p className="sm:text-lg text-green">
              {pledged.toLocaleString()} {payTokenSymbol} pledged
            </p>
          )}
          {!hidePercent && (
            <p className="text-placeholder italic text-right">
              {prettyPrintDecimal(fundedPercent, 0)}% funded
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

export const CampaignFavoriteToggle: FunctionComponent<CampaignProps> = ({
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

interface CampaignImageProps {
  size?: number
  imageUrl?: string
  className?: string
}
export const CampaignImage: FunctionComponent<CampaignImageProps> = ({
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

interface CampaignPlatformLinkProps {
  href: string
  label: string
  Icon?: IconType
}
export const CampaignPlatformLink: FunctionComponent<
  CampaignPlatformLinkProps
> = ({ href, label, Icon }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="mr-4 last:mr-0 flex flex-row items-center hover:opacity-70"
  >
    {!!Icon && <Icon className="mr-1" size={18} />}
    {label}
  </a>
)

interface CampaignActionProps {
  action: CampaignAction
}
export const CampaignAction: FunctionComponent<CampaignActionProps> = ({
  action: { when, address, amount, type },
}) => (
  <div className="py-5 border-b border-light">
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
