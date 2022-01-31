import type { NextPage } from "next"
import { useRouter } from "next/router"
import { FieldValues, SubmitHandler, useForm } from "react-hook-form"
import { useRecoilState } from "recoil"

import {
  Button,
  ButtonLink,
  CenteredColumn,
  FormInput,
  FormTextArea,
  ResponsiveDecoration,
} from "../../components"
import { newCampaignState } from "../../services/state"

let id = 2

const Create2: NextPage = () => {
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
          <h1 className="font-semibold text-4xl">
            Give your DAO a name and description.
          </h1>
          <p className="mt-4 mb-10">
            If your campaign reaches its funding goal, a DAO will be created
            with the following details.
          </p>

          <FormInput
            label="DAO Name"
            placeholder="Name"
            type="text"
            error={errors.daoName?.message}
            {...register("daoName", {
              required: true,
              pattern: /\S/,
            })}
          />

          <FormTextArea
            label="DAO Description"
            placeholder="Describe what your DAO is about..."
            rows={8}
            error={errors.daoDescription?.message}
            {...register("daoDescription", {
              required: true,
              pattern: /\S/,
            })}
          />

          <div className="flex flex-row justify-between align-center">
            <ButtonLink href="/create">Back</ButtonLink>
            <Button submitLabel="Next" />
          </div>
        </form>
      </CenteredColumn>
    </>
  )
}

export default Create2
