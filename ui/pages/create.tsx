import cn from "classnames"
import type { NextPage } from "next"
import { FieldValues, SubmitHandler, useForm } from "react-hook-form"

import {
  Button,
  CenteredColumn,
  FormInput,
  FormTextArea,
  ResponsiveDecoration,
} from "../components"

const Create: NextPage = () => {
  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm()
  const onSubmit: SubmitHandler<FieldValues> = (values) => console.log(values)

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
          <h1 className="font-semibold text-4xl">Create a new campaign</h1>
          <p className="mt-4 mb-10">Description...</p>

          <FormInput
            label="Campaign Name"
            error={errors.name?.message}
            type="text"
            placeholder="Name"
            {...register("name", {
              required: true,
              pattern: /^.*\w.*$/,
            })}
          />

          <FormInput
            label="Funding Target"
            error={errors.goal?.message}
            type="number"
            inputMode="decimal"
            placeholder="10,000"
            className="!pr-28"
            tail={
              <div className="h-full px-6 rounded-full bg-light flex items-center text-center text-dark">
                USD
              </div>
            }
            {...register("goal", {
              required: true,
              pattern: /^.*\d.*$/,
            })}
          />

          <FormTextArea
            label="Campaign Description"
            placeholder="Describe what your campaign is about..."
            error={errors.description?.message}
            rows={8}
            {...register("description", {
              required: true,
              pattern: /^.*\w.*$/,
            })}
          />

          <Button submitLabel="Create" className="self-end" />
        </form>
      </CenteredColumn>
    </>
  )
}

export default Create
