import cn from "classnames"
import type { NextPage } from "next"
import { NextRouter, useRouter } from "next/router"
import { FC, useEffect, useState } from "react"
import { useRecoilValue } from "recoil"

import {
  BalanceRefundCard,
  CampaignAction,
  CampaignDetails,
  CampaignStateCard,
  CenteredColumn,
  FundPendingCard,
  GovernanceCard,
  Loader,
  ResponsiveDecoration,
  Suspense,
  WalletMessage,
} from "../../components"
import { ContributeCard } from "../../components/ContributeCard"
import { useWallet } from "../../hooks/useWallet"
import { suggestToken } from "../../services/keplr"
import { fetchCampaign, fetchCampaignActions } from "../../state/campaigns"
import { Status } from "../../types"

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
  const campaignAddress =
    isReady && typeof query.address === "string" ? query.address : ""

  const { keplr, connected } = useWallet()

  const { campaign, error: campaignError } = useRecoilValue(
    fetchCampaign(campaignAddress)
  )

  const { actions, error: campaignActionsError } = useRecoilValue(
    fetchCampaignActions(campaignAddress)
  )

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
    status,

    dao: {
      url: daoUrl,
      govToken: { address: govTokenAddress },
    },
  } = campaign ?? {}

  const suggestFundingToken = async () =>
    keplr &&
    setShowAddFundingToken(
      !(await suggestToken(keplr, campaign.fundingToken.address))
    )
  const suggestGovToken = async () =>
    keplr && setShowAddGovToken(!(await suggestToken(keplr, govTokenAddress)))

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

            {!connected && <WalletMessage />}

            {status === Status.Pending ? (
              <FundPendingCard campaign={campaign} />
            ) : status === Status.Open ? (
              <ContributeCard
                campaign={campaign}
                suggestFundingToken={suggestFundingToken}
              />
            ) : undefined}
          </div>
          <div className="flex flex-col flex-wrap self-stretch">
            <CampaignStateCard campaign={campaign} />

            {/* TODO: Show for funded campaigns by storing initial fund amount in contract state and use that instead (since govTokenCampaignBalance won't remain constant). */}
            {status === Status.Open && <GovernanceCard campaign={campaign} />}
          </div>
        </div>

        {connected && (
          <BalanceRefundCard
            campaign={campaign}
            showAddGovToken={showAddGovToken}
            suggestGovToken={suggestGovToken}
            showAddFundingToken={showAddFundingToken}
            suggestFundingToken={suggestFundingToken}
          />
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
