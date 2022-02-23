import { CosmWasmClient } from "@cosmjs/cosmwasm-stargate"
import type { GetStaticPaths, GetStaticProps, NextPage } from "next"
import Head from "next/head"
import { NextRouter, useRouter } from "next/router"
import { FunctionComponent, useEffect, useState } from "react"
import { useRecoilValue } from "recoil"

import {
  Alert,
  BalanceRefundJoinCard,
  Button,
  ButtonLink,
  CampaignAction,
  CampaignDetails,
  CampaignInfoCard,
  CenteredColumn,
  ContributeForm,
  ContributionGraph,
  GovernanceCard,
  Loader,
  ProposeFundPendingCard,
  ResponsiveDecoration,
  Suspense,
  WalletMessage,
} from "@/components"
import {
  baseUrl,
  daoUrlPrefix,
  featuredListContractAddress,
  rpcEndpoint,
  title,
} from "@/config"
import { escrowAddressRegex, parseError } from "@/helpers"
import { useRefundJoinDAOForm, useWallet } from "@/hooks"
import { suggestToken } from "@/services"
import {
  // fetchCampaign,
  fetchCampaignActions,
  walletTokenBalance,
} from "@/state"
import { Status } from "@/types"

interface CampaignStaticProps {
  campaign?: Campaign
}

export const Campaign: NextPage<CampaignStaticProps> = ({ campaign }) => {
  const router = useRouter()

  // Redirect to campaigns page if invalid query string.
  useEffect(() => {
    if (
      router.isReady &&
      // No props on fallback page, so don't redirect until page is actually in an invalid state.
      !router.isFallback &&
      (typeof router.query.address !== "string" ||
        !escrowAddressRegex.test(router.query.address))
    ) {
      console.error("Invalid query address.")
      router.push("/campaigns")
      return
    }
  }, [router])

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
              content={`${baseUrl}/campaign/${campaign.address}`}
              key="og:url"
            />
          </>
        ) : (
          <title>DAO Up! | Loading...</title>
        )}

        {!!campaign?.imageUrl && (
          <meta
            name="twitter:image"
            content={campaign.imageUrl}
            key="twitter:image"
          />
        )}
        {/* OpenGraph does not support SVG images. */}
        {!!campaign?.imageUrl && !campaign.imageUrl.endsWith(".svg") && (
          <meta
            property="og:image"
            content={campaign.imageUrl}
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
        <CampaignContent router={router} campaign={campaign} />
      </Suspense>
    </>
  )
}

interface CampaignContentProps {
  router: NextRouter
  campaign?: Campaign
}

