import { FC, useCallback } from "react"
import { useForm } from "react-hook-form"
import { useSetRecoilState } from "recoil"

import { payTokenSymbol } from "../helpers/config"
import { numberPattern } from "../helpers/form"
import { prettyPrintDecimal } from "../helpers/number"
import { useContributeCampaign } from "../hooks/useContributeCampaign"
import { useWallet } from "../hooks/useWallet"
import { favoriteCampaignAddressesAtom } from "../state/campaigns"
import { Button } from "./Button"
import { FormInput } from "./Input"

interface ContributionForm {
  contribution?: number
}

interface ContributeCardProps {
  campaign: Campaign
  onFundSuccess?: () => void | Promise<void>
}

export const ContributeCard: FC<ContributeCardProps> = ({
  campaign,
  onFundSuccess,
}) => {
  const {
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

      await onFundSuccess?.()
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
        tail={payTokenSymbol}
        error={
          errors?.contribution?.message ?? contributeCampaignError ?? undefined
        }
        disabled={!connected}
        {...register("contribution", {
          valueAsNumber: true,
          pattern: numberPattern,
          min: {
            value: 1e-6,
            message: `Must be at least 0.000001 ${payTokenSymbol}.`,
          },
          max: {
            value: maxContribution,
            message: `Must be less than or equal to ${prettyPrintDecimal(
              maxContribution
            )} ${payTokenSymbol}.`,
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
