import cn from "classnames"
import type { NextPage } from "next"
import { DetailedHTMLProps, FC, InputHTMLAttributes } from "react"
import { FieldValues, SubmitHandler, useForm } from "react-hook-form"

import {
  Button,
  CenteredColumn,
  Input as OldInput,
  InputProps as OldInputProps,
  ResponsiveDecoration,
} from "../components"

interface InputProps extends OldInputProps {
  label?: string
  error?: string
}

export const Input: FC<InputProps> = ({
  label,
  error,
  containerClassName,
  className,
  tailContainerClassName,
  ...props
}) => (
  <>
    {!!label && <label className="block pl-5 mb-2">{label}</label>}
    <OldInput
      containerClassName={cn("mb-10", containerClassName)}
      className={cn("!bg-dark !border-light", className)}
      tailContainerClassName={cn(
        // TODO: remove once tails have buttons
        // "bg-card rounded-full",
        tailContainerClassName
      )}
      {...props}
    />
    {!!error && <p className="pl-5 -mt-8 mb-10 text-orange">{error}</p>}
  </>
)

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
        name="create_orange_blur.png"
        width={406}
        height={486}
        className="top-0 right-0 opacity-70"
      />

      <CenteredColumn className="pt-10 max-w-4xl">
        <form className="flex flex-col" onSubmit={handleSubmit(onSubmit)}>
          <h1 className="font-semibold text-4xl">Create a new campaign</h1>
          <p className="mt-4 mb-10">Description...</p>

          <Input
            label="Campaign Name"
            error={errors.name?.message}
            type="text"
            placeholder="Name"
            {...register("name", {
              required: "Required",
            })}
          />

          <Input
            label="Funding Target"
            error={errors.name?.goal}
            type="number"
            inputMode="decimal"
            placeholder="10,000"
            {...register("goal", {
              required: "Required",
            })}
            className="!pr-28"
            tail={
              <div className="h-full px-6 rounded-full bg-light flex items-center text-center text-dark">
                USD
              </div>
            }
          />

          <Button submitLabel="Create" className="self-end" />
        </form>
      </CenteredColumn>
    </>
  )
}

export default Create