const CampaignContent: FunctionComponent<CampaignContentProps> = ({
  router: { isReady, query, push: routerPush, isFallback },
  campaign,
}) => {
  const campaignAddress =
    isReady &&
    typeof query.address === "string" &&
    escrowAddressRegex.test(query.address)
      ? query.address
      : ""

  const { keplr, connected } = useWallet()

  // const { campaign, error: campaignError } = useRecoilValue(
  //   fetchCampaign(campaignAddress)
  // )

  // If no campaign when there should be a campaign, navigate to campaigns list.
  useEffect(() => {
    if (isReady && !isFallback && !campaign) routerPush("/campaigns")
  }, [isReady, isFallback, campaign, routerPush])

  // Funding token balance to add 'Join DAO' message to funded banner on top.
  const { balance: fundingTokenBalance } = useRecoilValue(
    walletTokenBalance(campaign?.fundingToken?.address)
  )

  // Display buttons to add tokens to wallet.
  const [showAddFundingToken, setShowAddFundingToken] = useState(false)
  const [showAddGovToken, setShowAddGovToken] = useState(false)

  // Display successful fund pending alert by setting the URL to the proposal.
  const [fundCampaignProposalUrl, setFundCampaignProposalUrl] = useState("")
  // Display successful contribution alert.
  const [showContributionSuccessAlert, setShowContributionSuccessAlert] =
    useState(false)
  // Display successful join DAO alert.
  const [showJoinDAOSuccessAlert, setShowJoinDAOSuccessAlert] = useState(false)

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
    if (status === Status.Funded) {
      // Hide contribution success message in case user joins the DAO from there.
      setShowContributionSuccessAlert(false)

      // Show success message.
      setShowJoinDAOSuccessAlert(true)

      // Attempt to add token to Keplr if receiving governance tokens.
      await suggestGovToken()
    }
  }
  // Refund / Join DAO Form for joining DAO from funded banner and last contributor's contribution alert.
  // The last contributor to the campaign (the one who causes the change from open to funded)
  // will receive a special message prompting them to join the DAO immediately.
  const { onSubmit: onSubmitRefundJoinDAO } = useRefundJoinDAOForm(
    campaign ?? null,
    onRefundJoinDAOSuccess
  )

  // If page not ready or is fallback, display loader.
  if (!isReady || isFallback) return <Loader overlay />
  // Display nothing (redirecting to campaigns list, so this is just a type check).
  if (!campaign) return null

  const {
    name,
    status,

    dao: { address: daoAddress, url: daoUrl },
  } = campaign

  return (
    <>
      {status === Status.Funded && (
        <p className="bg-green text-dark text-center w-full px-12 py-2">
          {name} has been successfully funded!{" "}
          {/* If user has funding tokens and the campaign is funded, make it easy for them to join. */}
          {fundingTokenBalance ? (
            <form onSubmit={onSubmitRefundJoinDAO} className="inline-block">
              <Button
                submitLabel="Click here to join the DAO."
                className="underline"
                bare
              />
            </form>
          ) : (
            <a
              href={daoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:no-underline"
            >
              Click here to visit the DAO.
            </a>
          )}
        </p>
      )}

      <CenteredColumn className="pt-10 pb-12 sm:pt-20 xl:w-8/12">
        <div className="flex flex-col justify-start items-center gap-8 lg:flex-row lg:justify-between lg:items-stretch">
          <div className="flex flex-col items-stretch gap-8 w-full lg:w-3/5 lg:shrink-0">
            <CampaignDetails {...campaign} />

            {!connected && <WalletMessage />}

            {status === Status.Pending ? (
              <ProposeFundPendingCard
                campaign={campaign}
                onSuccess={(proposalId: string) =>
                  // Show success message with proposal URL.
                  setFundCampaignProposalUrl(
                    `${daoUrlPrefix}${daoAddress}/proposals/${proposalId}`
                  )
                }
              />
            ) : status === Status.Open ? (
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

            <CampaignInfoCard campaign={campaign} className="lg:hidden" />

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
            <CampaignInfoCard campaign={campaign} className="hidden lg:block" />

            {/* TODO: Show for funded campaigns by storing initial fund amount in contract state and use that instead (since govTokenCampaignBalance won't remain constant). */}
            {status === Status.Open && <GovernanceCard campaign={campaign} />}
          </div>
        </div>

        <h2 className="text-green text-xl mt-8 mb-2">Activity</h2>

        <Suspense>
          <CampaignActionsContent campaignAddress={campaignAddress} />
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
        visible={showContributionSuccessAlert}
        hide={() => setShowContributionSuccessAlert(false)}
        title="Contribution successful!"
      >
        {status === Status.Funded ? (
          <>
            <p>
              The campaign is now funded and you can join the{" "}
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
              )}
              ! Join by clicking the button below.
            </p>

            <form onSubmit={onSubmitRefundJoinDAO}>
              <Button submitLabel="Join DAO" className="mt-5" cardOutline />
            </form>
          </>
        ) : (
          <p>
            Once the campaign is fully funded, return to this page to join the{" "}
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
            )}
            .
          </p>
        )}
      </Alert>

      {/* Join DAO success alert. */}
      <Alert
        visible={showJoinDAOSuccessAlert}
        hide={() => setShowJoinDAOSuccessAlert(false)}
        title="You've joined the DAO!"
      >
        <p>
          You will vote in the{" "}
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
          on DAO DAO going forward.
        </p>

        <ButtonLink href={daoUrl} className="mt-5" cardOutline>
          Visit the DAO
        </ButtonLink>
      </Alert>
    </>
  )
}

interface CampaignActionsContentProps {
  campaignAddress: string
}

