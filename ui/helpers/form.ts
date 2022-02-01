import { useRouter } from "next/router"
import { useEffect } from "react"
import {
  FieldValues,
  SubmitErrorHandler,
  SubmitHandler,
  useForm,
} from "react-hook-form"
import { useRecoilState } from "recoil"

import { newCampaignState } from "../services/state"

const requiredPageFields: (keyof NewCampaign)[][] = [
  ["name", "description", "goal"],
  ["daoName", "daoDescription"],
  // no required fields on third page
  [],
  [
    "tokenName",
    "tokenSymbol",
    "passingThreshold",
    "initialSupply",
    "daoInitialAmount",
    "votingDuration",
    "unstakingDuration",
    "proposalDeposit",
    "refundProposalDeposits",
  ],
]

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
    const validatePastFields = async () => {
      // Route to the first page with an invalid field.
      for (let page = 1; page < id; page++) {
        const invalid = requiredPageFields[page - 1].some((field) => {
          const value = newCampaign[field]
          return (
            (typeof value === "string" && !value.trim()) ||
            (typeof value === "number" && value < 0) ||
            value === undefined
          )
        })

        if (invalid) return router.push(`/create/${page === 1 ? "" : page}`)
      }
    }

    validatePastFields()
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
