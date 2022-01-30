import cn from "classnames"
import type { NextPage } from "next"
import Image from "next/image"
import { useRouter } from "next/router"
import { FC, useState } from "react"
import { IconType } from "react-icons"
import { AiOutlineExclamationCircle } from "react-icons/ai"
import { FaDiscord, FaTwitter } from "react-icons/fa"

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
      <p>{when.toLocaleString()}</p>
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
        <h1 className="text-4xl">{name}</h1>

        {!!(website || twitter || discord) && (
          <div
            className={cn("flex flex-row items-center", "text-green", "mt-4")}
          >
            {!!website && (
              <CampaignLink href={website} label={new URL(website).hostname} />
            )}
            {!!twitter && (
              <CampaignLink
                href={`https://twitter.com/${twitter}`}
                label={(twitter.startsWith("@") ? "" : "@") + twitter}
                Icon={FaTwitter}
              />
            )}
            {!!discord && (
              <CampaignLink href={discord} label="Discord" Icon={FaDiscord} />
            )}
          </div>
        )}

        <p className="mt-2">{description}</p>

        {pledged > goal && (
          <p className="flex flex-row items-center mt-8">
            This campaign is overfunded.
            <AiOutlineExclamationCircle className="ml-1" size={18} />
          </p>
        )}

        <div className="mt-8">
          <div className="flex flex-row items-stretch">
            <Input
              type="text"
              placeholder="Contribute..."
              value={contribution}
              onChange={({ target: { value } }) =>
                setContribution(value.replaceAll(/[^\d.]/g, ""))
              }
              className="mr-4"
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
              "w-full"
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
              className="bg-dark !border-light mb-4"
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
