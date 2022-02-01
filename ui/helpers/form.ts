import { useRouter } from "next/router"
import { useEffect } from "react"
import {
  FieldValues,
  SubmitErrorHandler,
  SubmitHandler,
  useForm,
} from "react-hook-form"
import { useRecoilState } from "recoil"

import { newCampaignFieldEntries } from "../services/campaigns"
import { newCampaignState } from "../services/state"

export const useNewCampaignForm = (id: number) => {
  const router = useRouter()
  const [newCampaign, setNewCampaign] = useRecoilState(newCampaignState)

  const {
    handleSubmit,
    register,
    formState: { errors },
    getValues,
    watch,
    control,
  } = useForm({ defaultValues: newCampaign })

  // Ensure all previous fields are valid.
  useEffect(() => {
    // Route to the first page with an invalid required field.
    const pastInvalidRequiredField = newCampaignFieldEntries.find(
      ([field, { pageId, required }]) => {
        if (!required || pageId >= id) return false

        const value = newCampaign[field as keyof NewCampaign]
        return (
          (typeof value === "string" && !value.trim()) ||
          (typeof value === "number" && value < 0) ||
          value === undefined
        )
      }
    )?.[1]
    console.log(pastInvalidRequiredField)

    if (pastInvalidRequiredField)
      router.push(
        `/create/${
          pastInvalidRequiredField.pageId === 1
            ? ""
            : pastInvalidRequiredField.pageId
        }`
      )
  }, [id, router, newCampaign])

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

  return {
    formOnSubmit: handleSubmit(onSubmit, onError),
    errors,
    register,
    getValues,
    watch,
    control,
  }
}
