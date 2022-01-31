import type { NextPage } from "next"

import {
  Button,
  CenteredColumn,
  FormInput,
  FormTextArea,
  ResponsiveDecoration,
} from "../../components"
import { useNewCampaignForm } from "../../helpers/form"

const Create2: NextPage = () => {
  const { formOnSubmit, register, errors } = useNewCampaignForm(2)

  return (
    <>
      <ResponsiveDecoration
        name="campaigns_orange_blur.png"
        width={406}
        height={626}
        className="top-0 right-0 opacity-70"
      />

      <CenteredColumn className="py-10 max-w-4xl">
        <form className="flex flex-col" onSubmit={formOnSubmit}>
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
              required: "Required",
              pattern: /\S/,
            })}
          />

          <FormTextArea
            label="DAO Description"
            placeholder="Describe what your DAO is about..."
            rows={8}
            error={errors.daoDescription?.message}
            {...register("daoDescription", {
              required: "Required",
              pattern: /\S/,
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

export default Create2
