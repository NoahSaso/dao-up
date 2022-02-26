import { FunctionComponent, useCallback } from "react"
import { useForm } from "react-hook-form"
import { useSetRecoilState } from "recoil"

import { Button, FormInput, Suspense } from "@/components"
import { numberPattern, prettyPrintDecimal } from "@/helpers"
import { useContributeCampaign, useWallet } from "@/hooks"
import { favoriteCampaignAddressesAtom } from "@/state"

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
  // Minimum contribution is how many juno(x) per funding token (without decimals).
  const minContribution = Math.max(
    // Cannot fund less than 1 ujuno(x).
    1e-6,
    // fundingTokenPrice is funding tokens (without decimals) per 1 ujuno(x), so invert and divide.
    // Use ceiling in case 1/fundingTokenPrice is nonzero after the 6th decimal and we need to set a minimum within the 6 decimal range.
    Math.ceil(1 / (fundingTokenPrice ?? 1)) / 1e6
  )
  // Max contribution is remaining amount left to fund. Cannot fund more than goal.
  const maxContribution = Math.min(
    // Weird subtraction issues. JavaScript thinks 11 - 10.999 = 0.0009999999999994458
    Number((goal - pledged).toFixed(6)),
    Number.MAX_SAFE_INTEGER / 1e6
  )

  const doContribution = async ({ contribution }: ContributionForm) => {
    if (!contribution) return

    if (await contributeCampaign(contribution)) {
      // Add to favorites so user can access it quickly.
      addFavorite(campaign.address)

      // Empty form fields.
      reset()

      await onSuccess?.()
    }
  }

  return (
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
        tail={payToken.label}
        error={
          errors?.contribution?.message ?? contributeCampaignError ?? undefined
        }
        disabled={!connected}
        {...register("contribution", {
          valueAsNumber: true,
          pattern: numberPattern,
          min: {
            value: minContribution,
            message: `Must be at least ${prettyPrintDecimal(minContribution)} ${
              payToken.label
            }.`,
          },
          max: {
            value: maxContribution,
            message: `Must be less than or equal to ${prettyPrintDecimal(
              maxContribution
            )} ${payToken.label}.`,
          },
        })}
      />

      <Button
        className="sm:h-[50px]"
        disabled={!connected}
        submitLabel="Support this campaign"
      />
    </form>
  )
}
