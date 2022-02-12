import { ArcElement, Chart as ChartJS } from "chart.js"
import cn from "classnames"
import type { NextPage } from "next"
import { NextRouter, useRouter } from "next/router"
import { FC, useCallback, useEffect, useState } from "react"
import { Pie } from "react-chartjs-2"
import { useForm } from "react-hook-form"
import { useRecoilValue, useSetRecoilState } from "recoil"

import {
  Button,
  ButtonLink,
  CampaignAction,
  CampaignDetails,
  CampaignFavoriteToggle,
  CampaignProgress,
  CampaignStatus,
  CenteredColumn,
  ControlledFormPercentTokenDoubleInput,
  FormInput,
  Loader,
  ResponsiveDecoration,
  Suspense,
  WalletMessage,
  PendingCard,
} from "../../components"
import { daoUrlPrefix, payTokenSymbol, theme } from "../../helpers/config"
import { numberPattern } from "../../helpers/form"
import { prettyPrintDecimal } from "../../helpers/number"
import { useContributeCampaign } from "../../hooks/useContributeCampaign"
import { useCopy } from "../../hooks/useCopy"
import { useFundPendingCampaign } from "../../hooks/useFundPendingCampaign"
import { useRefundCampaign } from "../../hooks/useRefundCampaign"
import { useWallet } from "../../hooks/useWallet"
import { suggestToken } from "../../services/keplr"
import {
  campaignWalletBalance,
  favoriteCampaignAddressesAtom,
  fetchCampaign,
  fetchCampaignActions,
} from "../../state/campaigns"
import { Status } from "../../types"

ChartJS.register(ArcElement)

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

