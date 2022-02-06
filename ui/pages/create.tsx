import type { NextPage } from "next"
import { useRouter } from "next/router"
import { FC, useEffect } from "react"
import { Controller, SubmitHandler, useForm } from "react-hook-form"

import {
  Button,
  CenteredColumn,
  FormInput,
  FormSwitch,
  FormTextArea,
  ResponsiveDecoration,
  Suspense,
} from "../components"
import { junoAddressPattern, numberPattern, urlPattern } from "../helpers/form"
import { useCreateCampaign } from "../hooks/useCreateCampaign"
import useWallet from "../hooks/useWallet"
import { defaultNewCampaign, newCampaignFields } from "../services/campaigns"

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
  const { walletAddress } = useWallet()
  const router = useRouter()
  const { createCampaign, createCampaignError, setLoading } =
    useCreateCampaign(walletAddress)

  const {
    handleSubmit,
    register,
    formState: { errors },
    control,
  } = useForm({ defaultValues: defaultNewCampaign })

  // Scroll to bottom of page when error is displayed.
  useEffect(() => {
    if (createCampaignError)
      window.scrollTo({
        left: 0,
        top: document.body.scrollHeight,
        behavior: "smooth",
      })
  }, [createCampaignError])

  const onSubmit: SubmitHandler<Partial<NewCampaign>> = async (values) => {
    // TODO: Perform final validation here?
    const address = await createCampaign(
      values as unknown as NewCampaign,
      false
    )

    // If the campaign was created successfully, redirect to the campaign page.
    // If the campaign was not created successfully, createCampaignError will show.
    if (address) await router.push(`/campaign/${address}`)

    // Hide loading since we told createCampaign not to hide it when done.
    setLoading(false)
  }

  return (
    <>
      <ResponsiveDecoration
        name="campaigns_orange_blur.png"
        width={406}
        height={626}
        className="top-0 right-0 opacity-70"
      />

      <CenteredColumn className="py-10 max-w-4xl">
        <form className="flex flex-col" onSubmit={handleSubmit(onSubmit)}>
          <h1 className="font-semibold text-4xl mb-10">
            Create a new campaign
          </h1>

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
            placeholder="Describe what your campaign is about..."
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

          <FormInput
            label={newCampaignFields.goal.label}
            placeholder="10,000"
            type="number"
            inputMode="decimal"
            className="!pr-28"
            tail="JUNOX"
            error={errors.goal?.message}
            {...register("goal", {
              required: "Required",
              valueAsNumber: true,
              pattern: numberPattern,
              min: {
                value: 0.01,
                message: "Must be at least 0.01.",
              },
            })}
          />

          <FormInput
            label={newCampaignFields.daoAddress.label}
            placeholder="juno..."
            type="text"
            error={errors.daoAddress?.message}
            {...register("daoAddress", {
              required: "Required",
              pattern: junoAddressPattern,
            })}
          />

          <FormInput
            label={newCampaignFields.tokenName.label}
            description="The name of the tokens supporters will receive for their contributions. These become exchangeable for the DAO's governance tokens when funding succeeds."
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
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <FormSwitch
                label={newCampaignFields.hidden.label}
                description="Whether or not to hide this campaign from the public directory of active campaigns. You may want to turn this on if you plan to send a direct link to your community. Default is no."
                error={error?.message}
                onClick={() => onChange(!value)}
                on={!!value}
              />
            )}
          />

          <h2 className="font-semibold text-3xl mb-10">Community Platforms</h2>

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
                message: "Invalid Twitter handle. Ensure it starts with '@'.",
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

          {createCampaignError && (
            <p className="text-orange mb-4 self-end max-w-lg">
              {createCampaignError}
            </p>
          )}

          <Button submitLabel="Create Campaign" className="self-end" />
        </form>
      </CenteredColumn>
    </>
  )
}

export default Create
