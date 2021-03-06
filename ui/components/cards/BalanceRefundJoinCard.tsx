import { FunctionComponent } from "react"
import { useRecoilValue } from "recoil"

import {
  Button,
  CardWrapper,
  ControlledFormPercentTokenDoubleInput,
  Suspense,
} from "@/components"
import { convertMicroDenomToDenom, prettyPrintDecimal } from "@/helpers"
import { useRefundJoinDAOForm } from "@/hooks"
import { cw20WalletTokenBalance } from "@/state"
import { CampaignStatus } from "@/types"

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
> = (props) => (
  <CardWrapper className="w-full">
    <Suspense>
      <BalanceRefundJoinCardContents {...props} />
    </Suspense>
  </CardWrapper>
)

const BalanceRefundJoinCardContents: FunctionComponent<
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

    payToken,

    fundingToken: {
      address: fundingTokenAddress,
      supply: fundingTokenSupply,
      price: fundingTokenPrice,
      symbol: fundingTokenSymbol,
      decimals: fundingTokenDecimals,
    },

    govToken: {
      address: govTokenAddress,
      symbol: govTokenSymbol,
      decimals: govTokenDecimals,
    },
  } = campaign

  const { balance: fundingTokenBalance, error: fundingTokenBalanceError } =
    useRecoilValue(cw20WalletTokenBalance(fundingTokenAddress))

  const { balance: govTokenBalance, error: govTokenBalanceError } =
    useRecoilValue(cw20WalletTokenBalance(govTokenAddress))

  // Refund Form
  const { onSubmit, control, errors, watch, refundCampaignError } =
    useRefundJoinDAOForm(campaign, fundingTokenBalance, onSuccess)
  const watchRefund = watch("refund")

  // Percent of funding tokens the user's balance represents.
  const fundingTokenBalancePercent =
    fundingTokenBalance && fundingTokenSupply
      ? (100 * fundingTokenBalance) / fundingTokenSupply
      : undefined

  // Refund
  const expectedPayTokensReceived =
    watchRefund && watchRefund > 0 && fundingTokenPrice
      ? watchRefund / fundingTokenPrice
      : 0
  // Minimum refund is how many non-micro funding tokens per 1 micro payToken.
  // fundingTokenPrice is micro funding tokens per 1 micro payToken, so convert to non-micro.
  // Use ceiling in case fundingTokenPrice is nonzero after the nth decimal and we need to set a minimum within the n decimal range.
  const minRefund = convertMicroDenomToDenom(
    Math.ceil(fundingTokenPrice ?? 0),
    payToken.decimals
  )

  return (
    <>
      <h2 className="text-xl text-green">Your Balance</h2>

      {!!govTokenBalance && (
        <>
          <p className="text-light mt-2">
            {prettyPrintDecimal(
              govTokenBalance,
              govTokenDecimals,
              govTokenSymbol
            )}
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
      {(status !== CampaignStatus.Funded ||
        !!fundingTokenBalance ||
        !govTokenBalance) && (
        <>
          <p className="text-light mt-2">
            {prettyPrintDecimal(
              fundingTokenBalance ?? 0,
              fundingTokenDecimals,
              fundingTokenSymbol
            )}
            {fundingTokenBalancePercent && (
              <span className="text-placeholder ml-2">
                {prettyPrintDecimal(fundingTokenBalancePercent, 2, "%")} of
                total supply
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

      {(status === CampaignStatus.Open || status === CampaignStatus.Funded) &&
        fundingTokenBalance !== null &&
        fundingTokenBalance > 0 && (
          <>
            {status !== CampaignStatus.Funded && (
              <h2 className="text-xl text-green mt-6 mb-4">Refunds</h2>
            )}

            <form onSubmit={onSubmit}>
              {status === CampaignStatus.Funded ? (
                <>
                  <p className="text-placeholder italic">
                    This campaign has been successfully funded. To join the DAO,
                    click the button below.
                  </p>

                  <Button submitLabel="Join DAO" className="mt-4" />
                </>
              ) : (
                <ControlledFormPercentTokenDoubleInput
                  name="refund"
                  control={control}
                  minValue={minRefund}
                  maxValue={fundingTokenBalance}
                  currencySymbol={fundingTokenSymbol}
                  currencyDecimals={fundingTokenDecimals}
                  first={{
                    placeholder: "50",
                  }}
                  second={{
                    placeholder: prettyPrintDecimal(
                      fundingTokenBalance * 0.5,
                      fundingTokenDecimals
                    ),
                  }}
                  shared={{
                    disabled: status !== CampaignStatus.Open,
                    children: <Button submitLabel="Refund" />,
                  }}
                  accent={
                    expectedPayTokensReceived
                      ? `You will receive about ${prettyPrintDecimal(
                          expectedPayTokensReceived,
                          payToken.decimals,
                          payToken.symbol
                        )}`
                      : undefined
                  }
                  error={
                    errors?.refund?.message ?? refundCampaignError ?? undefined
                  }
                  wrapperClassName="mb-0"
                />
              )}
            </form>
          </>
        )}
    </>
  )
}
