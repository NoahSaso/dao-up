import { FunctionComponent, useState } from "react"
import { FaDiscord, FaTwitter } from "react-icons/fa"
import ReactMarkdown from "react-markdown"

import {
  Button,
  CampaignImage,
  CampaignPlatformLink,
  Carousel,
} from "@/components"
import { visibleDescriptionChars } from "@/config"

interface CampaignDetailsProps {
  name: string
  description: string
  website?: string | null
  discord?: string | null
  twitter?: string | null
  profileImageUrl?: string | null
  descriptionImageUrls?: string[]
}

export const CampaignDetails: FunctionComponent<CampaignDetailsProps> = ({
  name,
  description,
  website,
  twitter,
  discord,
  profileImageUrl,
  descriptionImageUrls,
}) => {
  const [descriptionExpanded, setDescriptionExpanded] = useState(false)
  const descriptionNeedsExpanding = description.length > visibleDescriptionChars

  return (
    <div className="flex flex-col text-left">
      <div className="flex flex-col text-center items-center md:flex-row md:items-start md:text-left">
        <CampaignImage
          url={profileImageUrl}
          size={139}
          className="mb-4 md:mb-0 md:mr-4"
        />
        <div className="flex flex-col">
          <h1 className="font-medium text-4xl">{name}</h1>

          {!!(website || twitter || discord) && (
            <div className="flex flex-row items-center justify-center flex-wrap md:justify-start text-green mt-4">
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

      {!!descriptionImageUrls?.length && (
        <Carousel
          className="my-4 h-[14rem]"
          childContainerClassName="w-full h-full"
          allowExpand
        >
          {descriptionImageUrls.map((src, index) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={index}
              src={src}
              alt=""
              className="object-contain object-center w-full h-full"
            />
          ))}
        </Carousel>
      )}

      <ReactMarkdown
        children={
          descriptionNeedsExpanding && !descriptionExpanded
            ? description.slice(0, visibleDescriptionChars) + "..."
            : description
        }
        linkTarget="_blank"
        className="mt-4 prose prose-invert"
      />
      {descriptionNeedsExpanding && (
        <Button
          bare
          className="underline !opacity-100 hover:no-underline self-end mb-4"
          onClick={() => setDescriptionExpanded((e) => !e)}
        >
          See {descriptionExpanded ? "less" : "more"}
        </Button>
      )}
    </div>
  )
}
