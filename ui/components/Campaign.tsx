import cn from "classnames"
import Link from "next/link"
import { FC } from "react"

interface CampaignProps {
  campaign: Campaign
}

export const CampaignStatus: FC<CampaignProps> = ({
  campaign: { open, pledged, goal },
}) => {
  const funded = pledged >= goal

  return (
    <div className="flex flex-row items-center mb-3">
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

export const AllCampaignsCard: FC<CampaignProps> = ({
  campaign: { id, name, pledged, asset, goal, description },
}) => (
  <Link href={`/campaign/${id}`}>
    <a
      className={cn(
        "flex flex-row justify-start items-stretch",
        "bg-card p-10 rounded-3xl",
        "border border-card hover:border-green",
        "transition",
        "cursor-pointer"
      )}
    >
      <div className="bg-green w-[135px] h-[135px]"></div>
      <div className="ml-5">
        <h2 className="font-medium text-xl">{name}</h2>
        <p className="text-lg text-green">
          {pledged.toLocaleString()} {asset} pledged
        </p>
        <p className="text-lg text-white">
          {((100 * pledged) / goal).toFixed(0)}% funded
        </p>
        <p className="mt-5">{description}</p>
      </div>
    </a>
  </Link>
)
