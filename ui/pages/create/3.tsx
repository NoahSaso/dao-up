import type { NextPage } from "next"
import { useRouter } from "next/router"
import { FieldValues, SubmitHandler, useForm } from "react-hook-form"
import { useRecoilState } from "recoil"

import {
  Button,
  ButtonLink,
  CenteredColumn,
  FormInput,
  ResponsiveDecoration,
} from "../../components"
import { newCampaignState } from "../../services/state"

let id = 3

const Create3: NextPage = () => {
  const router = useRouter()
  const [newCampaign, setNewCampaign] = useRecoilState(newCampaignState)

  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm({ defaultValues: newCampaign })

  const onSubmit: SubmitHandler<FieldValues> = (values) => {
    setNewCampaign({
      ...newCampaign,
      ...values,
    })
    router.push(`/create/${id + 1}`)
  }

  return (
    <>
      <ResponsiveDecoration
        name="campaigns_orange_blur.png"
        width={406}
        height={626}
        className="top-0 right-0 opacity-70"
      />

      <CenteredColumn className="pt-10 max-w-4xl">
        <form className="flex flex-col" onSubmit={handleSubmit(onSubmit)}>
          <h1 className="font-semibold text-4xl mb-10">Campaign Details</h1>

          <FormInput
            label="Website"
            error={errors.website?.message}
            type="text"
            placeholder="https://your.campaign"
            {...register("website", {
              required: false,
              pattern: /^https:\/\/.+$/,
            })}
          />

          <FormInput
            label="Twitter"
            error={errors.twitter?.message}
            type="text"
            placeholder="@CampaignDAO"
            {...register("twitter", {
              required: false,
              pattern: /^@.+$/,
            })}
          />

          <FormInput
            label="Discord"
            error={errors.discord?.message}
            type="text"
            placeholder="https://discord.gg/campaign"
            {...register("discord", {
              required: false,
              pattern: /^https:\/\/discord\.gg\/.+$/,
            })}
          />

          <FormInput
            label="Image URL"
            error={errors.imageUrl?.message}
            type="text"
            placeholder="https://your.campaign/logo.svg"
            {...register("imageUrl", {
              required: false,
              pattern: /^https:\/\/.+$/,
            })}
          />

          <div className="flex flex-row justify-between align-center">
            <ButtonLink href={`/create/${id - 1}`}>Back</ButtonLink>
            <Button submitLabel="Next" />
          </div>
        </form>
      </CenteredColumn>
    </>
  )
}

export default Create3
