import { coin } from "@cosmjs/stargate"
import type { NextPage } from "next"
import Head from "next/head"
import { useRouter } from "next/router"
import { useCallback, useEffect, useState } from "react"
import { Controller, SubmitHandler, useForm } from "react-hook-form"
import { IoCheckmark, IoEye, IoEyeOff, IoWarning } from "react-icons/io5"
import {
  useRecoilValue,
  useRecoilValueLoadable,
  useSetRecoilState,
} from "recoil"

import {
  Button,
  CampaignDetails,
  CenteredColumn,
  FormInput,
  FormSwitch,
  FormTextArea,
  Loader,
  ResponsiveDecoration,
  Suspense,
} from "@/components"
import {
  baseUrl,
  cw20CodeId,
  daoUpDAOAddress,
  daoUpFee,
  daoUpFeeNum,
  escrowContractCodeId,
  minPayTokenSymbol,
  payTokenSymbol,
  title,
} from "@/config"
import {
  daoAddressPattern,
  numberPattern,
  parseError,
  prettyPrintDecimal,
  tokenSymbolPattern,
  urlPattern,
} from "@/helpers"
import { useWallet } from "@/hooks"
import { defaultNewCampaign } from "@/services"
import { globalLoadingAtom, signedCosmWasmClient, validateDAO } from "@/state"
import { Color } from "@/types"

