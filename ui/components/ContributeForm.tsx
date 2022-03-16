import {
  FunctionComponent,
  ReactNode,
  useCallback,
  useEffect,
  useState,
} from "react"
import { useForm } from "react-hook-form"
import { useRecoilValue, useSetRecoilState } from "recoil"

import { Alert, Button, FormInput, Suspense } from "@/components"
import {
  convertMicroDenomToDenom,
  numberPattern,
  prettyPrintDecimal,
} from "@/helpers"
import { useContributeCampaign, usePayTokenUtil, useWallet } from "@/hooks"
import {
  baseToken,
  getBaseTokenForMinPayToken,
  getMinPayTokenForBaseToken,
} from "@/services"
import {
  favoriteCampaignAddressesAtom,
  nativeWalletTokenBalance,
} from "@/state"

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

    fundingToken: {
      symbol: tokenSymbol,
      price: fundingTokenPrice,
      decimals: fundingTokenDecimals,
    },
  } = campaign

  const { connected } = useWallet()

  const [contributeCampaignError, setContributeCampaignError] = useState(
    null as ReactNode | null
  )
  const contributeCampaign = useContributeCampaign(
    campaign,
    setContributeCampaignError
  )

  const {
    handleSubmit,
    register,
    formState: { errors },
    watch,
    reset,
    setValue,
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
  // Minimum contribution is how many non-micro payTokens per micro funding token, since each contribution much return at least 1 micro funding token.
  const minContribution = convertMicroDenomToDenom(
    // fundingTokenPrice is micro funding tokens per 1 micro payToken, so invert before converting to non-micro.
    // Use ceiling in case 1/fundingTokenPrice is nonzero after the nth decimal and we need to set a minimum within the n decimal range.
    Math.ceil(1 / (fundingTokenPrice ?? 1)),
    payToken.decimals
  )
  // Max contribution is remaining amount left to fund. Cannot fund more than goal.
  const maxContribution = Math.min(
    // Weird subtraction issues. JavaScript thinks 11 - 10.999 = 0.0009999999999994458
    Number((goal - pledged).toFixed(payToken.decimals)),
    convertMicroDenomToDenom(Number.MAX_SAFE_INTEGER, payToken.decimals)
  )

  // Get contribution capped at max.
  const cappedContribution =
    watchContribution && Math.min(watchContribution, maxContribution)
  // Get expected funding tokens in exchange for given contribution.
  const expectedFundingTokensReceived =
    !!cappedContribution && fundingTokenPrice
      ? fundingTokenPrice * cappedContribution
      : 0
  // Attempting to fund more than the max.
  const isOverFunding =
    !!watchContribution && watchContribution > maxContribution

  // Swap for pay token if necessary.
  const [swapAlertStatus, setSwapAlertStatus] = useState<SwapAlertStatus>(
    SwapAlertStatus.Closed
  )

  const {
    canSwap,
    swapForAtLeast,
    swapError,
    swapPrice,
    balance: payTokenBalance,
    isBase,
  } = usePayTokenUtil(payToken)
  const { balance: baseTokenBalance } = useRecoilValue(
    nativeWalletTokenBalance(baseToken.denom)
  )

  // Ensure sufficient funds for given contribution.
  const insufficientFunds =
    typeof payTokenBalance === "number" &&
    !!cappedContribution &&
    cappedContribution > payTokenBalance
  // Get missing pay token amount.
  const payTokenNeeded =
    typeof payTokenBalance === "number" &&
    !!cappedContribution &&
    insufficientFunds
      ? Number(
          (cappedContribution - payTokenBalance).toFixed(payToken.decimals)
        )
      : 0

  // Display the associated base token amount that will be swapped.
  const baseTokenForPayTokenNeeded =
    !isBase && !!payTokenNeeded && !!swapPrice
      ? getBaseTokenForMinPayToken(
          payTokenNeeded,
          swapPrice,
          baseToken.decimals
        )
      : 0
  // Check if we can swap for the desired amount.
  const insufficientBaseToken =
    !isBase &&
    (baseTokenBalance === null || baseTokenForPayTokenNeeded > baseTokenBalance)
  // Get missing base token amount for swapping.
  const swapBaseTokenNeeded =
    typeof baseTokenBalance === "number" &&
    !!baseTokenForPayTokenNeeded &&
    insufficientBaseToken
      ? Number(
          (baseTokenForPayTokenNeeded - baseTokenBalance).toFixed(
            baseToken.decimals
          )
        )
      : 0
  // Calculate the maximum pay token the given base token balance can swap for if there is insufficient balance to swap.
  const maxPayTokenForBaseTokenBalance =
    insufficientBaseToken &&
    baseTokenBalance !== null &&
    // Need enough to cover gas...
    baseTokenBalance > 0.01 &&
    !!swapPrice
      ? getMinPayTokenForBaseToken(
          // Reserve a conservative 0.01 baseToken for gas.
          baseTokenBalance - 0.01,
          swapPrice,
          payToken.decimals
        )
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
      if (!contribution || payTokenBalance === null) return

      // Check if we need to swap for more pay token.
      if (!isBase && contribution > payTokenBalance) {
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

  // Clear errors on type.
  useEffect(() => {
    setContributeCampaignError(null)
  }, [watchContribution, setContributeCampaignError])

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
          step={convertMicroDenomToDenom(1, payToken.decimals)}
          accent={
            expectedFundingTokensReceived
              ? `You will receive about ${prettyPrintDecimal(
                  expectedFundingTokensReceived,
                  fundingTokenDecimals
                )} ${tokenSymbol}.`
              : undefined
          }
          wrapperClassName="!mb-4 sm:!mb-0 sm:mr-3 sm:flex-1"
          className="!py-3 !px-6 !pr-28"
          tail={payToken.symbol}
          error={
            !!errors?.contribution?.message ||
            (isBase && insufficientFunds) ||
            !!contributeCampaignError ? (
              <>
                {[
                  errors?.contribution?.message,
                  isBase && insufficientFunds
                    ? `You need ${prettyPrintDecimal(
                        payTokenNeeded,
                        payToken.decimals
                      )} more ${
                        payToken.symbol
                      } to contribute ${prettyPrintDecimal(
                        cappedContribution,
                        payToken.decimals
                      )} ${payToken.symbol}.`
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ") || undefined}

                <span className="block mt-2">{contributeCampaignError}</span>
              </>
            ) : undefined
          }
          disabled={!connected}
          {...register("contribution", {
            valueAsNumber: true,
            pattern: numberPattern,
            min: {
              value: minContribution,
              message: `Must be at least ${prettyPrintDecimal(
                minContribution,
                payToken.decimals
              )} ${payToken.symbol}.`,
            },
            max: {
              value: maxContribution,
              message: `Campaigns can't be funded past their funding goal. Fund the remaining amount (${prettyPrintDecimal(
                maxContribution,
                payToken.decimals
              )} ${payToken.symbol}) instead by pressing the button.`,
            },
          })}
        />

        {isOverFunding ? (
          <Button
            className="sm:h-[50px]"
            disabled={
              !connected ||
              payTokenBalance === null ||
              (isBase && insufficientFunds)
              // Will handle insufficientBaseToken for swaps in swap popup, so let this button work.
            }
            onClick={() => doContribution({ contribution: maxContribution })}
          >
            Fund remaining
          </Button>
        ) : (
          <Button
            className="sm:h-[50px]"
            disabled={
              !connected ||
              payTokenBalance === null ||
              (isBase && insufficientFunds)
              // Will handle insufficientBaseToken for swaps in swap popup, so let this button work.
            }
            submitLabel="Support this campaign"
          />
        )}
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
              You currently have{" "}
              {prettyPrintDecimal(payTokenBalance ?? 0, payToken.decimals)}{" "}
              {payToken.symbol} but are trying to contribute{" "}
              {prettyPrintDecimal(cappedContribution ?? 0, payToken.decimals)}{" "}
              {payToken.symbol}. Pressing the button below will use{" "}
              <a
                href="https://junoswap.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:no-underline"
              >
                Junoswap
              </a>{" "}
              to swap about{" "}
              {prettyPrintDecimal(
                baseTokenForPayTokenNeeded,
                baseToken.decimals
              )}{" "}
              {baseToken.symbol} for about{" "}
              {prettyPrintDecimal(payTokenNeeded, payToken.decimals)}{" "}
              {payToken.symbol}.
            </p>

            <p className="text-placeholder mt-2 italic">
              These numbers are subject to the volatility of the market and may
              change slightly by the time the transaction is complete. Junoswap
              takes a 0.3% fee.
            </p>

            <Button
              onClick={swap}
              disabled={!canSwap || insufficientBaseToken}
              className="mt-4"
            >
              Swap
            </Button>

            {insufficientBaseToken && (
              <p className="mt-2 text-orange">
                You have{" "}
                {prettyPrintDecimal(baseTokenBalance ?? 0, baseToken.decimals)}{" "}
                {baseToken.symbol} which is insufficient to make this swap.
                {maxPayTokenForBaseTokenBalance > 0 ? (
                  <>
                    {" "}
                    Either{" "}
                    <span
                      className="cursor-pointer underline hover:no-underline"
                      onClick={() =>
                        setValue("contribution", maxPayTokenForBaseTokenBalance)
                      }
                    >
                      lower your contribution to{" "}
                      {prettyPrintDecimal(
                        maxPayTokenForBaseTokenBalance,
                        payToken.decimals
                      )}{" "}
                      {payToken.symbol}
                    </span>{" "}
                    or purchase {swapBaseTokenNeeded ?? 0} more{" "}
                    {baseToken.symbol}.
                  </>
                ) : (
                  ` Purchase more ${baseToken.symbol}.`
                )}
              </p>
            )}

            {swapError && <p className="mt-2 text-orange">{swapError}</p>}
          </>
        ) : (
          <>
            <p>
              You now have{" "}
              {prettyPrintDecimal(payTokenBalance ?? 0, payToken.decimals)}{" "}
              {payToken.symbol}.{" "}
              {showRoundUpOption
                ? "Choose one of the two buttons"
                : "Press the button"}{" "}
              below to complete your contribution.
            </p>

            <div className="flex flex-row items-center flex-wrap gap-4 mt-4">
              <Button
                onClick={() =>
                  doContribution({ contribution: cappedContribution ?? 0 })
                }
              >
                Contribute{" "}
                {prettyPrintDecimal(cappedContribution ?? 0, payToken.decimals)}{" "}
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
                    Math.min(payTokenBalance ?? 0, maxContribution),
                    payToken.decimals
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
