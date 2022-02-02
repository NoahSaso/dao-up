import cn from "classnames"
import { useRouter } from "next/router"
import { useEffect, useState } from "react"
import {
  FieldValues,
  SubmitErrorHandler,
  SubmitHandler,
  useForm,
  UseFormClearErrors,
  UseFormSetError,
} from "react-hook-form"
import { useRecoilState } from "recoil"

import { Button } from "../components"
import { newCampaignFieldEntries } from "../services/campaigns"
import { newCampaignState } from "../services/state"
import { prettyPrintDecimal } from "./number"

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
    setError,
    clearErrors,
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

  const onSubmit: SubmitHandler<Partial<NewCampaign>> = (values, event) => {
    const nativeEvent = event?.nativeEvent as SubmitEvent
    const submitterValue = (nativeEvent?.submitter as HTMLInputElement)?.value

    setNewCampaign({
      ...newCampaign,
      ...values,
    })

    const url =
      submitterValue === "Back"
        ? `/create/${id > 2 ? id - 1 : ""}`
        : submitterValue === "Review"
        ? "/create/review"
        : `/create/${id + 1}`

    // If the user is about to review settings, run global validations.
    if (
      url.endsWith("review") &&
      !globalValidations(values, setError, clearErrors)
    ) {
      return
    }

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
    <div className="flex flex-col">
      {errors?.totalDistributionAmountError?.message && (
        <p className="text-orange mb-5 max-w-lg self-end">
          {errors.totalDistributionAmountError.message}
        </p>
      )}

      <div
        className="flex flex-row items-center"
        // justify-end doesn't work in tailwind for some reason
        style={{ justifyContent: showBack ? "space-between" : "flex-end" }}
      >
        {showBack && <Button submitLabel="Back" />}

        <div className="flex flex-row items-center">
          {showNext && <Button submitLabel="Next" />}
          {showReview && (
            <Button
              // Clear errors on pressing review so that global validations can run again.
              onClick={() => clearErrors()}
              submitLabel="Review"
              className={cn({ "ml-2": showNext })}
            />
          )}
        </div>
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

// VALIDATIONS

// Sets errors accordingly and returns boolean whether or not validations passed.
const globalValidations = (
  newCampaign: Partial<NewCampaign>,
  setError: UseFormSetError<Partial<NewCampaign>>,
  clearErrors: UseFormClearErrors<Partial<NewCampaign>>
) => {
  // Validate initialDAOAmount + sum(initialDistributions->amount) < initialSupply.

  const initialSupply = newCampaign.initialSupply ?? 0
  const initialDAOAmount = newCampaign.initialDAOAmount ?? 0
  const initialDistributions = newCampaign.initialDistributions ?? []
  const tokenSymbol = newCampaign.tokenSymbol ?? "tokens"

  const initialDistributionsAmount = initialDistributions.reduce(
    (acc, { amount }) => acc + amount,
    0
  )
  const totalDistributionAmount = initialDAOAmount + initialDistributionsAmount

  if (totalDistributionAmount > initialSupply) {
    const daoPercent = prettyPrintDecimal(
      (initialDAOAmount / initialSupply) * 100,
      6
    )
    const initialDistributionsPercent = prettyPrintDecimal(
      (initialDistributionsAmount / initialSupply) * 100,
      6
    )
    const totalDistributionPercent = prettyPrintDecimal(
      (totalDistributionAmount / initialSupply) * 100,
      6
    )

    setError("totalDistributionAmountError", {
      type: "manual",
      message: `You have not allocated a large enough initial supply of tokens for the distributions you have provided. The DAO is receiving ${daoPercent}% (${prettyPrintDecimal(
        initialDAOAmount
      )} ${tokenSymbol}) and the total distributions are receiving ${initialDistributionsPercent}% (${prettyPrintDecimal(
        initialDistributionsAmount
      )} ${tokenSymbol}), adding up to ${totalDistributionPercent}% (${prettyPrintDecimal(
        totalDistributionAmount
      )} ${tokenSymbol}). Please either increase the initial supply (currently ${prettyPrintDecimal(
        initialSupply
      )} ${tokenSymbol}) or reduce the number of tokens allocated to the DAO or other addresses.`,
    })
    return false
  } else {
    clearErrors("totalDistributionAmountError")
  }

  return true
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
