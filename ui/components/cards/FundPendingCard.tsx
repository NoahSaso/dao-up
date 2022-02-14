import { FunctionComponent } from "react"
import { useForm } from "react-hook-form"

import { Button, CardWrapper, FormInput } from "@/components"
import { numberPattern, prettyPrintDecimal } from "@/helpers"
import { useFundPendingCampaign, useWallet } from "@/hooks"

interface FundPendingForm {
  tokens?: number
}

interface FundPendingCardProps {
  campaign: Campaign
  onSuccess?: (proposalId: string) => void | Promise<void>
}

export const FundPendingCard: FunctionComponent<FundPendingCardProps> = ({
  campaign,
  onSuccess,
}) => {
  const {
    govToken: {
      daoBalance: govTokenDAOBalance,
      symbol: govTokenSymbol,
      supply: govTokenSupply,
    },
  } = campaign

  const {
    handleSubmit,
    register,
    formState: { errors },
    watch,
  } = useForm<FundPendingForm>({
    mode: "onChange",
    defaultValues: {},
  })

  const { connected } = useWallet()

  const fundPendingTokens = watch("tokens") || 0
  const { fundPendingCampaign, fundPendingCampaignError } =
    useFundPendingCampaign(campaign)

  const doFundPending = async ({ tokens }: FundPendingForm) => {
    if (!tokens) return

    const proposalId = await fundPendingCampaign(tokens)
    proposalId && (await onSuccess?.(proposalId))
  }

  return (
    <CardWrapper className="lg:self-stretch border border-orange">
      <form onSubmit={handleSubmit(doFundPending)}>
        <p className="text-orange">
          This campaign is pending and cannot accept funds until the DAO
          allocates governance tokens ({govTokenSymbol}) to it.{" "}
          <span className="underline">
            If you are part of the DAO, you can create a funding proposal below.
          </span>
        </p>

        <div className="flex flex-col items-stretch mt-4 sm:flex-row sm:items-stretch">
          <FormInput
            type="number"
            inputMode="decimal"
            placeholder="1000000"
            wrapperClassName="!mb-4 sm:!mb-0 sm:mr-4 sm:flex-1"
            className="!pr-28 border-light"
            tail={govTokenSymbol}
            error={
              errors?.tokens?.message ?? fundPendingCampaignError ?? undefined
            }
            disabled={!connected}
            accent={
              govTokenSupply
                ? `This will allocate ${fundPendingTokens} ${
                    govTokenSymbol ?? "governance tokens"
                  } (${prettyPrintDecimal(
                    (100 * fundPendingTokens) / govTokenSupply,
                    2
                  )}% of total supply) from the DAO's treasury to the campaign to be distributed among the backers.`
                : undefined
            }
            accentClassName="text-light"
            {...register("tokens", {
              valueAsNumber: true,
              pattern: numberPattern,
              min: {
                value: 1e-6,
                message: `Must be at least 0.000001 ${govTokenSymbol}.`,
              },
              max: {
                value: govTokenDAOBalance ?? 0,
                message: `Must be less than or equal to the amount of ${govTokenSymbol} the DAO has in its treasury: ${prettyPrintDecimal(
                  govTokenDAOBalance ?? 0
                )} ${govTokenSymbol}.`,
              },
            })}
          />

          <Button
            disabled={!connected}
            className="sm:h-[50px]"
            submitLabel="Propose"
          />
        </div>
      </form>
    </CardWrapper>
  )
}
