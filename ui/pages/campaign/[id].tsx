import cn from "classnames"
import type { NextPage } from "next"
import Image from "next/image"
import { useRouter } from "next/router"
import { FC, useState } from "react"
import { IconType } from "react-icons"
import { FaDiscord, FaTwitter } from "react-icons/fa"
import TimeAgo from "react-timeago"

import {
  Button,
  ButtonLink,
  CampaignStatus,
  CenteredColumn,
  Input,
  ResponsiveDecoration,
  TooltipInfo,
} from "../../components"
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
    daoUrl,

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
  const overfunded = pledged > goal

  const userTokens = 0

  return (
    <>
      <ResponsiveDecoration
        name="campaign_orange_blur.png"
        width={341}
        height={684}
        className="top-0 left-0 opacity-70"
      />

      {!!daoUrl && (
        <p className="bg-green text-dark text-center w-full px-12 py-2">
          {name} has been successfully funded and the{" "}
          <a
            href={daoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:no-underline"
          >
            DAO
          </a>{" "}
          has been created.
        </p>
      )}

      <CenteredColumn className="pt-10 pb-12 sm:pt-20 2xl:w-2/3">
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
                  <h1 className="font-medium text-5xl">{name}</h1>

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
                  <TooltipInfo text="" />
                </p>
              )}
            </div>

            <div
              className={cn(
                "flex flex-col items-stretch mt-8",
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
              "bg-card rounded-3xl p-8 mt-8",
              "flex flex-col items-start self-stretch"
            )}
          >
            <CampaignStatus campaign={campaign} />

            {!!daoUrl && (
              <ButtonLink href={daoUrl} className="self-stretch my-2">
                Visit the DAO
              </ButtonLink>
            )}

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
        <div className=" w-full lg:w-3/5">
          {activity.length ? (
            activity.map((item) => (
              <ActivityItem key={item.when.toString()} item={item} />
            ))
          ) : (
            <p>None yet.</p>
          )}
        </div>
      </CenteredColumn>
    </>
  )
}

export default Campaign
