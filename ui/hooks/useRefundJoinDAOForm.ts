import { useForm } from "react-hook-form"

import { useRefundCampaign } from "@/hooks"
import { CampaignStatus } from "@/types"

interface RefundJoinDAOForm {
  refund?: number
}

export const useRefundJoinDAOForm = (
  campaign: Campaign | null,
  fundingTokenBalance: number | null | undefined,
  onSuccess?: () => any | Promise<any>
) => {
  const { status } = campaign ?? {}

  const {
    handleSubmit,
    formState: { errors },
    watch,
    control,
    reset,
  } = useForm<RefundJoinDAOForm>({
    defaultValues: {},
  })

  const { refundCampaign, refundCampaignError } = useRefundCampaign(campaign)

  const doRefund = async ({ refund }: RefundJoinDAOForm) => {
    // If funded, the refund action becomes the join DAO action, so send all tokens.
    if (status === CampaignStatus.Funded) refund = fundingTokenBalance ?? 0

    if (!refund) return

    if (await refundCampaign(refund)) {
      // Empty form fields.
      reset()

      await onSuccess?.()
    }
  }

  return {
    onSubmit: handleSubmit(doRefund),
    errors,
    watch,
    control,
    refundCampaignError,
  }
}