const validUrlOrUndefined = (u: string | undefined) =>
  u && u.match(urlPattern.value) ? u : undefined

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
  const { walletAddress, connect, connected, connectError } = useWallet()
  const client = useRecoilValue(signedCosmWasmClient)
  const setLoading = useSetRecoilState(globalLoadingAtom)
  const [createCampaignError, setCreateCampaignError] = useState(
    null as string | null
  )
  const [pendingCampaignCreation, setPendingCampaignCreation] = useState(
    null as Partial<NewCampaign> | null
  )

  const {
    handleSubmit,
    register,
    formState: { errors },
    control,
    watch,
    setValue,
  } = useForm({ defaultValues: defaultNewCampaign })

  // Automatically verify DAO contract address exists on chain.
  const watchDAOAddress = watch("daoAddress")
  const daoAddressFormatValid = !!watchDAOAddress?.match(
    daoAddressPattern.value
  )?.length
  const {
    state: daoValidateState,
    contents: { valid: daoValid, error: daoValidateError },
  } = useRecoilValueLoadable(
    // Only attempt to validate DAO address once it matches the regex.
    validateDAO(daoAddressFormatValid ? watchDAOAddress : undefined)
  )
  const checkingDAO = daoValidateState === "loading"
  const validDAO = daoValidateState === "hasValue" && !!daoValid
  // Only invalid if pattern matches AND has determined invalid address.
  const invalidDAO = daoAddressFormatValid && !validDAO

  // Compute relevant goal fee amounts.
  const watchGoal = watch("goal") ?? 0
  const goalReceived = watchGoal ? watchGoal * (1 - daoUpFeeNum) : undefined
  const raiseToGoal = watchGoal
    ? Math.ceil(watchGoal / (1 - daoUpFeeNum))
    : undefined

  // Information for displaying campaign preview.
  const campaignName = watch("name")
  const campaignImageUrl = validUrlOrUndefined(watch("imageUrl"))
  const campaignDescription = watch("description")

  const campaignWebsite = validUrlOrUndefined(watch("website"))
  const campaignDiscord = validUrlOrUndefined(watch("discord"))
  const campaignTwitter = watch("twitter")

  const [showCampaignDescriptionPreview, setShowCampaignDescriptionPreview] =
    useState(false)

  // Scroll to bottom of page when error is displayed.
  useEffect(() => {
    if (createCampaignError || connectError)
      window.scrollTo({
        left: 0,
        top: document.body.scrollHeight,
        behavior: "smooth",
      })
  }, [createCampaignError, connectError])

  const createCampaign = useCallback(
    async (newCampaign: NewCampaign) => {
      setCreateCampaignError(null)

      if (!client) {
        setCreateCampaignError("Failed to get signing client.")
        return
      }
      if (!walletAddress) {
        setCreateCampaignError("Wallet not connected.")
        return
      }

      setLoading(true)

      const msg = {
        dao_address: newCampaign.daoAddress,
        cw20_code_id: cw20CodeId,

        // Round so that this value is an integer in case JavaScript does any weird floating point stuff.
        funding_goal: coin(
          Math.round(newCampaign.goal * 1e6),
          minPayTokenSymbol
        ),
        funding_token_name: newCampaign.tokenName,
        funding_token_symbol: newCampaign.tokenSymbol,

        fee: daoUpFee,
        fee_receiver: daoUpDAOAddress,

        campaign_info: {
          name: newCampaign.name,
          description: newCampaign.description,
          hidden: newCampaign.hidden,

          ...(newCampaign.imageUrl && { image_url: newCampaign.imageUrl }),
          ...(newCampaign.website && { website: newCampaign.website }),
          ...(newCampaign.twitter && { twitter: newCampaign.twitter }),
          ...(newCampaign.discord && { discord: newCampaign.discord }),
        },
      }

      try {
        const { contractAddress } = await client.instantiate(
          walletAddress,
          escrowContractCodeId,
          msg,
          `[DAO Up!] ${newCampaign.name}`,
          "auto"
        )

        return contractAddress
      } catch (error) {
        console.error(error)
        setCreateCampaignError(
          parseError(error, {
            source: "createCampaign",
            wallet: walletAddress,
            msg,
          })
        )
      }
      // Don't stop loading until we've redirected or not. Handled elsewhere.
    },
    [setLoading, client, walletAddress, setCreateCampaignError]
  )

  const onSubmit: SubmitHandler<Partial<NewCampaign>> = useCallback(
    async (values) => {
      // Connect to wallet if necessary.
      if (!connected) {
        setPendingCampaignCreation(values)
        await connect()
        return
      }

      const newCampaignValues = values as unknown as NewCampaign
      // Clean values before creating campaign.
      newCampaignValues.name = newCampaignValues.name.trim()
      newCampaignValues.description = newCampaignValues.description.trim()
      newCampaignValues.tokenName = newCampaignValues.tokenName.trim()
      newCampaignValues.tokenSymbol = newCampaignValues.tokenSymbol.trim()

      const address = await createCampaign(newCampaignValues)

      // If the campaign was created successfully, redirect to the campaign page.
      // If the campaign was not created successfully, createCampaignError will show.
      if (address) await routerPush(`/campaign/${address}`)

      // Hide loading since we told createCampaign not to hide it when done.
      setLoading(false)
    },
    [
      createCampaign,
      connected,
      setLoading,
      connect,
      routerPush,
      setPendingCampaignCreation,
    ]
  )

  // Fire pending creation after connection succeeds.
  useEffect(() => {
    if (connected && pendingCampaignCreation) {
      onSubmit(pendingCampaignCreation)
      setPendingCampaignCreation(null)
    }
  }, [
    connected,
    createCampaign,
    pendingCampaignCreation,
    setPendingCampaignCreation,
    onSubmit,
  ])

  return (
    <>
      <ResponsiveDecoration
        name="campaigns_orange_blur.png"
        width={406}
        height={626}
        className="top-0 right-0 opacity-70"
      />

      <CenteredColumn className="py-6 max-w-3xl">
        <form className="flex flex-col" onSubmit={handleSubmit(onSubmit)}>
          <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
            <h1 className="font-semibold text-4xl">Create a new campaign</h1>

            <Button
              outline
              color={Color.Light}
              onClick={() => setShowCampaignDescriptionPreview((b) => !b)}
            >
              <div className="flex items-center gap-2">
                {showCampaignDescriptionPreview ? (
                  <IoEyeOff size={20} />
                ) : (
                  <IoEye size={20} />
                )}
                Preview
              </div>
            </Button>
          </div>

          {showCampaignDescriptionPreview ? (
            <div className="w-full self-center mb-8 border border-light p-8 rounded-3xl">
              <CampaignDetails
                name={campaignName || "Your campaign"}
                description={campaignDescription || "Your campaign description"}
                imageUrl={campaignImageUrl}
                website={campaignWebsite}
                twitter={campaignTwitter}
                discord={campaignDiscord}
              />
            </div>
          ) : (
            <>
              <div className="lg:mx-2">
                <FormInput
                  label="Name"
                  placeholder="Name"
                  type="text"
                  error={errors.name?.message}
                  {...register("name", {
                    required: "Required",
                    pattern: {
                      value: /\S/,
                      message: "Invalid name.",
                    },
                  })}
                />

                <FormTextArea
                  label="Description"
                  placeholder="Describe what your campaign is about (supports markdown)..."
                  rows={8}
                  error={errors.description?.message}
                  {...register("description", {
                    required: "Required",
                    pattern: {
                      value: /\S/,
                      message: "Invalid description.",
                    },
                  })}
                />

                <FormInput
                  label="Image URL"
                  placeholder="https://your.campaign/logo.png"
                  type="url"
                  spellCheck={false}
                  autoCorrect="off"
                  error={errors.imageUrl?.message}
                  // Warn user that SVGs will not be supported in link previews.
                  accent={
                    campaignImageUrl?.endsWith(".svg")
                      ? "SVG images will not show up in link previews. We recommend using a JPG or PNG instead."
                      : undefined
                  }
                  {...register("imageUrl", {
                    required: false,
                    pattern: urlPattern,
                  })}
                />
              </div>

              <h2 className="font-semibold text-2xl mb-8">
                Community Platforms
              </h2>

              <div className="lg:mx-2">
                <FormInput
                  label="Website"
                  placeholder="https://your.campaign"
                  type="url"
                  spellCheck={false}
                  autoCorrect="off"
                  error={errors.website?.message}
                  {...register("website", {
                    required: false,
                    pattern: urlPattern,
                  })}
                />

                <FormInput
                  label="Twitter"
                  placeholder="@CampaignDAO"
                  type="text"
                  error={errors.twitter?.message}
                  {...register("twitter", {
                    required: false,
                    pattern: {
                      value: /^@.+$/,
                      message:
                        "Invalid Twitter handle. Ensure it starts with '@'.",
                    },
                  })}
                />

                <FormInput
                  label="Discord"
                  placeholder="https://discord.gg/campaign"
                  type="url"
                  spellCheck={false}
                  autoCorrect="off"
                  error={errors.discord?.message}
                  {...register("discord", {
                    required: false,
                    pattern: {
                      value: /^https:\/\/discord\.gg\/.+$/,
                      message:
                        "Invalid Discord invite. Ensure it starts with 'https://discord.gg/'",
                    },
                  })}
                />
              </div>
            </>
          )}

          <h2 className="font-semibold text-2xl mb-8">Funding Details</h2>

          <div className="lg:mx-2">
            <FormInput
              label="Funding Target"
              placeholder="10,000"
              type="number"
              inputMode="decimal"
              className="!pr-28"
              tail={payTokenSymbol}
              error={errors.goal?.message}
              accent={
                goalReceived && raiseToGoal ? (
                  <>
                    DAO Up! will take a 3% cut and you&apos;ll receive{" "}
                    <span className="text-light">
                      {prettyPrintDecimal(goalReceived)} {payTokenSymbol}
                    </span>
                    .{" "}
                    <Button
                      bare
                      className="inline underline"
                      onClick={() => setValue("goal", raiseToGoal)}
                    >
                      Raise {prettyPrintDecimal(raiseToGoal)} {payTokenSymbol}
                    </Button>{" "}
                    to receive {prettyPrintDecimal(watchGoal)} {payTokenSymbol}.
                  </>
                ) : undefined
              }
              {...register("goal", {
                required: "Required",
                valueAsNumber: true,
                pattern: numberPattern,
                min: {
                  value: 1e-6,
                  message: "Must be at least 0.000001.",
                },
              })}
            />

            <FormInput
              label="DAO Address"
              placeholder="juno..."
              type="text"
              error={
                (daoAddressFormatValid ? daoValidateError : null) ??
                errors.daoAddress?.message
              }
              tail={
                checkingDAO ? (
                  <Loader size={28} />
                ) : validDAO ? (
                  <IoCheckmark size={28} className="text-green" />
                ) : invalidDAO ? (
                  <IoWarning size={28} className="text-orange" />
                ) : undefined
              }
              tailClassName="!bg-dark"
              className="!pr-24"
              {...register("daoAddress", {
                required: "Required",
                pattern: daoAddressPattern,
                validate: () => validDAO,
              })}
            />

            <FormInput
              label="Campaign Token Name"
              description="The name of the tokens backers will receive for their contributions. These become exchangeable for the DAO's governance tokens when funding succeeds."
              placeholder="Funding Token"
              type="text"
              error={errors.tokenName?.message}
              {...register("tokenName", {
                required: "Required",
                pattern: {
                  value: /\S/,
                  message: "Invalid token name.",
                },
              })}
            />

            <FormInput
              label="Campaign Token Symbol"
              placeholder="TOKEN"
              type="text"
              error={errors.tokenSymbol?.message}
              {...register("tokenSymbol", {
                required: "Required",
                pattern: tokenSymbolPattern,
                minLength: {
                  value: 3,
                  message: "Must be at least 3 characters.",
                },
                maxLength: {
                  value: 12,
                  message: "Must be 12 or fewer characters.",
                },
              })}
            />

            <Controller
              control={control}
              name="hidden"
              render={({
                field: { onChange, value },
                fieldState: { error },
              }) => (
                <FormSwitch
                  label="Hide from public campaigns list"
                  description="Whether or not to hide this campaign from the public directory of active campaigns. You may want to turn this on if you plan to send a direct link to your community. Default is no."
                  error={error?.message}
                  onClick={() => onChange(!value)}
                  on={!!value}
                />
              )}
            />
          </div>

          {!!(createCampaignError || connectError) && (
            <p className="text-orange mb-4 self-end max-w-lg">
              {createCampaignError ?? connectError}
            </p>
          )}

          <Button submitLabel="Create Campaign" className="self-end" />
        </form>
      </CenteredColumn>
    </>
  )
}

export default Create
