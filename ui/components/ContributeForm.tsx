import { FunctionComponent, useCallback, useState } from "react"
import { useForm } from "react-hook-form"
import { useSetRecoilState } from "recoil"

import { Alert, Button, FormInput, Suspense } from "@/components"
import {
  convertMicroDenomToDenom,
  numberPattern,
  prettyPrintDecimal,
} from "@/helpers"
import { useContributeCampaign, usePayTokenUtil, useWallet } from "@/hooks"
import { baseToken, getBaseTokenForDesiredAmount } from "@/services"
import { favoriteCampaignAddressesAtom } from "@/state"

enum SwapAlertStatus {
  Closed,
  Swapping,
  Swapped,
}

interface ContributionForm {
  contribution?: number
}

interface ContributeFormProps {
  campaign: Campaign
  onSuccess?: () => void | Promise<void>
}

export const ContributeForm: FunctionComponent<ContributeFormProps> = (
  props
) => (
  <>
    <Suspense>
      <ContributeFormContents {...props} />
    </Suspense>
  </>
)

const ContributeFormContents: FunctionComponent<ContributeFormProps> = ({
  campaign,
  onSuccess,
}) => {
  const {
    payToken,
    goal,
    pledged,

    fundingToken: { symbol: tokenSymbol, price: fundingTokenPrice },
  } = campaign

  const { connected } = useWallet()

  const { contributeCampaign, contributeCampaignError } =
    useContributeCampaign(campaign)

  const {
    handleSubmit,
    register,
    formState: { errors },
    watch,
    reset,
  } = useForm<ContributionForm>({
    mode: "onChange",
    defaultValues: {},
  })

  // Add campaign to favorites if funding.
  const setFavoriteAddresses = useSetRecoilState(favoriteCampaignAddressesAtom)
  const addFavorite = useCallback(
    (address: string) =>
      setFavoriteAddresses((addresses) =>
        addresses.includes(address) ? addresses : [...addresses, address]
      ),
    [setFavoriteAddresses]
  )

  const watchContribution = watch("contribution")
  const expectedFundingTokensReceived =
    watchContribution && watchContribution > 0 && fundingTokenPrice
      ? fundingTokenPrice * watchContribution
      : 0
  // Minimum contribution is how many non-micro payTokens per micro funding token, since each contribution much return at least 1 micro funding token.
  const minContribution = convertMicroDenomToDenom(
    Math.max(
      // Cannot fund less than 1 micro payToken.
      1,
      // fundingTokenPrice is non-micro funding tokens per 1 micro payToken, so invert and convert to non-micro.
      // Use ceiling in case 1/fundingTokenPrice is nonzero after the nth decimal and we need to set a minimum within the n decimal range.
      Math.ceil(1 / (fundingTokenPrice ?? 1))
    ),
    payToken.decimals
  )
  // Max contribution is remaining amount left to fund. Cannot fund more than goal.
  const maxContribution = Math.min(
    // Weird subtraction issues. JavaScript thinks 11 - 10.999 = 0.0009999999999994458
    Number((goal - pledged).toFixed(payToken.decimals)),
    convertMicroDenomToDenom(Number.MAX_SAFE_INTEGER, payToken.decimals)
  )

  // Swap for pay token if necessary.
  const {
    canSwap,
    swapForAtLeast,
    swapError,
    swapPrice,
    balance: payTokenBalance,
    isBase,
  } = usePayTokenUtil(payToken)
  const [swapAlertStatus, setSwapAlertStatus] = useState<SwapAlertStatus>(
    SwapAlertStatus.Closed
  )
  // Get missing pay token amount.
  const payTokenNeeded =
    !isBase &&
    typeof payTokenBalance === "number" &&
    !!watchContribution &&
    watchContribution > payTokenBalance
      ? Number((watchContribution - payTokenBalance).toFixed(payToken.decimals))
      : 0
  // Display the associated base token amount that will be swapped.
  const baseTokenToSwap =
    !!payTokenNeeded && !!swapPrice
      ? getBaseTokenForDesiredAmount(payTokenNeeded, swapPrice)
      : 0
  // When swapping, there will usually be slightly more received than asked for, given the nature of slippage. Give the user the option to just round up and send all the balance if they just swapped and have some extra.
  // If the balance is more than the entered contribution AND the initial contribution is less than the max contribution, add button to round up. If the initial contribution = max contribution, no need to round up.
  const showRoundUpOption =
    !!payTokenBalance &&
    !!watchContribution &&
    payTokenBalance > watchContribution &&
    watchContribution < maxContribution

  const swap = async () => {
    const success = await swapForAtLeast(payTokenNeeded)
    if (success) {
      setSwapAlertStatus(SwapAlertStatus.Swapped)
    }
  }

  const doContribution = useCallback(
    async ({ contribution }: ContributionForm) => {
      if (!contribution) return

      // Check if we need to swap for more pay token.
      if (!isBase && contribution > (payTokenBalance ?? 0)) {
        setSwapAlertStatus(SwapAlertStatus.Swapping)
        return
      }

      if (await contributeCampaign(Math.min(contribution, maxContribution))) {
        // Ensure swap alert is closed.
        setSwapAlertStatus(SwapAlertStatus.Closed)

        // Add to favorites so user can access it quickly.
        addFavorite(campaign.address)

        // Empty form fields.
        reset()

        await onSuccess?.()
      }
    },
    [
      campaign,
      contributeCampaign,
      addFavorite,
      reset,
      onSuccess,
      setSwapAlertStatus,
      isBase,
      payTokenBalance,
      maxContribution,
    ]
  )

  return (
    <>
      <form
        onSubmit={handleSubmit(doContribution)}
        className="flex flex-col items-stretch sm:flex-row sm:items-start lg:self-stretch"
      >
        <FormInput
          type="number"
          inputMode="decimal"
          placeholder="Contribute..."
          accent={
            expectedFundingTokensReceived
              ? `You will receive about ${prettyPrintDecimal(
                  expectedFundingTokensReceived
                )} ${tokenSymbol}`
              : undefined
          }
          wrapperClassName="!mb-4 sm:!mb-0 sm:mr-4 sm:flex-1"
          className="!py-3 !px-6 !pr-28"
          tail={payToken.symbol}
          error={
            errors?.contribution?.message ??
            contributeCampaignError ??
            undefined
          }
          disabled={!connected}
          {...register("contribution", {
            valueAsNumber: true,
            pattern: numberPattern,
            min: {
              value: minContribution,
              message: `Must be at least ${prettyPrintDecimal(
                minContribution
              )} ${payToken.symbol}.`,
            },
            max: {
              value: maxContribution,
              message: `Must be less than or equal to ${prettyPrintDecimal(
                maxContribution
              )} ${payToken.symbol}.`,
            },
          })}
        />

        <Button
          className="sm:h-[50px]"
          disabled={!connected}
          submitLabel="Support this campaign"
        />
      </form>

      {/* Swap funds alert. */}
      <Alert
        visible={swapAlertStatus !== SwapAlertStatus.Closed}
        hide={() => setSwapAlertStatus(SwapAlertStatus.Closed)}
        title={
          swapAlertStatus === SwapAlertStatus.Swapping
            ? `Swap for ${payToken.symbol}`
            : swapAlertStatus === SwapAlertStatus.Swapped
            ? "Swap successful!"
            : ""
        }
      >
        {swapAlertStatus === SwapAlertStatus.Swapping ? (
          <>
            <p>
              You currently have {prettyPrintDecimal(payTokenBalance ?? 0)}{" "}
              {payToken.symbol} but are trying to contribute{" "}
              {prettyPrintDecimal(watchContribution ?? 0)} {payToken.symbol}.
              Pressing the button below will use{" "}
              <a
                href="https://junoswap.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:no-underline"
              >
                Junoswap
              </a>{" "}
              to swap about {prettyPrintDecimal(baseTokenToSwap)}{" "}
              {baseToken.symbol} for about {prettyPrintDecimal(payTokenNeeded)}{" "}
              {payToken.symbol}.
            </p>

            <p className="text-placeholder mt-2 italic">
              These numbers are subject to the volatility of the market and may
              change slightly by the time the transaction is complete. Junoswap
              takes a 0.3% fee.
            </p>

            <Button onClick={swap} disabled={!canSwap} className="mt-4">
              Swap
            </Button>

            {swapError && <p className="mt-2 text-orange">{swapError}</p>}
          </>
        ) : (
          <>
            <p>
              You now have {prettyPrintDecimal(payTokenBalance ?? 0)}{" "}
              {payToken.symbol}.{" "}
              {showRoundUpOption
                ? "Choose one of the two buttons"
                : "Press the button"}{" "}
              below to complete your contribution.
            </p>

            <div className="flex flex-row items-center flex-wrap gap-4 mt-4">
              <Button
                onClick={() =>
                  doContribution({ contribution: watchContribution ?? 0 })
                }
              >
                Contribute {prettyPrintDecimal(watchContribution ?? 0)}{" "}
                {payToken.symbol}
              </Button>

              {showRoundUpOption && (
                <Button
                  onClick={() =>
                    doContribution({
                      contribution: Math.min(
                        payTokenBalance ?? 0,
                        maxContribution
                      ),
                    })
                  }
                >
                  Contribute max (
                  {prettyPrintDecimal(
                    Math.min(payTokenBalance ?? 0, maxContribution)
                  )}{" "}
                  {payToken.symbol})
                </Button>
              )}
            </div>
          </>
        )}
      </Alert>
    </>
  )
}
