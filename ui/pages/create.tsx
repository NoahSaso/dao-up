import type { NextPage } from "next"
import { useRouter } from "next/router"
import { FC } from "react"
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
import { useCreateCampaign } from "../hooks/useCampaign"
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
  const createCampaign = useCreateCampaign(walletAddress)

  const {
    handleSubmit,
    register,
    formState: { errors },
    control,
  } = useForm({ defaultValues: defaultNewCampaign })

  const onSubmit: SubmitHandler<Partial<NewCampaign>> = async (values) => {
    // TODO: Perform final validation here?
    try {
      const address = await createCampaign(values as unknown as NewCampaign)

      router.push(`/campaign/${address}`)
    } catch (error) {
      console.error(error)
      // TODO: Display error.
    }
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
          <h1 className="font-semibold text-4xl">Create a new campaign</h1>
          <p className="mt-4 mb-10">Description...</p>

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
            tail="USD"
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

          <Controller
            control={control}
            name="displayPublicly"
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <FormSwitch
                label={newCampaignFields.displayPublicly.label}
                description="Whether or not to display this campaign in the public directory of active campaigns. You may want to turn this off if you plan to send a direct link to your community. Default is yes."
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

          <Button submitLabel="Create Campaign" className="self-end" />
        </form>
      </CenteredColumn>
    </>
  )
}

export default Create
