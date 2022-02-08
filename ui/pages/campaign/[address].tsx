import cn from "classnames"
import type { NextPage } from "next"
import { NextRouter, useRouter } from "next/router"
import { FC, useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { FaDiscord, FaTwitter } from "react-icons/fa"
import { useRecoilValue } from "recoil"

import {
  Button,
  ButtonLink,
  CampaignAction,
  CampaignImage,
  CampaignLink,
  CampaignProgress,
  CampaignStatus,
  CenteredColumn,
  ControlledFormPercentTokenDoubleInput,
  FormInput,
  Loader,
  ResponsiveDecoration,
  Suspense,
} from "../../components"
import { payTokenSymbol } from "../../helpers/config"
import { numberPattern } from "../../helpers/form"
import { prettyPrintDecimal } from "../../helpers/number"
import { useContributeCampaign } from "../../hooks/useContributeCampaign"
import { useCopy } from "../../hooks/useCopy"
import { useRefundCampaign } from "../../hooks/useRefundCampaign"
import { useWallet } from "../../hooks/useWallet"
import { getCampaignFundingMessage } from "../../services/campaigns"
import { suggestToken } from "../../services/keplr"
import {
  campaignWalletBalance,
  fetchCampaign,
  fetchCampaignActions,
} from "../../state/campaigns"
import { Status } from "../../types"

interface AddressDisplayProps {
  label: string
  address: string
}
const AddressDisplay: FC<AddressDisplayProps> = ({ label, address }) => {
  const { copy, Icon } = useCopy(address)

  return (
    <p
      className="mt-1 first-of-type:mt-4 flex flex-row justify-between items-center hover:opacity-70 transition cursor-pointer select-none"
      onClick={copy}
    >
      <span className="text-placeholder pr-2">{label}</span>
      <span className="text-green opacity-70 font-mono flex flex-row items-center">
        <Icon size={28} className="pr-2" />
        {address.substring(0, 8)}
        ...
        {address.substring(address.length - 6, address.length)}
      </span>
    </p>
  )
}

interface FundPendingForm {
  tokens?: number
}

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
// TODO: Generate custom message to fund & activate campaign with governance tokens automatically.
const CampaignContent: FC<CampaignContentProps> = ({
  router: { isReady, query, push: routerPush },
}) => {
  const { walletAddress, connect, connected } = useWallet()

  const campaignAddress =
    isReady && typeof query.address === "string" ? query.address : ""
  const { campaign, error: campaignError } = useRecoilValue(
    fetchCampaign(campaignAddress)
  )

  const { actions, error: campaignActionsError } = useRecoilValue(
    fetchCampaignActions(campaignAddress)
  )

  const { balance, error: balanceError } = useRecoilValue(
    campaignWalletBalance(campaign?.address)
  )

  // Funding Form for pending campaigns
  const {
    handleSubmit: fundPendingHandleSubmit,
    register: fundPendingRegister,
    formState: { errors: fundPendingErrors },
    watch: fundPendingWatch,
  } = useForm({ mode: "onChange", defaultValues: {} as FundPendingForm })
  const watchFundPending = fundPendingWatch("tokens")
  const campaignFundingMessage =
    watchFundPending && !fundPendingErrors.tokens && campaign
      ? getCampaignFundingMessage(campaign, watchFundPending)
      : undefined
  const {
    copy: copyCampaignFundingMessage,
    Icon: CopyCampaignFundingMessageIcon,
  } = useCopy(campaignFundingMessage)

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

  // Display buttons to add tokens to wallet.
  const [showAddFundingToken, setShowAddFundingToken] = useState(false)
  const [showAddGovToken, setShowAddGovToken] = useState(false)

  // If page not ready, display loader.
  if (!isReady) return <Loader overlay />
  // Display nothing (redirecting to campaigns list, so this is just a type check).
  if (!campaign) return null

  const {
    name,
    description,

    status,
    creator,

    goal,
    pledged,
    dao: {
      url: daoUrl,
      govToken: {
        address: govTokenAddress,
        symbol: govTokenSymbol,
        campaignBalance: govTokenCampaignBalance,
        daoBalance: govTokenDAOBalance,
        supply: govTokenSupply,
      },
    },

    fundingToken: { symbol: tokenSymbol, price, supply },

    website,
    twitter,
    discord,
  } = campaign ?? {}

  const suggestFundingToken = async () =>
    setShowAddFundingToken(!(await suggestToken(campaign.fundingToken.address)))
  const suggestGovToken = async () =>
    setShowAddGovToken(!(await suggestToken(campaign.dao.govToken.address)))

  // Funding Form for pending campaigns
  const doFundPending = async ({ tokens }: FundPendingForm) => {
    if (!tokens) return

    const message = getCampaignFundingMessage(campaign, tokens)
    alert(message)
    // TODO: Add success display.
    // if (await fundPendingCampaign(tokens)) {
    // }
  }

  // Contribution Form
  const watchContribution = contributionWatch("contribution")
  const doContribution = async ({ contribution }: ContributionForm) => {
    if (!contribution) return

    // TODO: Add success display.
    if (await contributeCampaign(contribution)) {
      // Attempt to add token to Keplr.
      await suggestFundingToken()

      // Empty form fields.
      contributionReset()
    }
  }

  // Refund Form
  const watchRefund = refundWatch("refund")
  const doRefund = async ({ refund }: RefundForm) => {
    // If funded, the refund action becomes the join DAO action, so send all tokens.
    if (status === Status.Funded) refund = balance ?? 0

    if (!refund) return

    // TODO: Add success display.
    if (await refundCampaign(refund)) {
      // Attempt to add token to Keplr if receiving governance tokens.
      if (status === Status.Funded) await suggestGovToken()

      // Empty form fields.
      refundReset()
    }
  }

  const createdByMe = connected && creator === walletAddress

  // Contribution
  const expectedFundingTokensReceived =
    watchContribution && watchContribution > 0 && price
      ? price * watchContribution
      : 0
  // Max contribution is remaining amount left to fund. Cannot fund more than goal.
  const maxContribution = Math.min(
    goal - pledged,
    Number.MAX_SAFE_INTEGER / 1e6
  )
  // Refund
  // Minimum refund is how many funding tokens (with decimals) per 1 ujuno(x).
  const minRefund = Math.ceil(price ?? 1e-6) / 1e6
  const expectedPayTokensReceived =
    watchRefund && watchRefund > 0 && price ? watchRefund / price : 0

  return (
    <>
      {status === Status.Funded && (
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

                  {status === Status.Pending && (
                    <>
                      <AddressDisplay
                        label="Escrow contract"
                        address={campaignAddress}
                      />
                      <AddressDisplay
                        label="Governance token"
                        address={govTokenAddress}
                      />
                    </>
                  )}
                </div>
              </div>

              <p className="mt-4">{description}</p>
            </div>

            {(status === Status.Pending || status === Status.Open) && (
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
                  inputMode="decimal"
                  placeholder="Contribute..."
                  accent={
                    expectedFundingTokensReceived
                      ? `You will receive about ${prettyPrintDecimal(
                          expectedFundingTokensReceived
                        )} ${tokenSymbol}`
                      : undefined
                  }
                  wrapperClassName="!mb-4 sm:!mb-0 sm:mr-4 sm:flex-1"
                  className="!py-3 !px-6 !pr-28"
                  tail={payTokenSymbol}
                  error={
                    status === Status.Pending
                      ? `You cannot contribute to a pending campaign.${
                          status === Status.Pending && !createdByMe
                            ? " Check back later once it launches."
                            : ""
                        }`
                      : contributionErrors?.contribution?.message ??
                        contributeCampaignError ??
                        undefined
                  }
                  disabled={status !== Status.Open}
                  {...contributionRegister("contribution", {
                    valueAsNumber: true,
                    pattern: numberPattern,
                    min: {
                      value: 1e-6,
                      message: `Must be at least 0.000001 ${payTokenSymbol}.`,
                    },
                    max: {
                      value: maxContribution,
                      message: `Must be less than or equal to ${prettyPrintDecimal(
                        maxContribution
                      )} ${payTokenSymbol}.`,
                    },
                  })}
                />

                <Button
                  className="sm:h-[50px]"
                  submitLabel="Support this campaign"
                  disabled={status !== Status.Open}
                />
              </form>
            )}
          </div>
          <div className="flex flex-col flex-wrap self-stretch">
            <div
              className={cn(
                "bg-card rounded-3xl p-8 mt-4 lg:mt-8",
                "flex flex-col items-start",
                "max-w-full"
              )}
            >
              <CampaignStatus campaign={campaign} className="mb-2" />

              {!!daoUrl && (
                <ButtonLink
                  href={daoUrl}
                  className="self-stretch my-2"
                  cardOutline
                >
                  Visit the DAO
                </ButtonLink>
              )}

              <CampaignProgress
                campaign={campaign}
                className="mt-2"
                textClassName="text-md text-placeholder italic self-end"
              />

              <h3 className="mt-2 text-green text-3xl">
                {prettyPrintDecimal(pledged)} {payTokenSymbol}
              </h3>
              <p className="text-light text-sm">
                pledged out of {goal.toLocaleString()} {payTokenSymbol} goal.
              </p>
              {/* TODO: Display supporters. */}
              {/* <h3 className="mt-6 text-green text-3xl">
                {supporters.toLocaleString()}
                </h3>
                <p className="text-light text-sm">Supporters</p> */}

              {!!govTokenCampaignBalance &&
                !!govTokenSupply &&
                !!govTokenSymbol && (
                  <>
                    <h3 className="mt-6 text-green text-3xl">
                      {prettyPrintDecimal(
                        govTokenCampaignBalance / govTokenSupply,
                        2
                      )}
                      % {govTokenSymbol}
                    </h3>
                    <p className="text-light text-sm">
                      Campaign&apos;s percentage of total governance token
                      supply.
                    </p>
                  </>
                )}
            </div>
            {status === Status.Pending && (
              <form
                onSubmit={fundPendingHandleSubmit(doFundPending)}
                className={cn(
                  "bg-card rounded-3xl p-8 mt-4 border border-orange",
                  "flex flex-col items-stretch self-stretch",
                  "max-w-full"
                )}
              >
                <p>
                  This campaign is pending. It can not accept funds until the
                  DAO allocates governance tokens to it.
                </p>

                <FormInput
                  type="number"
                  inputMode="decimal"
                  placeholder="1000000"
                  wrapperClassName="mt-4 mb-2"
                  className="!pr-28 border-light"
                  tail={govTokenSymbol}
                  error={fundPendingErrors?.tokens?.message}
                  {...fundPendingRegister("tokens", {
                    valueAsNumber: true,
                    pattern: numberPattern,
                    min: {
                      value: 1e-6,
                      message: `Must be at least 0.000001 ${govTokenSymbol}.`,
                    },
                    max: {
                      value: govTokenDAOBalance ?? 0,
                      message: `Must be less than or equal to the amount of ${govTokenSymbol} the DAO has in its treasury: ${prettyPrintDecimal(
                        govTokenDAOBalance ?? 0
                      )} ${govTokenSymbol}.`,
                    },
                  })}
                />
                {!!campaignFundingMessage && (
                  <div className="relative mb-2">
                    <pre className="text-mono whitespace-pre-wrap break-all">
                      {campaignFundingMessage}
                    </pre>
                    <div
                      className="absolute top-1 right-1 p-3 rounded-lg bg-dark cursor-pointer hover:opacity-70"
                      onClick={copyCampaignFundingMessage}
                    >
                      <CopyCampaignFundingMessageIcon size={20} />
                    </div>
                  </div>
                )}

                <Button submitLabel="Create Proposal" />

                {/* <p className="mt-2">
                  Need help? We&apos;ve got{" "}
                  <a
                    href="https://docs.daoup.zone/campaign-creation#starting-the-campaign"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    docs
                  </a>
                  .
                </p> */}
              </form>
            )}
          </div>
        </div>

        <div
          className={cn(
            "bg-card rounded-3xl",
            "mt-4 lg:mt-8",
            "w-full lg:w-3/5",
            "py-8 px-12"
          )}
        >
          <h2 className="text-xl text-green mb-2">Your Balance</h2>

          {connected ? (
            <>
              <p className="text-light">
                {prettyPrintDecimal(balance ?? 0)} {tokenSymbol}
                {supply > 0 && !!balance && (
                  <span className="text-placeholder ml-2">
                    {prettyPrintDecimal((100 * balance) / supply, 2)}% of total
                    supply
                  </span>
                )}
              </p>
              {balance !== null && balance > 0 && showAddFundingToken && (
                <div className="mt-4">
                  <Button onClick={suggestFundingToken}>
                    Add token to wallet
                  </Button>
                  <p className="text-sm text-placeholder italic mt-2">
                    This allows you to view your campaign funding token balance
                    ({tokenSymbol}) from your Keplr wallet. If you&apos;ve
                    already done this, it should still be there.
                  </p>
                </div>
              )}
              {status === Status.Funded && showAddGovToken && (
                <div className="mt-4">
                  <Button onClick={suggestGovToken}>
                    Add DAO token to wallet
                  </Button>
                  <p className="text-sm text-placeholder italic mt-2">
                    This allows you to view your DAO governance token balance
                    from your Keplr wallet. If you&apos;ve already done this, it
                    should still be there.
                  </p>
                </div>
              )}
            </>
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

          {status !== Status.Pending && balance !== null && balance > 0 && (
            <>
              {status !== Status.Funded && (
                <h2 className="text-xl text-green mt-8 mb-4">Refunds</h2>
              )}

              <form onSubmit={refundHandleSubmit(doRefund)}>
                {status === Status.Funded ? (
                  <p className="mt-4 text-placeholder italic">
                    This campaign has been successfully funded. To join the DAO,
                    exchange your {tokenSymbol} tokens by clicking the button
                    below.
                  </p>
                ) : (
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
                      placeholder: prettyPrintDecimal(balance * 0.5),
                    }}
                    shared={{
                      disabled: status !== Status.Open,
                    }}
                    accent={
                      expectedPayTokensReceived
                        ? `You will receive about ${prettyPrintDecimal(
                            expectedPayTokensReceived
                          )} ${payTokenSymbol}`
                        : undefined
                    }
                    error={
                      refundErrors?.refund?.message ??
                      refundCampaignError ??
                      undefined
                    }
                  />
                )}

                <Button
                  submitLabel={status === Status.Funded ? "Join DAO" : "Refund"}
                  className="mt-4"
                  disabled={status !== Status.Open && status !== Status.Funded}
                />
              </form>
            </>
          )}
        </div>

        <h2 className="text-green text-xl mt-8">Activity</h2>
        {!!campaignActionsError && (
          <p className="text-orange my-4">{campaignActionsError}</p>
        )}
        {!!actions && (
          <div className="w-full lg:w-3/5">
            {actions.length ? (
              actions.map((item, idx) => (
                <CampaignAction key={idx} action={item} />
              ))
            ) : (
              <p>None yet.</p>
            )}
          </div>
        )}
      </CenteredColumn>
    </>
  )
}

export default Campaign
