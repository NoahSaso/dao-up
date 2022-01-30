import cn from "classnames"
import type { NextPage } from "next"
import Image from "next/image"
import { useRouter } from "next/router"
import { FC, useState } from "react"
import { IconType } from "react-icons"
import { AiOutlineExclamationCircle } from "react-icons/ai"
import { FaDiscord, FaTwitter } from "react-icons/fa"
import TimeAgo from "react-timeago"

import { Button, CenteredColumn, Input } from "../../components"
import { toMaxDecimals } from "../../helpers/number"
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

  const userTokens = 0

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

      <CenteredColumn className="pt-5 pb-12 2xl:w-2/3">
        <div
          className={cn(
            "flex flex-col justify-start items-center",
            "lg:flex-row lg:justify-between lg:items-stretch"
          )}
        >
          <div
            className={cn(
              "flex flex-col justify-between items-stretch w-full lg:w-3/5"
            )}
          >
            <div className={cn("flex flex-col text-center lg:text-left")}>
              <div className={cn("flex flex-col items-center", "lg:flex-row")}>
                <div
                  className={cn(
                    "bg-green w-[139px] h-[139px] mb-4",
                    "lg:mb-0 lg:mr-4"
                  )}
                ></div>

                <div className={cn("flex flex-col")}>
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
                </div>
              </div>

              <p className="mt-4">{description}</p>

              {overfunded && (
                <p className="flex flex-row items-center mt-8">
                  This campaign is overfunded.
                  <AiOutlineExclamationCircle className="ml-1" size={18} />
                </p>
              )}
            </div>

            <div
              className={cn(
                "flex flex-col items-stretch my-8",
                "sm:flex-row lg:self-stretch lg:my-0",
                { hidden: !open }
              )}
            >
              <Input
                type="text"
                placeholder="Contribute..."
                value={contribution}
                onChange={({ target: { value } }) =>
                  setContribution(value.replaceAll(/[^\d.]/g, ""))
                }
                className="!py-3 !px-6 mb-4 sm:mb-0 sm:mr-4 sm:flex-1"
              />

              <Button onClick={() => alert("thanks")}>
                Support this Campaign
              </Button>
            </div>
          </div>

          <div
            className={cn(
              "bg-card rounded-3xl p-8",
              "flex flex-col items-start self-stretch"
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

            <div className="bg-dark overflow-hidden w-full h-[12px] rounded-full mt-2">
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

        <div
          className={cn(
            "bg-card rounded-3xl",
            "mt-8 py-8 px-12 w-full lg:w-3/5"
          )}
        >
          <h2 className="text-xl text-green mb-2">Your Balance</h2>
          <p className="text-light">
            {userTokens} Tokens{" "}
            <span className="text-placeholder ml-2">
              {toMaxDecimals((100 * userTokens) / supply, 2)}% of total supply
            </span>
          </p>

          <div className={cn({ hidden: !open })}>
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
