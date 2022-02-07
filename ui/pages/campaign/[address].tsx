import cn from "classnames"
import type { NextPage } from "next"
import { NextRouter, useRouter } from "next/router"
import { FC, useEffect } from "react"
import { useForm } from "react-hook-form"
import { IconType } from "react-icons"
import { FaDiscord, FaTwitter } from "react-icons/fa"
import TimeAgo from "react-timeago"
import { useRecoilValue } from "recoil"

import {
  Button,
  ButtonLink,
  CampaignImage,
  CampaignProgress,
  CampaignStatus,
  CenteredColumn,
  ControlledFormPercentTokenDoubleInput,
  FormInput,
  Loader,
  ResponsiveDecoration,
  Suspense,
  TooltipInfo,
} from "../../components"
import { payTokenSymbol } from "../../helpers/config"
import { numberPattern } from "../../helpers/form"
import { prettyPrintDecimal } from "../../helpers/number"
import { useContributeCampaign } from "../../hooks/useContributeCampaign"
import { useRefundCampaign } from "../../hooks/useRefundCampaign"
import useWallet from "../../hooks/useWallet"
import { campaignWalletBalance, fetchCampaign } from "../../state/campaigns"
import { Status } from "../../types"

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
  item: { when, address, amount },
}) => (
  <div className={cn("py-5", "border-b border-light")}>
    <div className="flex flex-row justify-between items-center">
      <p className="font-semibold">
        {amount} {payTokenSymbol}
      </p>
      <TimeAgo date={when} />
    </div>
    <p>{address}</p>
  </div>
)

interface ContributionForm {
  contribution?: number
}

interface RefundForm {
  refund?: number
}

export const Campaign: NextPage = () => {
  const router = useRouter()
  // Redirect to campaigns page if invalid query string.
  useEffect(() => {
    if (router.isReady && typeof router.query.address !== "string") {
      console.error("Invalid query address.")
      router.push("/campaigns")
      return
    }
  }, [router])

  return (
    <>
      <ResponsiveDecoration
        name="campaign_orange_blur.png"
        width={341}
        height={684}
        className="top-0 left-0 opacity-70"
      />

      <Suspense loader={{ overlay: true }}>
        <CampaignContent router={router} />
      </Suspense>
    </>
  )
}

