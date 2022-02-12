import cn from "classnames"
import { FC } from "react"
import { useForm } from "react-hook-form"
import { useRecoilValue } from "recoil"

import { payTokenSymbol } from "../helpers/config"
import { prettyPrintDecimal } from "../helpers/number"
import { useRefundCampaign } from "../hooks/useRefundCampaign"
import { campaignWalletBalance } from "../state/campaigns"
import { Status } from "../types"
import { Button, ControlledFormPercentTokenDoubleInput } from "."

interface RefundForm {
  refund?: number
}

interface BalanceRefundCardProps {
  campaign: Campaign
  showAddGovToken: boolean
  suggestGovToken: () => Promise<void>
  showAddFundingToken: boolean
  suggestFundingToken: () => Promise<void>
}

export const BalanceRefundCard: FC<BalanceRefundCardProps> = ({
  campaign,
  showAddGovToken,
  suggestGovToken,
  showAddFundingToken,
  suggestFundingToken,
}) => {
  const {
    address,
    status,

    fundingToken: {
      supply: fundingTokenSupply,
      price: fundingTokenPrice,
      symbol: fundingTokenSymbol,
    },
  } = campaign

  const { balance: fundingTokenBalance, error: fundingTokenBalanceError } =
    useRecoilValue(campaignWalletBalance(address))

  const { refundCampaign, refundCampaignError } = useRefundCampaign(campaign)

  const {
    handleSubmit,
    formState: { errors },
    watch,
    control,
    reset,
  } = useForm<RefundForm>({
    defaultValues: {},
  })

  // Refund Form
  const watchRefund = watch("refund")
  const doRefund = async ({ refund }: RefundForm) => {
    // If funded, the refund action becomes the join DAO action, so send all tokens.
    if (status === Status.Funded) refund = fundingTokenBalance ?? 0

    if (!refund) return

    // TODO: Add success display.
    if (await refundCampaign(refund)) {
      // Attempt to add token to Keplr if receiving governance tokens.
      if (status === Status.Funded) await suggestGovToken()

      // Empty form fields.
      reset()
    }
  }

  // Percent of funding tokens the user's balance represents.
  const fundingTokenBalancePercent =
    fundingTokenBalance && fundingTokenSupply
      ? (100 * fundingTokenBalance) / fundingTokenSupply
      : undefined

  // Refund
  // Minimum refund is how many funding tokens (with decimals) per 1 ujuno(x).
  const minRefund = Math.ceil(fundingTokenPrice ?? 1e-6) / 1e6
  const expectedPayTokensReceived =
    watchRefund && watchRefund > 0 && fundingTokenPrice
      ? watchRefund / fundingTokenPrice
      : 0

  return (
    <div className="bg-card rounded-3xl w-full lg:w-3/5 py-8 px-12">
      <h2 className="text-xl text-green mb-2">Your Balance</h2>

      <p className="text-light">
        {prettyPrintDecimal(fundingTokenBalance ?? 0)} {fundingTokenSymbol}
        {fundingTokenBalancePercent && (
          <span className="text-placeholder ml-2">
            {prettyPrintDecimal(fundingTokenBalancePercent, 2)}% of total supply
          </span>
        )}
      </p>
      {fundingTokenBalance !== null &&
        fundingTokenBalance > 0 &&
        showAddFundingToken && (
          <div className="mt-4">
            <Button onClick={suggestFundingToken}>Add token to wallet</Button>
            <p className="text-sm text-placeholder italic mt-2">
              This allows you to view your campaign funding token balance (
              {fundingTokenSymbol}) from your Keplr wallet. If you&apos;ve
              already done this, it should still be there.
            </p>
          </div>
        )}
      {status === Status.Funded && showAddGovToken && (
        <div className="mt-4">
          <Button onClick={suggestGovToken}>Add DAO token to wallet</Button>
          <p className="text-sm text-placeholder italic mt-2">
            This allows you to view your DAO governance token balance from your
            Keplr wallet. If you&apos;ve already done this, it should still be
            there.
          </p>
        </div>
      )}

      {status !== Status.Pending &&
        fundingTokenBalance !== null &&
        fundingTokenBalance > 0 && (
          <>
            {status !== Status.Funded && (
              <h2 className="text-xl text-green mt-8 mb-4">Refunds</h2>
            )}

            <form onSubmit={handleSubmit(doRefund)}>
              {status === Status.Funded ? (
                <p className="mt-4 text-placeholder italic">
                  This campaign has been successfully funded. To join the DAO,
                  exchange your {fundingTokenSymbol} tokens by clicking the
                  button below.
                </p>
              ) : (
                <ControlledFormPercentTokenDoubleInput
                  name="refund"
                  control={control}
                  minValue={minRefund}
                  maxValue={fundingTokenBalance}
                  currency={fundingTokenSymbol}
                  first={{
                    placeholder: "50",
                  }}
                  second={{
                    placeholder: prettyPrintDecimal(fundingTokenBalance * 0.5),
                  }}
                  shared={{
                    disabled: status !== Status.Open,
                  }}
                  accent={
                    expectedPayTokensReceived
                      ? `You will receive about ${prettyPrintDecimal(
                          expectedPayTokensReceived
                        )} ${payTokenSymbol}`
                      : undefined
                  }
                  error={
                    errors?.refund?.message ?? refundCampaignError ?? undefined
                  }
                />
              )}

              <Button
                submitLabel={status === Status.Funded ? "Join DAO" : "Refund"}
                className="mt-4"
                disabled={status !== Status.Open && status !== Status.Funded}
              />
            </form>
          </>
        )}
    </div>
  )
}
