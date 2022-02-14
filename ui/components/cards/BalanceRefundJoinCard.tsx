import { FunctionComponent } from "react"
import { useRecoilValue } from "recoil"

import {
  Button,
  CardWrapper,
  ControlledFormPercentTokenDoubleInput,
} from "@/components"
import { payTokenSymbol } from "@/config"
import { prettyPrintDecimal } from "@/helpers"
import { useRefundJoinDAOForm, useWallet } from "@/hooks"
import { walletTokenBalance } from "@/state"
import { Status } from "@/types"

interface BalanceRefundJoinCardProps {
  campaign: Campaign
  showAddGovToken: boolean
  suggestGovToken: () => Promise<any>
  showAddFundingToken: boolean
  suggestFundingToken: () => Promise<any>
  onSuccess: () => any | Promise<any>
}

export const BalanceRefundJoinCard: FunctionComponent<
  BalanceRefundJoinCardProps
> = ({
  campaign,
  showAddGovToken,
  suggestGovToken,
  showAddFundingToken,
  suggestFundingToken,
  onSuccess,
}) => {
  const {
    status,

    fundingToken: {
      address: fundingTokenAddress,
      supply: fundingTokenSupply,
      price: fundingTokenPrice,
      symbol: fundingTokenSymbol,
    },

    govToken: { address: govTokenAddress, symbol: govTokenSymbol },
  } = campaign

  const { keplr } = useWallet()

  const { balance: fundingTokenBalance, error: fundingTokenBalanceError } =
    useRecoilValue(walletTokenBalance(fundingTokenAddress))

  const { balance: govTokenBalance, error: govTokenBalanceError } =
    useRecoilValue(walletTokenBalance(govTokenAddress))

  // Refund Form
  const { onSubmit, control, errors, watch, refundCampaignError } =
    useRefundJoinDAOForm(campaign, onSuccess)
  const watchRefund = watch("refund")

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
    <CardWrapper className="w-full">
      <h2 className="text-xl text-green">Your Balance</h2>

      {!!govTokenBalance && (
        <>
          <p className="text-light mt-2">
            {prettyPrintDecimal(govTokenBalance)} {govTokenSymbol}
          </p>
          <p className="text-placeholder italic">
            You have voting power in the DAO.
          </p>

          {showAddGovToken && (
            <>
              <Button onClick={suggestGovToken} className="mt-4">
                Add DAO token to wallet
              </Button>

              <p className="text-sm text-placeholder italic mt-2">
                This allows you to view your DAO governance token balance from
                your Keplr wallet. If you&apos;ve already done this, it should
                still be there.
              </p>
            </>
          )}
        </>
      )}

      {/* Show funding token balance if funded and has not yet swapped to governance tokens, or if no governance tokens at all so we don't show an empty card. */}
      {(status !== Status.Funded ||
        !!fundingTokenBalance ||
        !govTokenBalance) && (
        <>
          <p className="text-light mt-2">
            {prettyPrintDecimal(fundingTokenBalance ?? 0)} {fundingTokenSymbol}
            {fundingTokenBalancePercent && (
              <span className="text-placeholder ml-2">
                {prettyPrintDecimal(fundingTokenBalancePercent, 2)}% of total
                supply
              </span>
            )}
          </p>

          {showAddFundingToken && (
            <>
              <Button onClick={suggestFundingToken} className="mt-4">
                Add token to wallet
              </Button>

              <p className="text-sm text-placeholder italic mt-2">
                This allows you to view your campaign funding token balance (
                {fundingTokenSymbol}) from your Keplr wallet. If you&apos;ve
                already done this, it should still be there.
              </p>
            </>
          )}
        </>
      )}

      {(status === Status.Open || status === Status.Funded) &&
        fundingTokenBalance !== null &&
        fundingTokenBalance > 0 && (
          <>
            {status !== Status.Funded && (
              <h2 className="text-xl text-green mt-6 mb-4">Refunds</h2>
            )}

            <form onSubmit={onSubmit}>
              {status === Status.Funded ? (
                <>
                  <p className="text-placeholder italic">
                    This campaign has been successfully funded. To join the DAO,
                    click the button below.
                  </p>

                  <Button submitLabel="Join DAO" className="mt-4" />
                </>
              ) : (
                <div className="flex flex-row items-start gap-4">
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
                      placeholder: prettyPrintDecimal(
                        fundingTokenBalance * 0.5
                      ),
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
                      errors?.refund?.message ??
                      refundCampaignError ??
                      undefined
                    }
                    wrapperClassName="mb-0 flex-1"
                  />

                  <Button submitLabel="Refund" className="h-[50px]" />
                </div>
              )}
            </form>
          </>
        )}
    </CardWrapper>
  )
}