interface PieLegendProps {
  items: {
    label: string
    color: string
  }[]
  className?: string
}
const PieLegend: FC<PieLegendProps> = ({ items, className }) => (
  <div className={cn("flex flex-col", className)}>
    {items.map(({ label, color: backgroundColor }) => (
      <div key={label} className="flex flex-row items-center mt-1 first:mt-0">
        <div
          className={cn("w-10 h-5 mr-2 shrink-0")}
          style={{ backgroundColor }}
        ></div>
        <p className="text-light">{label}</p>
      </div>
    ))}
  </div>
)

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
const CampaignContent: FC<CampaignContentProps> = ({
  router: { isReady, query, push: routerPush },
}) => {
  const { connected, keplr } = useWallet()
  const campaignAddress =
    isReady && typeof query.address === "string" ? query.address : ""
  const { campaign, error: campaignError } = useRecoilValue(
    fetchCampaign(campaignAddress)
  )

  const { actions, error: campaignActionsError } = useRecoilValue(
    fetchCampaignActions(campaignAddress)
  )

  const { balance: fundingTokenBalance, error: fundingTokenBalanceError } =
    useRecoilValue(campaignWalletBalance(campaign?.address))

  // Funding form for pending campaigns
  const {
    handleSubmit: fundPendingHandleSubmit,
    register: fundPendingRegister,
    formState: { errors: fundPendingErrors },
    watch: fundPendingWatch,
  } = useForm({ mode: "onChange", defaultValues: {} as FundPendingForm })

  const { fundPendingCampaign, fundPendingCampaignError } =
    useFundPendingCampaign(campaign)
  const [fundCampaignProposalUrl, setFundCampaignProposalUrl] = useState(
    null as string | null
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

  // Add campaign to favorites if funding.
  const setFavoriteAddresses = useSetRecoilState(favoriteCampaignAddressesAtom)
  const addFavorite = useCallback(
    (address: string) =>
      setFavoriteAddresses((addresses) =>
        addresses.includes(address) ? addresses : [...addresses, address]
      ),
    [setFavoriteAddresses]
  )

  // If page not ready, display loader.
  if (!isReady) return <Loader overlay />
  // Display nothing (redirecting to campaigns list, so this is just a type check).
  if (!campaign) return null

  const {
    name,

    status,

    goal,
    pledged,
    dao: {
      url: daoUrl,
      govToken: {
        symbol: govTokenSymbol,
        campaignBalance: govTokenCampaignBalance,
        daoBalance: govTokenDAOTreasuryBalance,
        supply: govTokenSupply,
      },
    },

    fundingToken: {
      symbol: tokenSymbol,
      price: fundingTokenPrice,
      supply: fundingTokenSupply,
    },
  } = campaign ?? {}

  const suggestFundingToken = async () =>
    keplr &&
    setShowAddFundingToken(
      !(await suggestToken(keplr, campaign.fundingToken.address))
    )
  const suggestGovToken = async () =>
    keplr &&
    setShowAddGovToken(
      !(await suggestToken(keplr, campaign.dao.govToken.address))
    )

  // Contribution Form
  const watchContribution = contributionWatch("contribution")
  const doContribution = async ({ contribution }: ContributionForm) => {
    if (!contribution) return

    // TODO: Add success display.
    if (await contributeCampaign(contribution)) {
      // Attempt to add token to Keplr.
      await suggestFundingToken()

      // Add campaign to favorites.
      addFavorite(campaignAddress)

      // Empty form fields.
      contributionReset()
    }
  }

  // Refund Form
  const watchRefund = refundWatch("refund")
  const doRefund = async ({ refund }: RefundForm) => {
    // If funded, the refund action becomes the join DAO action, so send all tokens.
    if (status === Status.Funded) refund = fundingTokenBalance ?? 0

    if (!refund) return

    // TODO: Add success display.
    if (await refundCampaign(refund)) {
      // Attempt to add token to Keplr if receiving governance tokens.
      if (status === Status.Funded) await suggestGovToken()

      // Empty form fields.
      refundReset()
    }
  }

  // DAO voting power of campaign (determined by proportion of campaign's governance token balance to all governance tokens not in the DAO's treasury).
  const campaignVotingPower =
    govTokenCampaignBalance &&
    govTokenSupply &&
    govTokenDAOTreasuryBalance &&
    govTokenSupply > govTokenDAOTreasuryBalance
      ? (100 * govTokenCampaignBalance) /
        (govTokenSupply - govTokenDAOTreasuryBalance)
      : undefined
  // DAO voting power of existing DAO members.
  const govTokenDAOMemberBalance =
    govTokenSupply &&
    govTokenDAOTreasuryBalance !== undefined &&
    govTokenCampaignBalance
      ? govTokenSupply - govTokenDAOTreasuryBalance - govTokenCampaignBalance
      : undefined

  // Percent of funding tokens the user's balance represents.
  const fundingTokenBalancePercent =
    fundingTokenBalance && fundingTokenSupply
      ? (100 * fundingTokenBalance) / fundingTokenSupply
      : undefined

  // Contribution
  const expectedFundingTokensReceived =
    watchContribution && watchContribution > 0 && fundingTokenPrice
      ? fundingTokenPrice * watchContribution
      : 0
  // Max contribution is remaining amount left to fund. Cannot fund more than goal.
  const maxContribution = Math.min(
    goal - pledged,
    Number.MAX_SAFE_INTEGER / 1e6
  )
  // Refund
  // Minimum refund is how many funding tokens (with decimals) per 1 ujuno(x).
  const minRefund = Math.ceil(fundingTokenPrice ?? 1e-6) / 1e6
  const expectedPayTokensReceived =
    watchRefund && watchRefund > 0 && fundingTokenPrice
      ? watchRefund / fundingTokenPrice
      : 0

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

      <CenteredColumn className="pt-10 pb-12 sm:pt-20 xl:w-8/12">
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
            <CampaignDetails {...campaign} />

            {connected || <WalletMessage />}

            {status === Status.Pending ? (
              <PendingCard campaign={campaign} />
            ) : status === Status.Open ? (
              <form
                onSubmit={contributionHandleSubmit(doContribution)}
                className={cn(
                  "flex flex-col items-stretch mt-8",
                  "sm:flex-row sm:items-start lg:self-stretch lg:mb-0"
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
                    contributionErrors?.contribution?.message ??
                    contributeCampaignError ??
                    undefined
                  }
                  disabled={!connected}
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
                  disabled={!connected}
                  submitLabel="Support this campaign"
                />
              </form>
            ) : undefined}
          </div>
          <div className="flex flex-col flex-wrap self-stretch">
            <div
              className={cn(
                "bg-card rounded-3xl p-8 mt-4 lg:mt-8",
                "flex flex-col items-start",
                "max-w-full",
                "relative"
              )}
            >
              <div className="flex flex-row justify-between items-center self-stretch mb-4">
                <CampaignStatus campaign={campaign} />
                <CampaignFavoriteToggle campaign={campaign} />
              </div>

              {!!daoUrl && (
                <ButtonLink
                  href={daoUrl}
                  className="self-stretch my-2"
                  cardOutline
                >
                  Visit the DAO
                </ButtonLink>
              )}

              <CampaignProgress campaign={campaign} className="mt-2 text-md" />

              <h3 className="mt-2 text-green text-3xl">
                {prettyPrintDecimal(pledged)} {payTokenSymbol}
              </h3>
              <p className="text-light text-sm">
                pledged out of {goal.toLocaleString()} {payTokenSymbol} goal.
              </p>
              {/* TODO: Display backers. */}
              {/* <h3 className="mt-6 text-green text-3xl">
                {backers.toLocaleString()}
                </h3>
                <p className="text-light text-sm">Backers</p> */}
            </div>

            {/* Hide for funded campaigns since govTokenCampaignBalance won't remain constant. */}
            {/* TODO: Store initial fund amount in contract staet and use that instead. */}
            {status !== Status.Funded &&
              !!campaignVotingPower &&
              !!govTokenDAOTreasuryBalance &&
              !!govTokenCampaignBalance &&
              !!govTokenSupply &&
              !!govTokenSymbol && (
                <div
                  className={cn(
                    "bg-card rounded-3xl p-8 mt-4 lg:mt-8",
                    "flex flex-col items-start",
                    "max-w-full"
                  )}
                >
                  <h3 className="text-green text-3xl">
                    {prettyPrintDecimal(campaignVotingPower, 2)}% governance
                  </h3>
                  <p className="text-light text-sm">
                    Campaign backers will have{" "}
                    {prettyPrintDecimal(campaignVotingPower, 2)}% voting power
                    in the DAO. Voting power ignores the DAO&apos;s treasury
                    balance. To learn more,{" "}
                    <a
                      href="https://docs.daoup.zone/evaluating-campaigns#what-is-a-good-percentage-of-governance-power"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:no-underline"
                    >
                      read the docs
                    </a>
                    .
                  </p>

                  <Pie
                    options={{
                      // Disable all events (hover, tooltip, etc.)
                      events: [],
                      animation: false,
                    }}
                    data={{
                      datasets: [
                        {
                          data: [
                            govTokenDAOMemberBalance,
                            govTokenDAOTreasuryBalance,
                            govTokenCampaignBalance,
                          ],
                          backgroundColor: [
                            theme.colors.pieMedium,
                            theme.colors.pieDark,
                            theme.colors.pieLight,
                          ],
                          borderWidth: 0,
                        },
                      ],
                    }}
                    className="!w-48 !h-48 mt-8 self-center"
                  />

                  <PieLegend
                    className="mt-4"
                    items={[
                      {
                        label: "Campaign",
                        color: theme.colors.pieLight,
                      },
                      {
                        label: "Current DAO members/creators",
                        color: theme.colors.pieMedium,
                      },
                      {
                        label: "DAO's treasury",
                        color: theme.colors.pieDark,
                      },
                    ]}
                  />
                  <div className="flex flex-col"></div>
                </div>
              )}
          </div>
        </div>

        {connected && (
          <div
            className={cn(
              "bg-card rounded-3xl",
              "mt-4 lg:mt-8",
              "w-full lg:w-3/5",
              "py-8 px-12"
            )}
          >
            <h2 className="text-xl text-green mb-2">Your Balance</h2>

            <p className="text-light">
              {prettyPrintDecimal(fundingTokenBalance ?? 0)} {tokenSymbol}
              {fundingTokenBalancePercent && (
                <span className="text-placeholder ml-2">
                  {prettyPrintDecimal(fundingTokenBalancePercent, 2)}% of total
                  supply
                </span>
              )}
            </p>
            {fundingTokenBalance !== null &&
              fundingTokenBalance > 0 &&
              showAddFundingToken && (
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
                  This allows you to view your DAO governance token balance from
                  your Keplr wallet. If you&apos;ve already done this, it should
                  still be there.
                </p>
              </div>
            )}

            {status !== Status.Pending &&
              fundingTokenBalance !== null &&
              fundingTokenBalance > 0 && (
                <>
                  {status !== Status.Funded && (
                    <h2 className="text-xl text-green mt-8 mb-4">Refunds</h2>
                  )}

                  <form onSubmit={refundHandleSubmit(doRefund)}>
                    {status === Status.Funded ? (
                      <p className="mt-4 text-placeholder italic">
                        This campaign has been successfully funded. To join the
                        DAO, exchange your {tokenSymbol} tokens by clicking the
                        button below.
                      </p>
                    ) : (
                      <ControlledFormPercentTokenDoubleInput
                        name="refund"
                        control={refundControl}
                        minValue={minRefund}
                        maxValue={fundingTokenBalance}
                        currency={tokenSymbol}
                        first={{
                          placeholder: "50",
                        }}
                        second={{
                          placeholder: prettyPrintDecimal(
                            fundingTokenBalance * 0.5
                          ),
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
                      submitLabel={
                        status === Status.Funded ? "Join DAO" : "Refund"
                      }
                      className="mt-4"
                      disabled={
                        status !== Status.Open && status !== Status.Funded
                      }
                    />
                  </form>
                </>
              )}
          </div>
        )}

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
