import { FC } from "react"
import { FaDiscord, FaTwitter } from "react-icons/fa"
import ReactMarkdown from "react-markdown"

import { CampaignImage, CampaignPlatformLink } from "@/components"

interface CampaignDetailsProps {
  website?: string
  discord?: string
  twitter?: string
  description: string
  imageUrl?: string
  name: string
}

export const CampaignDetails: FC<CampaignDetailsProps> = ({
  website,
  twitter,
  discord,
  description,
  name,
  imageUrl,
}) => (
  <div className="flex flex-col text-left">
    <div className="flex flex-col text-center items-center md:flex-row md:items-start md:text-left">
      <CampaignImage
        imageUrl={imageUrl}
        size={139}
        className="mb-4 md:mb-0 mr-4"
      />
      <div className="flex flex-col">
        <h1 className="font-medium text-4xl">{name}</h1>

        {!!(website || twitter || discord) && (
          <div className="flex flex-row items-center justify-center md:justify-start text-green mt-4">
            {!!website && (
              <CampaignPlatformLink
                href={website}
                label={new URL(website).hostname}
              />
            )}
            {!!twitter && (
              <CampaignPlatformLink
                href={`https://twitter.com/${twitter}`}
                label={(twitter.startsWith("@") ? "" : "@") + twitter}
                Icon={FaTwitter}
              />
            )}
            {!!discord && (
              <CampaignPlatformLink
                href={discord}
                label="Discord"
                Icon={FaDiscord}
              />
            )}
          </div>
        )}
      </div>
    </div>

    <ReactMarkdown
      children={description}
      linkTarget="_blank"
      className="mt-4 prose prose-invert"
    />
  </div>
)
