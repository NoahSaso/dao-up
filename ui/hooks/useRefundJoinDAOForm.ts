import { useForm } from "react-hook-form"
import { useRecoilValue } from "recoil"

import { useRefundCampaign } from "@/hooks"
import { walletTokenBalance } from "@/state"
import { Status } from "@/types"

interface RefundJoinDAOForm {
  refund?: number
}

export const useRefundJoinDAOForm = (
  campaign: Campaign | null,
  onSuccess?: () => any | Promise<any>
) => {
  const {
    status,
    fundingToken: { address: fundingTokenAddress },
  } = campaign ?? {
    fundingToken: { address: null },
  }

  const {
    handleSubmit,
    formState: { errors },
    watch,
    control,
    reset,
  } = useForm<RefundJoinDAOForm>({
    defaultValues: {},
  })

  const { balance: fundingTokenBalance, error: fundingTokenBalanceError } =
    useRecoilValue(walletTokenBalance(fundingTokenAddress))

  const { refundCampaign, refundCampaignError } = useRefundCampaign(campaign)

  const doRefund = async ({ refund }: RefundJoinDAOForm) => {
    // If funded, the refund action becomes the join DAO action, so send all tokens.
    if (status === Status.Funded) refund = fundingTokenBalance ?? 0

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
