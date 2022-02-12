import cn from "classnames"
import { FaDiscord, FaTwitter } from "react-icons/fa"
import ReactMarkdown from "react-markdown"

import { CampaignImage, CampaignLink } from "./Campaign"

export function CampaignDetails({
  website,
  twitter,
  discord,
  description,
  name,
  imageUrl,
}: {
  website?: string
  discord?: string
  twitter?: string
  description: string
  imageUrl?: string
  name: string
}) {
  return (
    <div className={cn("flex flex-col text-left")}>
      <div className={cn("flex flex-col", "lg:flex-row")}>
        <div className="flex">
          <div className="mb-4 lg:mb-0 mr-4">
            <CampaignImage imageUrl={imageUrl} size={139} />
          </div>
          <div className={cn("flex flex-col")}>
            <h1 className="font-medium text-5xl">{name}</h1>

            {!!(website || twitter || discord) && (
              <div
                className={cn(
                  "flex flex-row items-center justify-center lg:justify-start ",
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
      </div>

      <ReactMarkdown
        children={description}
        className="mt-4 prose prose-invert"
      />
    </div>
  )
}