const CampaignActionsContent: React.FC<CampaignActionsContentProps> = ({
  campaignAddress,
}) => {
  const { actions, error: campaignActionsError } = useRecoilValue(
    fetchCampaignActions(campaignAddress)
  )

  return campaignActionsError ? (
    <p className="text-orange my-4 w-full lg:w-3/5">{campaignActionsError}</p>
  ) : (
    <>
      {actions && actions.length > 1 && (
        <div className="flex-1 max-w-sm my-4">
          <ContributionGraph actions={actions} />
        </div>
      )}

      <div className="w-full lg:w-3/5 max-h-[80vh] overflow-y-auto visible-scrollbar">
        {actions?.length ? (
          actions.map((item, idx) => <CampaignAction key={idx} action={item} />)
        ) : (
          <p>None yet.</p>
        )}
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
    destination: "/campaigns",
    permanent: false,
  },
}

// TODO: Organize campaign fetching and translation code since it is identical to the Recoil selectors.
// TODO: This code should definitely be DRY and is not.
export const getStaticProps: GetStaticProps<CampaignStaticProps> = async ({
  params,
}) => {
  const campaignAddress =
    params &&
    typeof params.address === "string" &&
    escrowAddressRegex.test(params.address)
      ? params.address
      : ""

  if (!campaignAddress) return redirectToCampaigns

  try {
    const client = await CosmWasmClient.connect(rpcEndpoint)
    if (!client) return redirectToCampaigns

    // Get featured list.
    const featuredAddresses = (
      (await client.queryContractSmart(featuredListContractAddress, {
        list_members: {},
      })) as AddressPriorityListResponse
    ).members.map(({ addr }) => addr)

    const cState = await client.queryContractSmart(campaignAddress, {
      dump_state: {},
    })

    const {
      campaign_info: campaignInfo,
      funding_token_info: fundingTokenInfo,
      gov_token_info: govTokenInfo,
      ...state
    } = cState

    if (!fundingTokenInfo || !govTokenInfo) return redirectToCampaigns

    // Get gov token balances.
    const { balance: campaignGovTokenBalance } =
      await client.queryContractSmart(state.gov_token_addr, {
        balance: { address: campaignAddress },
      })
    const { balance: daoGovTokenBalance } = await client.queryContractSmart(
      state.gov_token_addr,
      {
        balance: { address: state.dao_addr },
      }
    )

    // Example: status={ "pending": {} }
    const status = Object.keys(state.status)[0] as Status

    const campaign = {
      address: campaignAddress,
      name: campaignInfo.name,
      description: campaignInfo.description,
      imageUrl: campaignInfo.image_url,

      status,
      creator: state.creator,
      hidden: campaignInfo.hidden,
      featured: featuredAddresses.includes(campaignAddress),

      goal: Number(state.funding_goal.amount) / 1e6,
      pledged: Number(state.funds_raised.amount) / 1e6,

      dao: {
        address: state.dao_addr,
        url: daoUrlPrefix + state.dao_addr,
      },

      govToken: {
        address: state.gov_token_addr,
        name: govTokenInfo.name,
        symbol: govTokenInfo.symbol,
        campaignBalance: Number(campaignGovTokenBalance) / 1e6,
        daoBalance: Number(daoGovTokenBalance) / 1e6,
        supply: Number(govTokenInfo.total_supply) / 1e6,
      },

      fundingToken: {
        address: state.funding_token_addr,
        ...(status === Status.Open && {
          price: Number(state.status[status].token_price),
          // Funding tokens are minted on-demand, so calculate the total that will ever exist
          // by multiplying the price of one token (in JUNO) by the goal (in JUNO).
          supply:
            (Number(state.funding_goal.amount) *
              Number(state.status[status].token_price)) /
            1e6,
        }),
        name: fundingTokenInfo.name,
        symbol: fundingTokenInfo.symbol,
      },

      website: campaignInfo.website,
      twitter: campaignInfo.twitter,
      discord: campaignInfo.discord,
    }

    return {
      props: { campaign },
      // Regenerate the page once every hour.
      revalidate: 60 * 60,
    }
  } catch (err) {
    console.error(
      parseError(err, {
        source: "Campaign.getStaticProps",
        campaign: campaignAddress,
      })
    )
    return redirectToCampaigns
  }
}

export default Campaign
