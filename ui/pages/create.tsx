import { coin } from "@cosmjs/stargate"
import type { NextPage } from "next"
import Head from "next/head"
import { useRouter } from "next/router"
import { ReactNode, useCallback, useState } from "react"
import { useRecoilValue } from "recoil"

import {
  CenteredColumn,
  EditCampaignForm,
  ResponsiveDecoration,
  Suspense,
} from "@/components"
import {
  baseUrl,
  currentEscrowContractCodeId,
  cw20CodeId,
  title,
} from "@/config"
import { convertDenomToMicroDenom, parseError } from "@/helpers"
import { useWallet } from "@/hooks"
import { defaultNewCampaign, findPayTokenByDenom } from "@/services"
import { signedCosmWasmClient } from "@/state"

const Create: NextPage = () => (
  <>
    <Head>
      <title>{title} | Create</title>
      <meta
        property="twitter:title"
        content={`${title} | Create`}
        key="twitter:title"
      />
      <meta property="og:title" content={`${title} | Create`} key="og:title" />
      <meta property="og:url" content={`${baseUrl}/create`} key="og:url" />
    </Head>

    <ResponsiveDecoration
      name="campaigns_orange_blur.png"
      width={406}
      height={626}
      className="top-0 right-0 opacity-70"
    />

    <Suspense loader={{ overlay: true }}>
      <CreateContent />
    </Suspense>
  </>
)

const CreateContent = () => {
  const { push: routerPush } = useRouter()
  const { walletAddress } = useWallet()
  const client = useRecoilValue(signedCosmWasmClient)
  const [createCampaignError, setCreateCampaignError] = useState(
    null as ReactNode | null
  )

  const createCampaign = useCallback(
    async (newCampaign: NewCampaignInfo) => {
      setCreateCampaignError(null)

      if (!client) {
        setCreateCampaignError("Failed to get signing client.")
        return
      }
      if (!walletAddress) {
        setCreateCampaignError("Wallet not connected.")
        return
      }

      const payToken = findPayTokenByDenom(newCampaign.payTokenDenom)
      if (!payToken) {
        setCreateCampaignError("Invalid funding goal token selected.")
        return
      }

      const msg = {
        dao_address: newCampaign.daoAddress,
        cw20_code_id: cw20CodeId,

        funding_goal: coin(
          convertDenomToMicroDenom(newCampaign.goal, payToken.decimals),
          payToken.denom
        ),
        funding_token_name: newCampaign.tokenName,
        funding_token_symbol: newCampaign.tokenSymbol,

        campaign_info: {
          name: newCampaign.name,
          description: newCampaign.description,
          hidden: newCampaign.hidden,

          ...(newCampaign.website && { website: newCampaign.website }),
          ...(newCampaign.twitter && { twitter: newCampaign.twitter }),
          ...(newCampaign.discord && { discord: newCampaign.discord }),

          ...(newCampaign.profileImageUrl && {
            profile_image_url: newCampaign.profileImageUrl,
          }),
          description_image_urls: newCampaign.descriptionImageUrls,
        },
      }

      try {
        const { contractAddress } = await client.instantiate(
          walletAddress,
          currentEscrowContractCodeId,
          msg,
          `[DAO Up!] ${newCampaign.name}`,
          "auto"
        )

        // If the campaign was created successfully, redirect to the campaign page.
        if (contractAddress) await routerPush(`/campaign/${contractAddress}`)
      } catch (error) {
        console.error(error)
        // If the campaign was not created successfully, createCampaignError will show.
        setCreateCampaignError(
          parseError(
            error,
            {
              source: "createCampaign",
              wallet: walletAddress,
            },
            {
              extra: { msg },
            }
          )
        )
      }
    },
    [client, walletAddress, setCreateCampaignError, routerPush]
  )

  return (
    <>
      <ResponsiveDecoration
        name="campaigns_orange_blur.png"
        width={406}
        height={626}
        className="top-0 right-0 opacity-70"
      />

      <CenteredColumn className="py-6 max-w-3xl">
        <EditCampaignForm
          title={
            <h1 className="font-semibold text-4xl">Create a new campaign</h1>
          }
          submitLabel="Create campaign"
          error={createCampaignError}
          creating
          defaultValues={defaultNewCampaign()}
          onSubmit={createCampaign}
        />
      </CenteredColumn>
    </>
  )
}

export default Create
