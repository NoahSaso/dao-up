import { FunctionComponent } from "react"
import { FaDiscord, FaTwitter } from "react-icons/fa"
import ReactMarkdown from "react-markdown"

import { CampaignImage, CampaignPlatformLink, Carousel } from "@/components"

interface CampaignDetailsProps {
  website?: string
  discord?: string
  twitter?: string
  description: string
  imageUrl?: string
  imageUrls?: string[]
  name: string
}

export const CampaignDetails: FunctionComponent<CampaignDetailsProps> = ({
  website,
  twitter,
  discord,
  description,
  name,
  imageUrl,
  imageUrls,
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

    {!!imageUrls && imageUrls.length > 0 && (
      <Carousel
        className="h-[19rem] my-4"
        childContainerClassName="w-full h-full"
      >
        {imageUrls.map((src, index) => (
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
      children={description}
      linkTarget="_blank"
      className="mt-4 prose prose-invert"
    />
  </div>
)
