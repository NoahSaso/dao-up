import cn from "classnames"
import { FunctionComponent, PropsWithChildren } from "react"
import ReactMarkdown from "react-markdown"
import { useRecoilValueLoadable } from "recoil"

import {
  CampaignFavoriteToggle,
  CampaignImage,
  CampaignProgress,
  CampaignStatusIndicator,
  CardWrapper,
  Loader,
} from "@/components"
import { prettyPrintDecimal } from "@/helpers"
import { cw20WalletTokenBalance } from "@/state"

interface CampaignCardWrapperProps extends PropsWithChildren<CampaignProps> {
  contentClassName?: string
  forceColumn?: boolean
  lessPaddingOnLg?: boolean
}

const CampaignCardWrapper: FunctionComponent<CampaignCardWrapperProps> = ({
  campaign,
  className,
  children,
  contentClassName,
  forceColumn,
}) => {
  return (
    <CardWrapper
      className={cn(
        "border border-card hover:border-green transition cursor-pointer relative",
        className
      )}
    >
      <CampaignFavoriteToggle
        campaign={campaign}
        className="absolute top-4 right-4"
      />
      {/* Use A tag instead of Link component since the campaign page might need to wait for static props to load. For some reason, fallback:true on the statically generated page only displays the fallback (loader) when on that page, but when Link'd to, it loads in the background and navigates once it finishes. This causes a bad UX for the user who just sees nothing happen for a few seconds, instead of the desired behavior of showing the fallback loader. The A tag navigates to the page instantaneously, and shows the loader as expected. */}
      <a
        href={campaign.urlPath}
        className={cn("flex flex-col justify-start items-stretch", {
          "sm:flex-row": !forceColumn,
        })}
      >
        <CampaignImage url={campaign.profileImageUrl} />
        <div
          className={cn(
            "flex flex-col items-stretch flex-1",
            "ml-0 mt-4 sm:ml-5 sm:mt-0",
            "overflow-hidden",
            contentClassName
          )}
        >
          <h2 className="font-medium text-xl pr-6 text-ellipsis overflow-hidden whitespace-nowrap break-words">
            {campaign.name}
          </h2>
          {children}
        </div>
      </a>
    </CardWrapper>
  )
}

export const AllCampaignsCard: FunctionComponent<CampaignProps> = ({
  campaign,
  className,
}) => (
  <CampaignCardWrapper
    campaign={campaign}
    // The campaigns list splits into two columns at lg, and these cards become narrow again, so reduce padding and then increase again.
    className={cn("lg:p-6 2xl:p-8", className)}
  >
    <CampaignProgress
      campaign={campaign}
      className="mt-2"
      showPledged
      hidePercent
    />
    <ReactMarkdown
      children={campaign.description}
      linkTarget="_blank"
      // Campaign card is an A tag, and it's bad practice to nest A tags in the DOM. We only show two lines of this markdown as a preview, no need to allow links here.
      disallowedElements={["a"]}
      // line-clamp is weird on Safari, so just set max height to twice the line height and hide overflow.
      className="mt-2 line-clamp-2 leading-6 max-h-12 overflow-hidden"
    />
  </CampaignCardWrapper>
)

export const CreatorCampaignCard: FunctionComponent<CampaignProps> = ({
  campaign,
  className,
}) => (
  <CampaignCardWrapper
    campaign={campaign}
    // The campaigns list splits into two columns at lg, and these cards become narrow again, so reduce padding and then increase again.
    className={cn("lg:p-6 2xl:p-8", className)}
  >
    <CampaignStatusIndicator campaign={campaign} />

    <CampaignProgress campaign={campaign} className="mt-4" showPledged />
  </CampaignCardWrapper>
)

export const FavoriteCampaignCard: FunctionComponent<CampaignProps> = ({
  campaign,
  className,
}) => {
  const {
    fundingToken: {
      address: fundingTokenAddress,
      symbol: fundingTokenSymbol,
      supply: fundingTokenSupply,
    },
  } = campaign

  const { state, contents } = useRecoilValueLoadable(
    cw20WalletTokenBalance(fundingTokenAddress)
  )
  const balance = state === "hasValue" ? contents.balance : undefined
  const balancePercent =
    balance && fundingTokenSupply && (100 * balance) / fundingTokenSupply

  return (
    <CampaignCardWrapper
      campaign={campaign}
      // The campaigns list splits into two columns at lg, and these cards become narrow again, so reduce padding and then increase again.
      className={cn("lg:p-6 2xl:p-8", className)}
    >
      <CampaignStatusIndicator campaign={campaign} className="shrink-0" />
      <CampaignProgress campaign={campaign} thin />

      <div className="flex flex-row items-end gap-2 mt-5">
        {typeof balance === "number" ? (
          <>
            <p className="text-green">
              <span className="text-xl font-medium mr-1">
                {prettyPrintDecimal(balance)}
              </span>
              <span className="text-base font-light">{fundingTokenSymbol}</span>
            </p>
            <p className="text-placeholder font-sm text-right">
              {prettyPrintDecimal(balancePercent, 2)}% of total supply
            </p>
          </>
        ) : (
          <Loader size={32} />
        )}
      </div>
    </CampaignCardWrapper>
  )
}

export const HomepageFeaturedCampaignCard: FunctionComponent<CampaignProps> = ({
  campaign,
}) => (
  <CampaignCardWrapper
    campaign={campaign}
    className="max-w-full w-full xs:w-[21.6rem] sm:w-[23rem] xl:w-[24rem]"
    contentClassName="!ml-0 !mt-3"
    forceColumn
  >
    <CampaignProgress campaign={campaign} className="mt-2" showPledged />
    <ReactMarkdown
      children={campaign.description}
      linkTarget="_blank"
      // Campaign card is an A tag, and it's bad practice to nest A tags in the DOM. We only show two lines of this markdown as a preview, no need to allow links here.
      disallowedElements={["a"]}
      // line-clamp is weird on Safari, so just set max height to twice the line height and hide overflow.
      className="mt-4 line-clamp-2 leading-6 max-h-12 overflow-hidden"
    />
  </CampaignCardWrapper>
)
