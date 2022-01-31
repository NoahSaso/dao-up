import type { NextPage } from "next"
import { useRouter } from "next/router"
import {
  FieldValues,
  SubmitErrorHandler,
  SubmitHandler,
  useForm,
} from "react-hook-form"
import { useRecoilState } from "recoil"

import {
  Button,
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
    getValues,
  } = useForm({ defaultValues: newCampaign })

  const onSubmit: SubmitHandler<FieldValues> = (values, event) => {
    const nativeEvent = event?.nativeEvent as SubmitEvent
    const submitterValue = (nativeEvent?.submitter as HTMLInputElement)?.value

    const url =
      submitterValue === "Back"
        ? `/create/${id > 2 ? id - 1 : ""}`
        : `/create/${id + 1}`

    setNewCampaign({
      ...newCampaign,
      ...values,
    })
    router.push(url)
  }

  // Allow back press without required fields
  const onError: SubmitErrorHandler<FieldValues> = (_, event) => {
    const nativeEvent = event?.nativeEvent as SubmitEvent
    const submitterValue = (nativeEvent?.submitter as HTMLInputElement)?.value
    if (submitterValue === "Back") return onSubmit(getValues(), event)
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
        <form
          className="flex flex-col"
          onSubmit={handleSubmit(onSubmit, onError)}
        >
          <h1 className="font-semibold text-4xl mb-10">Campaign Details</h1>

          <FormInput
            label="Website"
            placeholder="https://your.campaign"
            type="text"
            error={errors.website?.message}
            {...register("website", {
              required: false,
              pattern: /^https:\/\/.+$/,
            })}
          />

          <FormInput
            label="Twitter"
            placeholder="@CampaignDAO"
            type="text"
            error={errors.twitter?.message}
            {...register("twitter", {
              required: false,
              pattern: /^@.+$/,
            })}
          />

          <FormInput
            label="Discord"
            placeholder="https://discord.gg/campaign"
            type="text"
            error={errors.discord?.message}
            {...register("discord", {
              required: false,
              pattern: /^https:\/\/discord\.gg\/.+$/,
            })}
          />

          <FormInput
            label="Image URL"
            placeholder="https://your.campaign/logo.svg"
            type="text"
            error={errors.imageUrl?.message}
            {...register("imageUrl", {
              required: false,
              pattern: /^https:\/\/.+$/,
            })}
          />

          <div className="flex flex-row justify-between align-center">
            <Button submitLabel="Back" />
            <Button submitLabel="Next" />
          </div>
        </form>
      </CenteredColumn>
    </>
  )
}

export default Create3
