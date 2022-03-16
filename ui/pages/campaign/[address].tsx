import type { GetStaticPaths, GetStaticProps, NextPage } from "next"
import Head from "next/head"
import { NextRouter, useRouter } from "next/router"
import { FunctionComponent, useCallback, useEffect, useState } from "react"
import Confetti from "react-confetti"
import { useRecoilValue, useRecoilValueLoadable } from "recoil"

import {
  Alert,
  BalanceRefundJoinCard,
  Banner,
  Button,
  ButtonLink,
  CampaignAction,
  CampaignDetails,
  CampaignInfoCard,
  CenteredColumn,
  ContributeForm,
  ContributionGraph,
  EditCampaignForm,
  GovernanceCard,
  Loader,
  ProposeFundPendingCard,
  ResponsiveDecoration,
  Suspense,
  WalletMessage,
} from "@/components"
import { baseUrl, daoUrlPrefix, title } from "@/config"
import { escrowAddressRegex, parseError, secondsToBlockHeight } from "@/helpers"
import { useRefundJoinDAOForm, useUpdateCampaign, useWallet } from "@/hooks"
import {
  contractInstantiationBlockHeight,
  createDENSAddressMap,
  getCampaignActions,
  getCampaignState,
  getClient,
  getCW20WalletTokenBalance,
  getDateFromBlockHeight,
  getDENSAddress,
  getDENSNames,
  getFeaturedAddresses,
  suggestToken,
  transformCampaign,
} from "@/services"
import { cosmWasmClient, cw20WalletTokenBalance, fetchCampaign } from "@/state"
import {
  CampaignActionType,
  CampaignContractVersion,
  CampaignStatus,
} from "@/types"

const campaigns404Path = "/campaigns?404"

interface CampaignStaticProps {
  campaign?: Campaign
}

export const Campaign: NextPage<CampaignStaticProps> = ({ campaign }) => {
  const router = useRouter()

  const [confettiVisible, setConfettiVisible] = useState(false)
  const showConfetti = useCallback(() => {
    setConfettiVisible(true)
    // Clear in case confetti needs to be shown twice on the same page (probably won't but might as well).
    setTimeout(() => setConfettiVisible(false), 5000)
  }, [setConfettiVisible])

  // If no campaign when there should be a campaign, navigate back to campaigns list.
  useEffect(() => {
    if (
      router.isReady &&
      // No props on fallback page, so don't redirect until page is actually in an invalid state.
      !router.isFallback &&
      !campaign
    ) {
      console.error("Invalid query address.")
      router.push(campaigns404Path)
      return
    }
  }, [router, campaign])

  return (
    <>
      <Head>
        {campaign ? (
          <>
            <title>
              {title} | {campaign.name}
            </title>
            <meta
              name="twitter:title"
              content={`${title} | ${campaign.name}`}
              key="twitter:title"
            />
            <meta
              property="og:title"
              content={`${title} | ${campaign.name}`}
              key="og:title"
            />

            <meta
              property="og:url"
              content={`${baseUrl + campaign.urlPath}`}
              key="og:url"
            />
          </>
        ) : (
          <title>DAO Up! | Loading...</title>
        )}

        {!!campaign?.profileImageUrl && (
          <meta
            name="twitter:image"
            content={campaign.profileImageUrl}
            key="twitter:image"
          />
        )}
        {/* OpenGraph does not support SVG images. */}
        {!!campaign?.profileImageUrl &&
          !campaign.profileImageUrl.endsWith(".svg") && (
            <meta
              property="og:image"
              content={campaign.profileImageUrl}
              key="og:image"
            />
          )}
      </Head>

      <ResponsiveDecoration
        name="campaign_orange_blur.png"
        width={341}
        height={684}
        className="top-0 left-0 opacity-70"
      />

      <Suspense loader={{ overlay: true }}>
        <CampaignContent
          router={router}
          preLoadedCampaign={campaign}
          showConfetti={showConfetti}
        />
      </Suspense>

      {confettiVisible && (
        <Confetti
          className="!fixed !z-50"
          recycle={false}
          drawShape={(ctx) =>
            ctx.fill(
              // Logo SVG path.
              new Path2D(
                "M10.7961 8.64055C7.63521 6.39201 5.5693 4.36814 5.74663 3.39862C5.97814 2.13297 11.3055 2.76905 12.7187 2.99762C9.5662 1.79761 0.69174 -0.544285 0.0394994 1.51287C-0.775802 4.08432 11.2365 13.8091 16.9982 17.113C24.1731 21.2273 35.0582 25.7977 43.211 26.6549C48.4289 27.2035 51.364 26.6549 52.2188 24.9988C53.3748 22.7592 44.8811 16.5987 39.5001 13.6844C39.4372 13.6503 39.377 13.6179 39.3195 13.5871C38.6075 5.96544 32.193 0 24.3852 0C18.3743 0 13.1892 3.53557 10.7961 8.64055ZM38.2937 20.6278C42.7872 21.7311 46.1419 22.1286 46.8378 21.5702C48.0483 20.5989 42.8937 16.6962 40.0599 14.5506C39.8032 14.3562 39.5655 14.1762 39.3533 14.0142C39.3745 14.3401 39.3852 14.6688 39.3852 15C39.3852 16.9902 38.9976 18.89 38.2937 20.6278ZM24.3852 30C27.2824 30 29.9878 29.1786 32.2811 27.756C26.5974 25.7883 20.9629 23.2074 16.5692 20.7628C14.6294 19.6835 12.0502 17.9643 9.41875 16.0114C9.93889 23.824 16.4408 30 24.3852 30Z"
              )
            )
          }
        />
      )}
    </>
  )
}

