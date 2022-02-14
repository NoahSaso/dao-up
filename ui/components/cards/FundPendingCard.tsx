import { FC, useState } from "react"
import { useForm } from "react-hook-form"

import { daoUrlPrefix } from "../../helpers/config"
import { numberPattern } from "../../helpers/form"
import { prettyPrintDecimal } from "../../helpers/number"
import { useFundPendingCampaign } from "../../hooks/useFundPendingCampaign"
import { useWallet } from "../../hooks/useWallet"
import { Button, ButtonLink, CardWrapper, FormInput } from ".."

interface FundPendingForm {
  tokens?: number
}

interface FundPendingCardProps {
  campaign: Campaign
}

export const FundPendingCard: FC<FundPendingCardProps> = ({ campaign }) => {
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
  const [fundCampaignProposalUrl, setFundCampaignProposalUrl] = useState("")
  const { fundPendingCampaign, fundPendingCampaignError } =
    useFundPendingCampaign(campaign)

  const doFundPending = async ({ tokens }: FundPendingForm) => {
    setFundCampaignProposalUrl("")
    if (!tokens) return

    // TODO: Add success display.
    const proposalId = await fundPendingCampaign(tokens)
    // Open proposal on DAO DAO if created.
    if (proposalId) {
      setFundCampaignProposalUrl(
        daoUrlPrefix + `${campaign.dao.address}/proposals/${proposalId}`
      )
    }
  }

  return (
    <CardWrapper className="lg:self-stretch border border-orange">
      <form onSubmit={handleSubmit(doFundPending)}>
        {fundCampaignProposalUrl ? (
          <>
            <p className="mb-4 text-green">
              Proposal successfully created! This campaign will activate once
              the proposal is approved and executed on DAO DAO.
            </p>
            <ButtonLink href={fundCampaignProposalUrl} cardOutline>
              View Proposal
            </ButtonLink>
          </>
        ) : (
          <>
            <p className="text-orange">
              This campaign is pending and cannot accept funds until the DAO
              allocates governance tokens ({govTokenSymbol}) to it.{" "}
              <span className="underline">
                If you are part of the DAO, you can create a funding proposal
                below.
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
                  errors?.tokens?.message ??
                  fundPendingCampaignError ??
                  undefined
                }
                disabled={!!fundCampaignProposalUrl || !connected}
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
                disabled={!!fundCampaignProposalUrl || !connected}
                className="sm:h-[50px]"
                submitLabel="Propose"
              />
            </div>
          </>
        )}
      </form>
    </CardWrapper>
  )
}
