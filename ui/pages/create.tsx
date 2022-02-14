import { coin } from "@cosmjs/stargate"
import type { NextPage } from "next"
import { useRouter } from "next/router"
import { FC, useCallback, useEffect, useState } from "react"
import { Controller, SubmitHandler, useForm } from "react-hook-form"
import { FaEye, FaEyeSlash } from "react-icons/fa"
import { IoCheckmark, IoWarning } from "react-icons/io5"
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
} from "../components"
import {
  cw20CodeId,
  daoUpDAOAddress,
  daoUpFee,
  daoUpFeeNum,
  defaultExecuteFee,
  escrowContractCodeId,
  fundingTokenDenom,
  payTokenSymbol,
} from "../config"
import {
  daoAddressPattern,
  numberPattern,
  prettyPrintDecimal,
  urlPattern,
} from "../helpers"
import { useWallet } from "../hooks"
import { defaultNewCampaign, newCampaignFields } from "../services"
import { daoConfig, globalLoadingAtom, signedCosmWasmClient } from "../state"
import { Color } from "../types"

const validUrlOrUndefined = (u: string | undefined) =>
  u && u.match(urlPattern.value) ? u : undefined

const Create: NextPage = () => (
  <>
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

const CreateContent: FC = () => {
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
    state: daoConfigState,
    contents: { config: daoConfigData, error: daoConfigError },
  } = useRecoilValueLoadable(
    // Only attempt to load DAO address once it matches the regex.
    daoConfig(daoAddressFormatValid ? watchDAOAddress : undefined)
  )
  const checkingDAO = daoConfigState === "loading"
  const validDAO = daoConfigState === "hasValue" && daoConfigData !== null
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

      try {
        const msg = {
          dao_address: newCampaign.daoAddress,
          cw20_code_id: cw20CodeId,

          funding_goal: coin(newCampaign.goal * 1e6, fundingTokenDenom),
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

        const { contractAddress } = await client.instantiate(
          walletAddress,
          escrowContractCodeId,
          msg,
          `[DAO Up!] ${newCampaign.name}`,
          defaultExecuteFee
        )

        return contractAddress
      } catch (error) {
        console.error(error)
        // TODO: Set better error messages.
        setCreateCampaignError(`${error}`)
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

      const address = await createCampaign(values as unknown as NewCampaign)

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
          <div className="flex items-center justify-between mb-8">
            <h1 className="font-semibold text-4xl">Create a new campaign</h1>
            <Button
              outline
              color={Color.Light}
              onClick={() => setShowCampaignDescriptionPreview((b) => !b)}
            >
              <div className="flex items-center gap-2">
                {showCampaignDescriptionPreview ? <FaEyeSlash /> : <FaEye />}
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
                  label={newCampaignFields.name.label}
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
                  label={newCampaignFields.description.label}
                  placeholder="Describe what your campaign is about.."
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
                  label={newCampaignFields.imageUrl.label}
                  placeholder="https://your.campaign/logo.svg"
                  type="url"
                  spellCheck={false}
                  autoCorrect="off"
                  error={errors.imageUrl?.message}
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
                  label={newCampaignFields.website.label}
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
                  label={newCampaignFields.twitter.label}
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
                  label={newCampaignFields.discord.label}
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

          <h2 className="font-semibold text-2xl mb-8">Funding details</h2>
          <div className="lg:mx-2">
            <FormInput
              label={newCampaignFields.goal.label}
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
              label={newCampaignFields.daoAddress.label}
              placeholder="juno..."
              type="text"
              error={
                (daoAddressFormatValid ? daoConfigError : null) ??
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
              label={newCampaignFields.tokenName.label}
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
              label={newCampaignFields.tokenSymbol.label}
              placeholder="TOKEN"
              type="text"
              error={errors.tokenSymbol?.message}
              {...register("tokenSymbol", {
                required: "Required",
                pattern: {
                  value: /^\s*[a-zA-Z-]{3,12}\s*$/,
                  message: "Must be between 3 and 12 alphabetical characters.",
                },
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
                  label={newCampaignFields.hidden.label}
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