interface CampaignContentProps {
  router: NextRouter
}
const CampaignContent: FC<CampaignContentProps> = ({
  router: { isReady, query, push: routerPush },
}) => {
  const { connect, connected } = useWallet(false)
  const { campaign, error: campaignError } = useRecoilValue(
    fetchCampaign(
      isReady && typeof query.address === "string" ? query.address : ""
    )
  )
  const { balance, error: balanceError } = useRecoilValue(
    campaignWalletBalance(campaign?.address)
  )

  // Contribution Form
  const {
    handleSubmit: contributionHandleSubmit,
    register: contributionRegister,
    formState: { errors: contributionErrors },
    watch: contributionWatch,
    reset: contributionReset,
  } = useForm({
    defaultValues: {} as ContributionForm,
  })

  const { contributeCampaign, contributeCampaignError } =
    useContributeCampaign(campaign)

  // Refund Form
  const {
    handleSubmit: refundHandleSubmit,
    register: refundRegister,
    formState: { errors: refundErrors },
    watch: refundWatch,
    control: refundControl,
    reset: refundReset,
  } = useForm({
    defaultValues: {} as RefundForm,
  })

  const { refundCampaign, refundCampaignError } = useRefundCampaign(campaign)

  // If no campaign, navigate to campaigns list.
  useEffect(() => {
    if (isReady && !campaign) routerPush("/campaigns")
  }, [isReady, campaign, routerPush])

  // If page not ready, display loader.
  if (!isReady) return <Loader overlay />
  // Display nothing (redirecting to campaigns list, so this is just a type check).
  if (!campaign) return null

  // Contribution Form
  const watchContribution = contributionWatch("contribution")
  const doContribution = async ({ contribution }: ContributionForm) => {
    if (!contribution) return
    // If success, empty form fields.
    // TODO: Add success display.
    if (await contributeCampaign(contribution)) contributionReset()
  }

  // Refund Form
  const watchRefund = refundWatch("refund")
  const doRefund = async ({ refund }: RefundForm) => {
    if (!refund) return
    // If success, empty form fields.
    // TODO: Add success display.
    if (await refundCampaign(refund)) refundReset()
  }

  const {
    name,
    description,

    status,

    goal,
    pledged,
    dao: { url: daoUrl },

    fundingToken: { symbol: tokenSymbol, price, supply },

    website,
    twitter,
    discord,

    activity,
  } = campaign ?? {}

  const inactive = status !== Status.Open
  const complete = status === Status.Complete
  const overfunded = pledged > goal

  // Contribution
  const expectedFundingTokensReceived =
    watchContribution && watchContribution > 0 && price
      ? price * watchContribution
      : 0
  // Refund
  // Minimum refund is how many funding tokens (with decimals) per 1 ujuno(x).
  const minRefund = Math.ceil(price ?? 0) / 1e6
  const expectedPayTokensReceived =
    watchRefund && watchRefund > 0 && price ? watchRefund / price : 0

  return (
    <>
      {complete && (
        <p className="bg-green text-dark text-center w-full px-12 py-2">
          {name} has been successfully funded!{" "}
          <a
            href={daoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:no-underline"
          >
            Click here to visit the DAO.
          </a>
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
              "flex flex-col justify-between items-stretch w-full lg:w-3/5 lg:shrink-0 lg:mr-10"
            )}
          >
            <div className={cn("flex flex-col text-center lg:text-left")}>
              <div className={cn("flex flex-col items-center", "lg:flex-row")}>
                <CampaignImage
                  campaign={campaign}
                  className="mb-4 lg:mb-0 lg:mr-4"
                  size={139}
                />

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

              <p className="mt-4">{description}</p>

              {overfunded && (
                <p className="flex flex-row items-center mt-8">
                  This campaign is overfunded.
                  <TooltipInfo text="" />
                </p>
              )}
            </div>

            <form
              onSubmit={contributionHandleSubmit(doContribution)}
              className={cn(
                "flex flex-col items-stretch mt-8",
                "sm:flex-row sm:items-start lg:self-stretch lg:mb-0",
                { hidden: !open }
              )}
            >
              <FormInput
                type="number"
                step={0.000001}
                inputMode="decimal"
                placeholder="Contribute..."
                accent={
                  expectedFundingTokensReceived
                    ? `You will receive about ${prettyPrintDecimal(
                        expectedFundingTokensReceived,
                        6
                      )} ${tokenSymbol}`
                    : undefined
                }
                wrapperClassName="!mb-4 sm:!mb-0 sm:mr-4 sm:flex-1"
                className="!py-3 !px-6 !pr-28"
                tail={payTokenSymbol}
                error={
                  contributionErrors?.contribution?.message ??
                  contributeCampaignError ??
                  undefined
                }
                disabled={inactive}
                {...contributionRegister("contribution", {
                  valueAsNumber: true,
                  pattern: numberPattern,
                  min: {
                    value: 0,
                    message: "Must be greater than 0.",
                  },
                  max: {
                    value: Number.MAX_SAFE_INTEGER / 1e6,
                    message: "Number too large.",
                  },
                })}
              />

              <Button
                className="sm:h-[50px]"
                submitLabel="Support this Campaign"
                disabled={inactive}
              />
            </form>
          </div>

          <div
            className={cn(
              "bg-card rounded-3xl p-8 mt-8",
              "flex flex-col items-start self-stretch"
            )}
          >
            <CampaignStatus campaign={campaign} className="mb-2" />

            {!!daoUrl && (
              <ButtonLink href={daoUrl} className="self-stretch my-2">
                Visit the DAO
              </ButtonLink>
            )}

            <CampaignProgress campaign={campaign} className="mt-2" />

            <h3 className="mt-2 text-green text-3xl">
              {prettyPrintDecimal(pledged, 6)} {payTokenSymbol}
            </h3>
            <p className="text-light text-sm">
              pledged out of {goal.toLocaleString()} {payTokenSymbol} goal.
            </p>

            {/* TODO: Display supporters. */}
            {/* <h3 className="mt-6 text-green text-3xl">
              {supporters.toLocaleString()}
            </h3>
            <p className="text-light text-sm">Supporters</p> */}

            {/* <h3 className="mt-6 text-green text-3xl">
              {supply.toLocaleString()}
            </h3>
            <p className="text-light text-sm">Total Supply</p> */}
          </div>
        </div>

        <div
          className={cn(
            "bg-card rounded-3xl",
            "mt-8 py-8 px-12 w-full lg:w-3/5"
          )}
        >
          <h2 className="text-xl text-green mb-2">Your Balance</h2>

          {connected ? (
            <p className="text-light">
              {prettyPrintDecimal(balance ?? 0, 6)} {tokenSymbol}
              {supply > 0 && !!balance && (
                <span className="text-placeholder ml-2">
                  {prettyPrintDecimal((100 * balance) / supply, 2)}% of total
                  supply
                </span>
              )}
            </p>
          ) : (
            <>
              <p className="text-orange">
                You haven&apos;t connected a wallet. Connect one to contribute,
                view your balance, or refund.
              </p>
              <Button className="mt-4" onClick={connect}>
                Connect a wallet
              </Button>
            </>
          )}

          {balance !== null && (
            <div className={cn({ hidden: !open || balance === 0 })}>
              <h2 className="text-xl text-green mt-8 mb-4">Refunds</h2>

              <form onSubmit={refundHandleSubmit(doRefund)}>
                <ControlledFormPercentTokenDoubleInput
                  name="refund"
                  control={refundControl}
                  minValue={minRefund}
                  maxValue={balance}
                  currency={tokenSymbol}
                  first={{
                    placeholder: "50",
                  }}
                  second={{
                    placeholder: prettyPrintDecimal(balance * 0.5, 6),
                  }}
                  shared={{
                    disabled: inactive,
                  }}
                  accent={
                    expectedPayTokensReceived
                      ? `You will receive about ${prettyPrintDecimal(
                          expectedPayTokensReceived,
                          6
                        )} ${payTokenSymbol}`
                      : undefined
                  }
                  error={
                    refundErrors?.refund?.message ??
                    refundCampaignError ??
                    undefined
                  }
                />

                <Button
                  submitLabel="Refund"
                  className="mt-4"
                  disabled={inactive}
                />
              </form>
            </div>
          )}
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
