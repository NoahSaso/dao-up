import cn from "classnames"
import { FunctionComponent } from "react"
import { FaDiscord, FaTwitter } from "react-icons/fa"
import ReactMarkdown from "react-markdown"

import { CampaignImage, CampaignPlatformLink, Carousel } from "@/components"

interface CampaignDetailsProps {
  name: string
  description: string
  website?: string
  discord?: string
  twitter?: string
  profileImageUrl?: string
  descriptionImageUrls?: string[]
  smallerCarousel?: boolean
}

export const CampaignDetails: FunctionComponent<CampaignDetailsProps> = ({
  name,
  description,
  website,
  twitter,
  discord,
  profileImageUrl,
  descriptionImageUrls,
  smallerCarousel = false,
}) => (
  <div className="flex flex-col text-left">
    <div className="flex flex-col text-center items-center md:flex-row md:items-start md:text-left">
      <CampaignImage
        imageUrl={profileImageUrl}
        size={139}
        className="mb-4 md:mb-0 md:mr-4"
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

    {!!descriptionImageUrls?.length && (
      <Carousel
        className={cn("my-4", {
          "h-[19rem]": !smallerCarousel,
          "h-[15rem]": smallerCarousel,
        })}
        childContainerClassName="w-full h-full"
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
      children={description}
      linkTarget="_blank"
      className="mt-4 prose prose-invert"
    />
  </div>
)
