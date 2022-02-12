import { FC, useCallback, useState } from "react"
import { useForm } from "react-hook-form"
import { useSetRecoilState } from "recoil"
import { useContributeCampaign } from "../hooks/useContributeCampaign"
import { useWallet } from "../hooks/useWallet"
import { suggestToken } from "../services/keplr"
import { favoriteCampaignAddressesAtom } from "../state/campaigns"
import { Button } from "./Button"
import { FormInput } from "./Input"

interface ContributionForm {
  contribution?: number
}

interface ContributeCardProps {
  campaign: Campaign
}

export const ContributeCard: FC<ContributeCardProps> = ({ campaign }) => {
  const {
    handleSubmit,
    register,
    formState: { errors },
    watch,
    reset,
  } = useForm({
    mode: "onChange",
    defaultValues: {} as ContributionForm,
  })
  const { connected, keplr } = useWallet()

  const { contributeCampaign, contributeCampaignError } =
    useContributeCampaign(campaign)

  const [showAddFundingToken, setShowAddFundingToken] = useState(false)

  const suggestFundingToken = async () =>
    keplr &&
    setShowAddFundingToken(
      !(await suggestToken(keplr, campaign.fundingToken.address))
    )

  const setFavoriteAddresses = useSetRecoilState(favoriteCampaignAddressesAtom)
  const addFavorite = useCallback(
    (address: string) =>
      setFavoriteAddresses((addresses) =>
        addresses.includes(address) ? addresses : [...addresses, address]
      ),
    [setFavoriteAddresses]
  )

  const watchContribution = watch("contribution")
  const doContribution = async ({ contribution }: ContributionForm) => {
    if (!contribution) return

    // TODO: Add success display.
    if (await contributeCampaign(contribution)) {
      // Attempt to add token to Keplr.
      await suggestFundingToken()

      addFavorite(campaign.address)

      // Empty form fields.
      reset()
    }
  }

  return (
    <form
      onSubmit={handleSubmit(doContribution)}
      className="flex flex-col items-stretch mt-8 sm:flex-row sm:items-start lg:self-stretch lg:mb-0"
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
          contributionErrors?.contribution?.message ??
          contributeCampaignError ??
          undefined
        }
        disabled={!connected}
        {...contributionRegister("contribution", {
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
