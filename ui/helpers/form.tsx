import cn from "classnames"
import { useRouter } from "next/router"
import { useEffect, useState } from "react"
import {
  FieldValues,
  SubmitErrorHandler,
  SubmitHandler,
  useForm,
} from "react-hook-form"
import { useRecoilState } from "recoil"

import { Button } from "../components"
import { newCampaignFieldEntries } from "../services/campaigns"
import { newCampaignState } from "../services/state"

const numPagesBeforeReview = 4

export const useNewCampaignForm = (id: number) => {
  const router = useRouter()
  const [newCampaign, setNewCampaign] = useRecoilState(newCampaignState)
  const [showReview, setShowReview] = useState(false)

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
    const firstInvalidRequiredField = newCampaignFieldEntries.find(
      ([field, { required }]) => {
        if (!required) return false

        const value = newCampaign[field as keyof NewCampaign]
        return (
          (typeof value === "string" && !value.trim()) ||
          (typeof value === "number" && value < 0) ||
          value === undefined
        )
      }
    )?.[1]

    // Show review button if there are no invalid required fields OR we're on the last page.
    setShowReview(!firstInvalidRequiredField || id === numPagesBeforeReview)

    // If no invalid required fields OR the first invalid required field is on the current page or after, no need to redirect.
    if (!firstInvalidRequiredField || firstInvalidRequiredField.pageId >= id)
      return

    // Route to the first page with an invalid required field.
    router.push(
      `/create/${
        firstInvalidRequiredField.pageId === 1
          ? ""
          : firstInvalidRequiredField.pageId
      }`
    )
  }, [id, router, newCampaign])

  const onSubmit: SubmitHandler<FieldValues> = (values, event) => {
    const nativeEvent = event?.nativeEvent as SubmitEvent
    const submitterValue = (nativeEvent?.submitter as HTMLInputElement)?.value

    const url =
      submitterValue === "Back"
        ? `/create/${id > 2 ? id - 1 : ""}`
        : submitterValue === "Review"
        ? "/create/review"
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

  const showBack = id > 1
  const showNext = id < numPagesBeforeReview
  const Navigation = (
    <div
      className="flex flex-row items-center"
      // justify-end doesn't work in tailwind for some reason
      style={{ justifyContent: showBack ? "space-between" : "flex-end" }}
    >
      {showBack && <Button submitLabel="Back" />}

      <div className="flex flex-row items-center">
        {showNext && <Button submitLabel="Next" />}
        {showReview && (
          <Button submitLabel="Review" className={cn({ "ml-2": showNext })} />
        )}
      </div>
    </div>
  )

  return {
    formOnSubmit: handleSubmit(onSubmit, onError),
    errors,
    register,
    getValues,
    watch,
    control,
    Navigation,
  }
}

// TODO: write real validation regex
// If this returns false, the address is invalid.
export const validateAndCleanJunoAddress = (address: string) => {
  const cleanedAddress = address.trim().toLowerCase()

  if (!/^juno.+$/.test(cleanedAddress)) return [undefined, "Invalid address."]

  return [cleanedAddress, undefined]
}

export const validateInitialDistributionAmount = (
  amount: number,
  max: number
) => amount >= 0 && amount <= max
