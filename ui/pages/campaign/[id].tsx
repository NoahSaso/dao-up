import cn from "classnames"
import type { NextPage } from "next"
import Image from "next/image"
import { useRouter } from "next/router"
import { FC, useState } from "react"
import { IconType } from "react-icons"
import { AiOutlineExclamationCircle } from "react-icons/ai"
import { FaDiscord, FaTwitter } from "react-icons/fa"
import TimeAgo from "react-timeago"

import { Button, ButtonLink, CenteredColumn, Input } from "../../components"
import { campaigns } from "../../services/campaigns"

interface CampaignLinkProps {
  href: string
  label: string
  Icon?: IconType
}
const CampaignLink: FC<CampaignLinkProps> = ({ href, label, Icon }) => (
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

interface ActivityItemProps {
  item: ActivityItem
}
const ActivityItem: FC<ActivityItemProps> = ({
  item: { when, address, amount, asset },
}) => (
  <div className={cn("py-5", "border-b border-light")}>
    <div className="flex flex-row justify-between items-center">
      <p className="font-semibold">
        {amount} {asset}
      </p>
      <TimeAgo date={when} />
    </div>
    <p>{address}</p>
  </div>
)

const Campaign: NextPage = () => {
  const { query, isReady } = useRouter()
  const [contribution, setContribution] = useState("0")
  const [refund, setRefund] = useState("0")

  const campaign = isReady ? campaigns.find((c) => c.id === query.id) : null
  if (!isReady || !campaign) return null

  const {
    name,
    description,
    imageUrl,
    open,

    website,
    twitter,
    discord,

    asset,
    goal,
    pledged,
    supporters,
    supply,

    activity,
  } = campaign

  const fundedPercent = (100 * pledged) / goal
  const funded = pledged >= goal
  const overfunded = pledged > goal

  return (
    <>
      <div
        className={cn(
          "absolute top-0 left-0",
          "opacity-70",
          "w-3/4 md:w-1/2 lg:w-2/5 xl:w-1/3"
        )}
      >
        <Image
          src="/images/campaign_orange_blur.png"
          alt=""
          width={341}
          height={684}
          layout="responsive"
        />
      </div>

      <CenteredColumn className="pt-5 pb-12">
        <div
          className={cn(
            "flex flex-col justify-start items-stretch",
            "lg:flex-row lg:justify-between"
          )}
        >
          <div className="flex flex-col mb-8 lg:mb-0 lg:mr-8">
            <h1 className="text-4xl">{name}</h1>

            {!!(website || twitter || discord) && (
              <div
                className={cn(
                  "flex flex-row items-center",
                  "text-green",
                  "mt-4"
                )}
              >
                {!!website && (
                  <CampaignLink
                    href={website}
                    label={new URL(website).hostname}
                  />
                )}
                {!!twitter && (
                  <CampaignLink
                    href={`https://twitter.com/${twitter}`}
                    label={(twitter.startsWith("@") ? "" : "@") + twitter}
                    Icon={FaTwitter}
                  />
                )}
                {!!discord && (
                  <CampaignLink
                    href={discord}
                    label="Discord"
                    Icon={FaDiscord}
                  />
                )}
              </div>
            )}

            <p className="mt-2">{description}</p>

            {overfunded && (
              <p className="flex flex-row items-center mt-8">
                This campaign is overfunded.
                <AiOutlineExclamationCircle className="ml-1" size={18} />
              </p>
            )}

            <div className="mt-8 flex-1 flex flex-col">
              <div className="flex flex-col items-stretch md:flex-row">
                <Input
                  type="text"
                  placeholder="Contribute..."
                  value={contribution}
                  onChange={({ target: { value } }) =>
                    setContribution(value.replaceAll(/[^\d.]/g, ""))
                  }
                  className="mb-4 md:mb-0 md:mr-4"
                />

                <Button onClick={() => alert("thanks")}>
                  Support this Campaign
                </Button>
              </div>

              <div
                className={cn(
                  "bg-card",
                  "mt-8 py-8 px-12",
                  "rounded-3xl",
                  "flex-1"
                )}
              >
                <h2 className="text-xl text-green mb-2">Your Balance</h2>
                <p className="text-light">
                  0 Tokens{" "}
                  <span className="text-placeholder">0% of total supply</span>
                </p>

                <h2 className="text-xl text-green mt-8 mb-4">Refunds</h2>

                <Input
                  type="text"
                  placeholder="Refund..."
                  value={refund}
                  onChange={({ target: { value } }) =>
                    setRefund(value.replaceAll(/[^\d.]/g, ""))
                  }
                  className="bg-dark !border-light mb-4 w-full max-w-sm"
                />

                <Button onClick={() => alert("refund")}>Refund</Button>
              </div>
            </div>
          </div>

          <div
            className={cn(
              "bg-card",
              "p-8",
              "rounded-3xl",
              "flex flex-col items-start self-center lg:self-stretch"
            )}
          >
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

            <div className="bg-green w-[284px] h-[284px]"></div>

            <div className="bg-dark overflow-hidden w-[284px] h-[12px] rounded-full mt-8">
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

            <h3 className="mt-2 text-green text-3xl">
              {pledged.toLocaleString()} {asset}
            </h3>
            <p className="text-light text-sm">
              pledged out of {goal.toLocaleString()} {asset} goal.
            </p>

            <h3 className="mt-6 text-green text-3xl">
              {supporters.toLocaleString()}
            </h3>
            <p className="text-light text-sm">Supporters</p>

            <h3 className="mt-6 text-green text-3xl">
              {supply.toLocaleString()}
            </h3>
            <p className="text-light text-sm">Total Supply</p>
          </div>
        </div>

        <h2 className="text-green text-xl mt-8">Activity</h2>
        {activity.length ? (
          activity.map((item) => (
            <ActivityItem key={item.when.toString()} item={item} />
          ))
        ) : (
          <p>None yet.</p>
        )}
      </CenteredColumn>
    </>
  )
}

export default Campaign
