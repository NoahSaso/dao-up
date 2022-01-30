import cn from "classnames"
import type { NextPage } from "next"
import Image from "next/image"
import { useRouter } from "next/router"
import { FC } from "react"
import { IconType } from "react-icons"
import { AiOutlineExclamationCircle } from "react-icons/ai"
import { FaDiscord, FaTwitter } from "react-icons/fa"

import { CenteredColumn } from "../../components"
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

const Campaign: NextPage = () => {
  const { query, isReady } = useRouter()

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

      <CenteredColumn className="pt-5">
        <h1 className="text-4xl">{name}</h1>

        {!!(website || twitter || discord) && (
          <div
            className={cn(
              "flex flex-row items-center",
              "text-green",
              "mt-4 mb-2"
            )}
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

        <p>{description}</p>

        {pledged > goal && (
          <p className="flex flex-row items-center mt-8">
            This campaign is overfunded.
            <AiOutlineExclamationCircle className="ml-1" size={18} />
          </p>
        )}
      </CenteredColumn>
    </>
  )
}

export default Campaign