interface CampaignContentProps {
  router: NextRouter
  preLoadedCampaign?: Campaign
  showConfetti: () => void
}

const CampaignContent: FunctionComponent<CampaignContentProps> = ({
  router,
  preLoadedCampaign,
  showConfetti,
}) => {
  const campaignAddress = preLoadedCampaign?.address ?? ""

  const { keplr, connected } = useWallet()

  // Fetch latest campaign details in background and update so that page is as up to date as possible.
  const {
    state: latestCampaignState,
    contents: { campaign: latestCampaign },
  } = useRecoilValueLoadable(fetchCampaign({ address: campaignAddress }))
  // Use just-fetched campaign over pre-loaded campaign, defaulting to pre-loaded.
  const campaign: Campaign =
    (latestCampaignState === "hasValue" && latestCampaign) || preLoadedCampaign

  // Funding token balance to check if user needs to join the DAO.
  const {
    state: fundingTokenBalanceState,
    contents: { balance: fundingTokenBalanceContents },
  } = useRecoilValueLoadable(
    cw20WalletTokenBalance(campaign?.fundingToken?.address)
  )
  // No need to prevent page from displaying until this is ready.
  const fundingTokenBalance: number | null =
    fundingTokenBalanceState === "hasValue" ? fundingTokenBalanceContents : null

  // TODO: Change to staked gov token.
  // Check gov token balance to show edit campaign form.
  const {
    state: govTokenBalanceState,
    contents: { balance: govTokenBalanceContents },
  } = useRecoilValueLoadable(
    cw20WalletTokenBalance(campaign?.govToken?.address)
  )
  // No need to prevent page from displaying until this is ready.
  const hasGovToken =
    govTokenBalanceState === "hasValue" ? !!govTokenBalanceContents : null

  // Display buttons to add tokens to wallet.
  const [showAddFundingToken, setShowAddFundingToken] = useState(false)
  const [showAddGovToken, setShowAddGovToken] = useState(false)

  // ALERTS
  // Display successful fund pending alert by setting the URL to the proposal.
  const [fundCampaignProposalUrl, setFundCampaignProposalUrl] = useState("")
  // Display successful contribution alert.
  const [showContributionSuccessAlert, setShowContributionSuccessAlert] =
    useState(false)
  // Display successful join DAO alert.
  const [showJoinDAOSuccessAlert, setShowJoinDAOSuccessAlert] = useState(false)
  // Display edit campaign alert.
  const [showEditCampaignAlert, setShowEditCampaignAlert] = useState(false)
  // Display successful edit campaign proposal alert by setting the URL to the proposal.
  const [editCampaignProposalUrl, setEditCampaignProposalUrl] = useState("")

  // Show confetti when contributing or joining.
  useEffect(() => {
    if (showContributionSuccessAlert || showJoinDAOSuccessAlert) {
      showConfetti()
    }
  }, [showContributionSuccessAlert, showJoinDAOSuccessAlert, showConfetti])

  const suggestFundingToken = async () =>
    keplr &&
    campaign?.fundingToken?.address &&
    setShowAddFundingToken(
      !(await suggestToken(keplr, campaign.fundingToken.address))
    )
  const suggestGovToken = async () =>
    keplr &&
    campaign?.govToken?.address &&
    setShowAddGovToken(!(await suggestToken(keplr, campaign.govToken.address)))

  // Handler for successful DAO join, show relevant alerts.
  const onRefundJoinDAOSuccess = async () => {
    if (status === CampaignStatus.Funded) {
      // Show success message.
      setShowJoinDAOSuccessAlert(true)

      // Attempt to add token to Keplr if receiving governance tokens.
      await suggestGovToken()
    }
  }
  // Needed for joining DAO from campaign funded join DAO alert.
  const { onSubmit: onSubmitRefundJoinDAO } = useRefundJoinDAOForm(
    campaign ?? null,
    fundingTokenBalance,
    onRefundJoinDAOSuccess
  )

  const { editCampaign, editCampaignError, defaultEditCampaign } =
    useUpdateCampaign(campaign, (proposalId) => {
      // Show success message with proposal URL.
      setEditCampaignProposalUrl(
        `${daoUrlPrefix}${daoAddress}/proposals/${proposalId}`
      )

      // Hide update form.
      setShowEditCampaignAlert(false)
    })

  // If page not ready or is fallback, display loader.
  if (!router.isReady || router.isFallback) return <Loader overlay />
  // Display nothing (redirecting to campaigns list, so this is just a type check).
  if (!campaign) return null

  const {
    version,
    name,
    status,

    dao: { address: daoAddress, url: daoUrl },
  } = campaign

  return (
    <>
      {status === CampaignStatus.Funded && (
        <Banner color="green">
          {name} has been successfully funded!{" "}
          <a
            href={daoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:no-underline"
          >
            Click here to visit the DAO.
          </a>
        </Banner>
      )}

      <CenteredColumn className="pt-10 pb-12 sm:pt-20 xl:w-8/12">
        <div className="flex flex-col justify-start items-center gap-8 lg:flex-row lg:justify-between lg:items-stretch">
          <div className="flex flex-col items-stretch gap-8 w-full lg:w-3/5 lg:shrink-0">
            <CampaignDetails {...campaign} />

            {!connected && <WalletMessage />}

            {status === CampaignStatus.Pending ? (
              <ProposeFundPendingCard
                campaign={campaign}
                onSuccess={(proposalId: string) =>
                  // Show success message with proposal URL.
                  setFundCampaignProposalUrl(
                    `${daoUrlPrefix}${daoAddress}/proposals/${proposalId}`
                  )
                }
              />
            ) : status === CampaignStatus.Open ? (
              <ContributeForm
                campaign={campaign}
                onSuccess={async () => {
                  // Show success message.
                  setShowContributionSuccessAlert(true)

                  // Attempt to add token to Keplr.
                  await suggestFundingToken()
                }}
              />
            ) : undefined}

            <CampaignInfoCard
              campaign={campaign}
              hasGovToken={!!hasGovToken}
              showEdit={() => setShowEditCampaignAlert(true)}
              className="lg:hidden"
            />

            {connected && (
              <BalanceRefundJoinCard
                campaign={campaign}
                showAddGovToken={showAddGovToken}
                suggestGovToken={suggestGovToken}
                showAddFundingToken={showAddFundingToken}
                suggestFundingToken={suggestFundingToken}
                onSuccess={onRefundJoinDAOSuccess}
              />
            )}
          </div>

          <div className="flex flex-col self-stretch gap-8 flex-1">
            <CampaignInfoCard
              campaign={campaign}
              hasGovToken={!!hasGovToken}
              showEdit={() => setShowEditCampaignAlert(true)}
              className="hidden lg:block"
            />

            {/* v1 contract does not store initial gov token funding amount. The govToken.campaignBalance is wrong after it is funded since people start joining the DAO which drains the campaign's gov token balance. */}
            {version === CampaignContractVersion.v1
              ? // Only show if open since the balance is accurate.
                status === CampaignStatus.Open && (
                  <GovernanceCard campaign={campaign} />
                )
              : // All v2+ contracts can show the balance after pending.
                status !== CampaignStatus.Pending && (
                  <GovernanceCard campaign={campaign} />
                )}
          </div>
        </div>

        <h2 className="text-green text-xl mt-8 mb-2">Activity</h2>

        <Suspense>
          <CampaignActionsContent campaign={campaign} />
        </Suspense>
      </CenteredColumn>

      {/* Fund pending success alert. */}
      <Alert
        visible={!!fundCampaignProposalUrl}
        hide={() => setFundCampaignProposalUrl("")}
        title="Proposal created!"
      >
        <p>
          This campaign will activate once the proposal is approved and executed
          on DAO DAO. Refresh this page after the proposal executes.
        </p>

        <ButtonLink href={fundCampaignProposalUrl} className="mt-5" cardOutline>
          View Proposal
        </ButtonLink>
      </Alert>

      {/* Contribution success alert. */}
      <Alert
        // Only show if not funded.
        // If just contributed and it's now funded, campaign funded message will appear instead as necessary.
        visible={
          status !== CampaignStatus.Funded && showContributionSuccessAlert
        }
        hide={() => setShowContributionSuccessAlert(false)}
        title="Contribution successful!"
      >
        <p>
          Once the campaign is fully funded, return to this page to join the{" "}
          <a
            href={daoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:no-underline"
          >
            DAO
          </a>
          .
        </p>
      </Alert>

      {/* Campaign funded alert if needs to join DAO. */}
      <Alert
        visible={status === CampaignStatus.Funded && !!fundingTokenBalance}
        title="Campaign funded!"
      >
        <p>
          Now join the{" "}
          <a
            href={daoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:no-underline"
          >
            DAO
          </a>
          . Joining:
          <ol className="list-disc pl-8 mt-2">
            <li>
              sends the{" "}
              <a
                href={daoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:no-underline"
              >
                DAO
              </a>{" "}
              your contribution
            </li>
            <li>
              lets you participate in the{" "}
              <a
                href={daoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:no-underline"
              >
                DAO
              </a>{" "}
              by sending you governance tokens
            </li>
          </ol>
        </p>

        <form onSubmit={onSubmitRefundJoinDAO}>
          <Button submitLabel="Join DAO" className="mt-5" cardOutline />
        </form>
      </Alert>

      {/* Join DAO success alert. */}
      <Alert
        visible={showJoinDAOSuccessAlert}
        hide={() => setShowJoinDAOSuccessAlert(false)}
        title="You've joined the DAO!"
      >
        <p>
          You will vote in the{" "}
          <a
            href={daoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:no-underline"
          >
            DAO
          </a>{" "}
          on DAO DAO going forward.
        </p>

        <ButtonLink href={daoUrl} className="mt-5" cardOutline>
          Visit the DAO
        </ButtonLink>
      </Alert>

      {/* Edit campaign alert. */}
      <Alert
        visible={showEditCampaignAlert}
        hide={() => setShowEditCampaignAlert(false)}
        title="Update campaign"
        className="!max-w-4xl"
      >
        <EditCampaignForm
          title={
            <p className="flex-1 min-w-full md:min-w-0">
              This form will submit a new proposal to the{" "}
              {daoUrl ? (
                <a
                  href={daoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:no-underline"
                >
                  DAO
                </a>
              ) : (
                "DAO"
              )}{" "}
              on DAO DAO. Once this proposal is approved and executed, the
              campaign will be updated.
            </p>
          }
          submitLabel="Create update proposal"
          error={editCampaignError}
          creating={false}
          defaultValues={defaultEditCampaign}
          onSubmit={editCampaign}
        />
      </Alert>

      {/* Edit campaign proposal successfully created alert. */}
      <Alert
        visible={!!editCampaignProposalUrl}
        hide={() => setEditCampaignProposalUrl("")}
        title="Proposal created!"
      >
        <p>
          This campaign will update once the proposal is approved and executed
          on DAO DAO. Refresh this page after the proposal executes.
        </p>

        <ButtonLink href={editCampaignProposalUrl} className="mt-5" cardOutline>
          View Proposal
        </ButtonLink>
      </Alert>
    </>
  )
}

let startedLoadingActions = false

interface CampaignActionsContentProps {
  campaign: Campaign
}

const CampaignActionsContent: React.FC<CampaignActionsContentProps> = ({
  campaign,
}) => {
  const client = useRecoilValue(cosmWasmClient)
  const [loadingActions, setLoadingActions] = useState(false)
  const [actions, setActions] = useState<CampaignAction[]>([])
  const [earliestDate, setEarliestDate] = useState<Date | null>(null)

  useEffect(() => {
    const load = async () => {
      if (!client || startedLoadingActions) return
      startedLoadingActions = true
      setLoadingActions(true)

      try {
        let blockHeight = await client?.getHeight()
        const currentBlockHeight = blockHeight
        let currentTotal = campaign.pledged
        // Load one day at a time.
        const interval = secondsToBlockHeight(60 * 60 * 24)
        // Stop once hitting campaign's creation block height.
        const minBlockHeight = campaign.createdBlockHeight ?? 0

        while (blockHeight >= minBlockHeight) {
          // Don't need to load below campaign creation block height.
          const currMinBlockHeight = Math.max(
            blockHeight - interval,
            minBlockHeight
          )

          const actions = await getCampaignActions(
            client,
            campaign,
            currentBlockHeight,
            currMinBlockHeight,
            blockHeight
          )

          // Iterate to the next block set.
          blockHeight -= interval

          // If no actions, nothing to do.
          if (!actions.length) continue

          // Transform totals into correct values.
          actions.forEach((action) => {
            if (action.total === undefined) {
              action.total = currentTotal
              // Since we are loading most recent first, we need to subtract the amount so the next (earlier) transaction gets the correct total set. The most recent transaction's total should equal the total amount pledged so far.
              currentTotal -=
                (action.type === CampaignActionType.Fund ? 1 : -1) *
                action.amount
            }
          })

          // Get date of earliest block if possible.
          let minBlockHeightDate = await getDateFromBlockHeight(
            client,
            currMinBlockHeight
          )
          // Fallback to date of earliest action (not super precise but good enough).
          if (!minBlockHeightDate)
            minBlockHeightDate = actions[actions.length - 1].when ?? null
          setEarliestDate(minBlockHeightDate)

          // Append to end of data.
          setActions((prev) => [...prev, ...actions])
        }
      } catch (error) {
        console.error(
          parseError(error, {
            source: "CampaignActionsContent load",
            campaign: campaign.address,
          })
        )
      } finally {
        setLoadingActions(false)
      }
    }

    client && !startedLoadingActions && load()
  }, [
    client,
    campaign,
    loadingActions,
    setLoadingActions,
    setActions,
    setEarliestDate,
  ])

  return (
    <>
      {loadingActions && <Loader />}

      {actions.length > 1 && (
        <div className="flex-1 max-w-sm my-4">
          <ContributionGraph campaign={campaign} actions={actions} />
        </div>
      )}
      {!!earliestDate && (
        <p className="text-placeholder italic mb-2">
          Data since {earliestDate.toLocaleString()}
        </p>
      )}

      <div className="w-full lg:w-3/5 max-h-[80vh] overflow-y-auto visible-scrollbar">
        {actions?.length ? (
          actions.map((item, idx) => (
            <CampaignAction key={idx} campaign={campaign} action={item} />
          ))
        ) : !loadingActions ? (
          <p>None yet.</p>
        ) : null}
      </div>
    </>
  )
}

// Fallback to loading screen if page has not yet been statically generated.
export const getStaticPaths: GetStaticPaths = () => ({
  paths: [],
  fallback: true,
})

const redirectToCampaigns = {
  redirect: {
    destination: campaigns404Path,
    permanent: false,
  },
}

export const getStaticProps: GetStaticProps<CampaignStaticProps> = async ({
  params: { address } = { address: undefined },
}) => {
  if (typeof address !== "string" || !address.trim()) return redirectToCampaigns

  try {
    const client = await getClient()
    if (!client) return redirectToCampaigns

    // If not valid contract address, perform name service lookup.
    const campaignAddress = escrowAddressRegex.test(address)
      ? address
      : await getDENSAddress(client, address)

    if (!campaignAddress) return redirectToCampaigns

    const createdBlockHeight = await contractInstantiationBlockHeight(
      client,
      campaignAddress
    )

    // Get campaign state.
    const state = await getCampaignState(client, campaignAddress)

    // Get gov token balances.
    const campaignGovTokenBalance = await getCW20WalletTokenBalance(
      client,
      state.gov_token_addr,
      campaignAddress
    )
    const daoGovTokenBalance = await getCW20WalletTokenBalance(
      client,
      state.gov_token_addr,
      state.dao_addr
    )

    // Get featured addresses.
    const featuredAddresses = await getFeaturedAddresses(client)

    // Get deNS address map.
    const densNames = await getDENSNames(client)
    const densAddresses = await Promise.all(
      densNames.map((name) => getDENSAddress(client, name))
    )
    const densAddressMap = createDENSAddressMap(densNames, densAddresses)

    // Transform data into campaign.
    const campaign = transformCampaign(
      campaignAddress,
      createdBlockHeight,
      state,
      campaignGovTokenBalance,
      daoGovTokenBalance,
      featuredAddresses,
      densAddressMap
    )

    if (!campaign) {
      console.error(
        parseError(
          "Transformed campaign is null.",
          {
            source: "Campaign.getStaticProps",
            campaign: campaignAddress,
            campaignGovTokenBalance,
            daoGovTokenBalance,
          },
          {
            extra: { state },
          }
        )
      )
      return redirectToCampaigns
    }

    return {
      props: { campaign },
      // Regenerate the page at most once per second.
      // Should serve cached copy and update after a refresh.
      revalidate: 1,
    }
  } catch (err) {
    console.error(
      parseError(err, {
        source: "Campaign.getStaticProps",
        address,
      })
    )
    return redirectToCampaigns
  }
}

export default Campaign
